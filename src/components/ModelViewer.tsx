import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

type ModelViewerProps = {
  modelUrl: string;
  envMapUrl?: string;
};

type LoadState = 'idle' | 'loading' | 'success' | 'error';

export default function ModelViewer({ modelUrl }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    controls: null as OrbitControls | null,
    model: null as THREE.Group | null,
    animationId: 0,
    loadState: 'idle' as LoadState,
  });

  const dispose = useCallback(() => {
    const state = stateRef.current;
    if (state.animationId) cancelAnimationFrame(state.animationId);
    if (state.model) {
      state.model.traverse((child) => {
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
      state.scene?.remove(state.model);
      state.model = null;
    }
    state.renderer?.dispose();
    state.controls?.dispose();
    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.controls = null;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 初始化 Three.js 基础设施 ---
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

    // --- 光照 ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.5);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfbbf24, 1.5);
    rimLight.position.set(0, -0.5, -5);
    scene.add(rimLight);

    // --- 环境贴图 (渐变背景) ---
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

    // --- 地面参考网格 ---
    const gridHelper = new THREE.PolarGridHelper(1.5, 16, 10, 64, 0x444466, 0x444466);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    // --- OrbitControls ---
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

    // --- 动画循环 ---
    function animate() {
      stateRef.current.animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // --- 窗口大小自适应 ---
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
  }, [dispose]); // 只在挂载时初始化一次

  // --- 加载 GLTF 模型 ---
  useEffect(() => {
    const { scene } = stateRef.current;
    if (!scene) return;

    // 移除旧模型
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
      scene.remove(oldModel);
      stateRef.current.model = null;
    }

    stateRef.current.loadState = 'loading';

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // 自动居中与缩放
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim;

        model.scale.setScalar(scale);
        model.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale,
        );

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        stateRef.current.model = model;
        stateRef.current.loadState = 'success';
      },
      undefined, // onProgress
      () => {
        stateRef.current.loadState = 'error';
      },
    );

    return () => {
      dracoLoader.dispose();
    };
  }, [modelUrl]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
