import { useState } from 'react';
import ModelViewer from './components/ModelViewer';

type ModelInfo = {
  name: string;
  url: string;
  description: string;
  icon: string;
  tags: string[];
};

const DEMO_MODELS: ModelInfo[] = [
  {
    name: 'Damaged Helmet',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf',
    description: '损坏的飞行员头盔，展示 PBR 材质与磨损效果',
    icon: '🪖',
    tags: ['PBR', '金属'],
  },
  {
    name: 'Avocado',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Avocado/glTF/Avocado.gltf',
    description: '牛油果模型，带细腻纹理贴图',
    icon: '🥑',
    tags: ['纹理', '自然'],
  },
];

const Header = () => (
  <div className="px-5 py-5 border-b border-gray-800/80">
    <div className="flex items-center gap-3 mb-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
        <svg
          className="h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
          />
        </svg>
      </div>
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight">React 3D Viewer</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">模型预览演示</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {['React 19', 'Three.js', 'Tailwind'].map((tech) => (
        <span
          key={tech}
          className="inline-flex items-center rounded-full bg-gray-800 px-2.5 py-0.5 text-[10px] font-medium text-gray-400 border border-gray-700/50"
        >
          {tech}
        </span>
      ))}
    </div>
  </div>
);

const ModelCard = ({
  model,
  isActive,
  onClick,
  index,
}: {
  model: ModelInfo;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) => (
  <button
    onClick={onClick}
    style={{ animationFillMode: 'forwards', opacity: 0 }}
    className={`group relative w-full rounded-xl text-left transition-all duration-300 ease-out
      animate-fade-in card-delay-${index + 1}
      ${
        isActive
          ? 'bg-gradient-to-br from-primary-600/15 via-primary-700/10 to-transparent border border-primary-500/40 shadow-md shadow-primary-500/8'
          : 'bg-gray-800/30 border border-gray-800/80 hover:border-gray-700 hover:bg-gray-800/60 hover:shadow-lg hover:shadow-gray-900/30 hover:-translate-y-0.5'
      }`}
  >
    {isActive && (
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b from-primary-400 to-primary-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
    )}
    <div className="px-4 py-3.5 flex items-start gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg transition-all duration-300
          ${
            isActive
              ? 'bg-primary-600/20 ring-1 ring-primary-500/30 shadow-sm shadow-primary-500/20 scale-105'
              : 'bg-gray-800 group-hover:bg-gray-700/80'
          }`}
      >
        {model.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold truncate transition-colors duration-300
              ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}
          >
            {model.name}
          </span>
          {isActive && (
            <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400 animate-glow-pulse" />
          )}
        </div>
        <p className="mt-1 text-[11px] text-gray-500 leading-relaxed line-clamp-2 group-hover:text-gray-400 transition-colors duration-300">
          {model.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {model.tags.map((tag) => (
            <span
              key={tag}
              className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors duration-300
                ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-300 border border-primary-500/20'
                    : 'bg-gray-800 text-gray-500 border border-gray-700/50 group-hover:border-gray-600 group-hover:text-gray-400'
                }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  </button>
);

const Footer = () => (
  <div className="px-5 py-3.5 border-t border-gray-800/80">
    <p className="text-[11px] text-gray-600 leading-relaxed flex items-center gap-2">
      <svg
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
        />
      </svg>
      左键旋转 · 滚轮缩放 · 右键平移
    </p>
  </div>
);

export default function App() {
  const [currentModel, setCurrentModel] = useState<ModelInfo>(DEMO_MODELS[0]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950">
      {/* 侧边栏 */}
      <aside className="w-80 shrink-0 border-r border-gray-800/80 bg-gray-900/95 backdrop-blur-sm flex flex-col">
        <Header />
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-1.5">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
              模型列表
            </p>
            <span className="text-[10px] text-gray-600">{DEMO_MODELS.length} 个模型</span>
          </div>
          {DEMO_MODELS.map((model, i) => (
            <ModelCard
              key={model.name}
              model={model}
              index={i}
              isActive={currentModel.name === model.name}
              onClick={() => setCurrentModel(model)}
            />
          ))}
        </div>
        <Footer />
      </aside>

      {/* 3D 预览区 */}
      <main className="flex-1 relative">
        <ModelViewer key={currentModel.url} modelUrl={currentModel.url} />
        <div className="absolute bottom-5 left-5 px-3.5 py-2 rounded-xl bg-gray-900/85 backdrop-blur-md border border-gray-800/80 shadow-xl shadow-black/20">
          <div className="flex items-center gap-2.5">
            <span className="text-base">
              {DEMO_MODELS.find((m) => m.name === currentModel.name)?.icon}
            </span>
            <div>
              <span className="text-xs font-medium text-gray-300">{currentModel.name}</span>
              <span className="text-[10px] text-gray-600 ml-2">GLTF</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
