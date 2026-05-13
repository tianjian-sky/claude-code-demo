import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const LOAD_TIMEOUT_MS = 30_000;

type ModelViewerProps = {
  modelUrl: string;
  envMapUrl?: string;
};

type LoadStatus =
  | { type: 'idle' }
  | { type: 'loading'; progress: number }
  | { type: 'success' }
  | { type: 'error'; error: LoadError };

type LoadError = {
  /** 机器可读的错误分类 */
  kind: 'timeout' | 'not-found' | 'format' | 'network' | 'unknown';
  /** 用户可读的中文错误信息 */
  message: string;
};

function classifyLoadError(err: unknown, url: string): LoadError {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();

    // DOMException / AbortError → timeout
    if (err.name === 'AbortError' || msg.includes('timeout')) {
      return {
        kind: 'timeout',
        message: `模型加载超时，请检查网络连接后重试`,
      };
    }

    // HTTP 404 / 文件不存在
    if (msg.includes('404') || msg.includes('not found') || msg.includes('not_found')) {
      return {
        kind: 'not-found',
        message: `模型文件不存在：${url}`,
      };
    }

    // 格式不匹配 / 解析失败
    if (
      msg.includes('json') ||
      msg.includes('parse') ||
      msg.includes('format') ||
      msg.includes('invalid') ||
      msg.includes('unexpected token') ||
      msg.includes('gltf')
    ) {
      return {
        kind: 'format',
        message: `模型文件格式错误，无法解析`,
      };
    }

    // 网络错误
    if (
      msg.includes('network') ||
      msg.includes('fetch') ||
      msg.includes('failed to fetch') ||
      msg.includes('cors')
    ) {
      return {
        kind: 'network',
        message: `网络请求失败：${err.message}`,
      };
    }

    return { kind: 'unknown', message: `加载失败：${err.message}` };
  }

  return { kind: 'unknown', message: `未知错误，请稍后重试` };
}

type LoaderStrategy = {
  loader: THREE.Loader;
  extractModel: (result: unknown) => THREE.Group;
  dispose: () => void;
};

function getLoaderStrategy(url: string): LoaderStrategy {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();

  if (ext === 'obj') {
    return {
      loader: new OBJLoader(),
      extractModel: (result) => result as THREE.Group,
      dispose: () => {},
    };
  }

  // GLTF / GLB (default)
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  return {
    loader,
    extractModel: (result: unknown) => (result as { scene: THREE.Group }).scene,
    dispose: () => dracoLoader.dispose(),
  };
}

function setupModel(model: THREE.Group): void {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 1.5 / maxDim : 1;

  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

export default function ModelViewer({ modelUrl }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    controls: null as OrbitControls | null,
    model: null as THREE.Group | null,
    animationId: 0,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>({ type: 'idle' });

  const cleanupModel = useCallback(() => {
    const oldModel = stateRef.current.model;
    if (oldModel) {
      oldModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((m) => {
              Object.values(m).forEach((v) => {
                if (v instanceof THREE.Texture) v.dispose();
              });
              m.dispose();
            });
          }
        }
      });
      stateRef.current.scene?.remove(oldModel);
      stateRef.current.model = null;
    }
  }, []);

  const dispose = useCallback(() => {
    const state = stateRef.current;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (state.animationId) cancelAnimationFrame(state.animationId);
    cleanupModel();
    state.renderer?.dispose();
    state.controls?.dispose();
    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.controls = null;
  }, [cleanupModel]);

  // --- 初始化 Three.js 基础设施 ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.01,
      100,
    );
    camera.position.set(0.8, 0.6, 1.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 光照
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const keyLight = new THREE.DirectionalLight(0xffffff, 4);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.5);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfbbf24, 1.5);
    rimLight.position.set(0, -0.5, -5);
    scene.add(rimLight);

    // 环境贴图
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 512;
    bgCanvas.height = 512;
    const ctx = bgCanvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(0.5, '#1e1e2e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgTexture;
    scene.environment = bgTexture;
    scene.environmentIntensity = 0.3;

    // 地面参考网格
    const gridHelper = new THREE.PolarGridHelper(1.5, 16, 10, 64, 0x444466, 0x444466);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.3;
    controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI * 0.75;
    controls.target.set(0, -0.1, 0);
    controls.update();

    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;
    stateRef.current.controls = controls;

    function animate() {
      stateRef.current.animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      dispose();
    };
  }, [dispose]);

  // --- 加载模型（GLTF / GLB / OBJ，含超时 + 错误处理）---
  useEffect(() => {
    const { scene } = stateRef.current;
    if (!scene) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    cleanupModel();
    setLoadStatus({ type: 'loading', progress: 0 });

    const strategy = getLoaderStrategy(modelUrl);

    const timeoutId = setTimeout(() => {
      const error: LoadError = {
        kind: 'timeout',
        message: `模型加载超时（超过 ${LOAD_TIMEOUT_MS / 1000} 秒），请检查网络连接后重试`,
      };
      setLoadStatus({ type: 'error', error });
    }, LOAD_TIMEOUT_MS);
    timeoutRef.current = timeoutId;

    strategy.loader.load(
      modelUrl,
      (result) => {
        clearTimeout(timeoutId);
        timeoutRef.current = null;

        const model = strategy.extractModel(result);
        setupModel(model);
        scene.add(model);
        stateRef.current.model = model;
        setLoadStatus({ type: 'success' });
      },
      (event: { loaded: number; total: number }) => {
        if (event.total > 0) {
          setLoadStatus({ type: 'loading', progress: event.loaded / event.total });
        }
      },
      (err: unknown) => {
        clearTimeout(timeoutId);
        timeoutRef.current = null;
        const error = classifyLoadError(err, modelUrl);
        setLoadStatus({ type: 'error', error });
      },
    );

    return () => {
      clearTimeout(timeoutId);
      strategy.dispose();
    };
  }, [modelUrl, cleanupModel]);

  // --- 重试处理 ---
  const handleRetry = useCallback(() => {
    // 通过切换 URL key 来重新触发加载效果
    // 先设 idle，再触发生命周期中的重新加载
    setLoadStatus({ type: 'idle' });
    // 使用微延迟确保 React 处理了 idle 状态后再触发重新加载
    setTimeout(() => {
      setLoadStatus({ type: 'loading', progress: 0 });
    }, 50);
  }, []);

  // 强制重新触发加载 effect（当重试时）
  const [retryKey, setRetryKey] = useState(0);
  const handleRetryWithKey = useCallback(() => {
    handleRetry();
    setRetryKey((k: number) => k + 1);
  }, [handleRetry]);

  const status = loadStatus;

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* 加载中 */}
      {status.type === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center">
              <svg
                className="h-8 w-8 animate-spin text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <span className="text-xs text-gray-400">
              加载中{status.progress > 0 ? ` ${Math.round(status.progress * 100)}%` : '...'}
            </span>
          </div>
        </div>
      )}

      {/* 错误 */}
      {status.type === 'error' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 max-w-xs text-center px-6 py-8 rounded-2xl bg-gray-900/90 border border-gray-800 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">
                {status.error.kind === 'timeout' && '加载超时'}
                {status.error.kind === 'not-found' && '文件不存在'}
                {status.error.kind === 'format' && '格式错误'}
                {status.error.kind === 'network' && '网络错误'}
                {status.error.kind === 'unknown' && '加载失败'}
              </p>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{status.error.message}</p>
            </div>
            <button
              onClick={handleRetryWithKey}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600/20 px-4 py-2 text-xs font-medium text-primary-300
                         border border-primary-500/30 hover:bg-primary-600/30 active:scale-95 transition-all duration-200"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                />
              </svg>
              重新加载
            </button>
          </div>
        </div>
      )}

      {/* 隐藏的 key 用于强制重新触发加载 */}
      <span data-retry-key={retryKey} className="hidden" />
    </div>
  );
}
