import { useState, useCallback } from 'react';

const imgBackground =
  'https://www.figma.com/api/mcp/asset/139aeb56-2f0e-4b0f-b10b-95b0ae59c818';
const img09 =
  'https://www.figma.com/api/mcp/asset/b80eb7b3-9664-4928-81b6-49f58faf2e03';

type ButtonState = 'default' | 'hover';

const CursorDefault = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 32 32">
    <path
      d="M8.44 3.52L9.14 3.28L8.44 3.52ZM9.14 3.28L8.44 3.52L8.44 3.52L9.14 3.28ZM9.84 3.04L9.84 3.04L9.84 3.04ZM8.43 3.51L8.43 3.52L8.43 3.51ZM7.73 3.76L7.73 3.76L7.73 3.76ZM7.03 4L7.03 4L7.03 4ZM7.21 5.25L5.76 12.68L7.21 5.25ZM7.21 5.25L7.21 5.25L7.21 5.25ZM6.65 7.08L6.65 7.08L6.65 7.08ZM5.65 10.46L9.31 6.35L5.65 10.46ZM5.97 11.43L5.97 11.43L5.97 11.43ZM7.62 14.28L7.12 10.13L7.62 14.28Z"
      fill="white"
    />
    <path
      d="M9.14 3.28L12.41 21.02L17.67 15.82L24.27 24.97L20.22 21.02L13.14 17.97L9.14 3.28Z"
      fill="white"
    />
  </svg>
);

const CursorPointer = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 32 32">
    <path
      d="M8.5 3.52L9.2 3.28L8.5 3.52ZM9.2 3.28L8.5 3.52L8.5 3.52L9.2 3.28Z"
      fill="white"
    />
    <path
      d="M9.2 3.28L12.47 21.02L17.73 15.82L22 21.5L19.5 19L15 16.5L9.2 3.28Z"
      fill="white"
    />
    <circle cx="19" cy="16" r="4" fill="#56ccf2" stroke="white" strokeWidth="1.5" />
  </svg>
);

export default function TutorialPage() {
  const [defaultBtnState, setDefaultBtnState] = useState<ButtonState>('default');
  const [hoverBtnState, setHoverBtnState] = useState<ButtonState>('default');

  const handleDefaultEnter = useCallback(() => setDefaultBtnState('hover'), []);
  const handleDefaultLeave = useCallback(() => setDefaultBtnState('default'), []);
  const handleHoverEnter = useCallback(() => setHoverBtnState('hover'), []);
  const handleHoverLeave = useCallback(() => setHoverBtnState('default'), []);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-950 p-6">
      <div className="relative w-full max-w-[685px] h-[492px] rounded-lg overflow-hidden shadow-2xl shadow-black/40">
        {/* Background */}
        <img
          alt=""
          className="absolute inset-0 size-full object-cover"
          src={imgBackground}
        />

        {/* Left white panel */}
        <div className="absolute left-0 top-0 h-full w-[401px] bg-[#fafafa] flex flex-col">
          <h2 className="mt-8 ml-8 text-[20px] font-bold text-black tracking-[-0.34px] leading-8">
            Use components
          </h2>
          <p className="mt-2 ml-8 text-[11px] text-black/80 leading-4 tracking-[0.055px] max-w-[337px] whitespace-pre-wrap">
            Drag and drop components onto your canvas from the Assets panel. If you&apos;re on an
            Education, Professional, or Organization team, you can publish them for team members to
            use across their own files.
          </p>

          {/* Screenshot area */}
          <div className="mt-4 ml-8 w-[337px] h-[300px] rounded-lg overflow-hidden bg-gray-100">
            <img alt="" className="size-full object-cover" src={img09} />
          </div>
        </div>

        {/* Right side: instruction text */}
        <p className="absolute left-[545px] top-[124px] w-[252px] text-[11px] font-bold text-[#007be5] text-center leading-4 tracking-[0.055px] -translate-x-1/2">
          Drag the correct cursor component over these buttons to show default and hover states
        </p>

        {/* Arrow (rotated to point down) */}
        <div className="absolute left-[545px] top-[172px] flex items-center justify-center w-0 h-[30px]">
          <svg
            className="h-[30px] w-3 text-blue-500/60"
            fill="currentColor"
            viewBox="0 0 12 30"
          >
            <path d="M6 0L6 28M6 28L1 22M6 28L11 22" stroke="currentColor" strokeWidth={1.5} />
          </svg>
        </div>

        {/* Default button */}
        <button
          className={`absolute left-[458px] top-[220px] h-[38px] w-[68px] rounded-full flex items-center justify-center
            text-[12px] font-medium text-white transition-all duration-200
            ${defaultBtnState === 'hover' ? 'bg-[#359dd9] scale-105 shadow-lg shadow-[#359dd9]/40' : 'bg-[#56ccf2]'}`}
          onMouseEnter={handleDefaultEnter}
          onMouseLeave={handleDefaultLeave}
        >
          Default
        </button>

        {/* Hover button */}
        <button
          className={`absolute left-[570px] top-[220px] h-[38px] w-[61px] rounded-full flex items-center justify-center
            text-[12px] font-medium text-white transition-all duration-200
            ${hoverBtnState === 'hover' ? 'bg-[#56ccf2] scale-105 shadow-lg shadow-[#56ccf2]/40' : 'bg-[#359dd9]'}`}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
        >
          Hover
        </button>

        {/* Cursor icons */}
        <div className="absolute left-[538px] top-[280px]">
          <CursorDefault />
        </div>
        <div className="absolute left-[590px] top-[280px]">
          <CursorPointer />
        </div>
      </div>
    </div>
  );
}
