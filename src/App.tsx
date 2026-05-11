import { useState } from 'react';
import ModelViewer from './components/ModelViewer';

type ModelInfo = {
  name: string;
  url: string;
  description: string;
};

const DEMO_MODELS: ModelInfo[] = [
  {
    name: 'Damaged Helmet',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf',
    description: 'Khronos glTF 官方示例 - 损坏的飞行员头盔 (PBR材质)',
  },
  {
    name: 'Avocado',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Avocado/glTF/Avocado.gltf',
    description: '牛油果模型 (带纹理)',
  },
];

export default function App() {
  const [currentModel, setCurrentModel] = useState<ModelInfo>(DEMO_MODELS[0]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-80 shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <h1 className="text-lg font-bold tracking-tight text-white">
            React 3D Viewer
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            React 19 + TypeScript + Webpack 5 + Tailwind CSS + Three.js
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">
            模型列表
          </p>
          {DEMO_MODELS.map((model) => (
            <button
              key={model.name}
              onClick={() => setCurrentModel(model)}
              className={`w-full rounded-lg px-4 py-3 text-left transition-all duration-200
                ${currentModel.name === model.name
                  ? 'bg-primary-600/20 border border-primary-500/50 text-white shadow-lg shadow-primary-500/10'
                  : 'bg-gray-800/50 border border-gray-800 hover:border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
            >
              <span className="block text-sm font-medium">
                {model.name}
              </span>
              <span className="block mt-0.5 text-xs text-gray-500 line-clamp-2">
                {model.description}
              </span>
            </button>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-600 leading-relaxed">
            鼠标左键旋转 · 滚轮缩放 · 右键平移 · 基于 Three.js + GLTFLoader
          </p>
        </div>
      </aside>

      {/* 3D 预览区 */}
      <main className="flex-1 relative bg-gray-950">
        <ModelViewer
          key={currentModel.url}
          modelUrl={currentModel.url}
        />
        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-md bg-gray-900/80 backdrop-blur-sm border border-gray-800">
          <span className="text-xs text-gray-400">{currentModel.name}</span>
        </div>
      </main>
    </div>
  );
}
