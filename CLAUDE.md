# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # Webpack dev server on port 3000 with HMR
npm run build       # Production build to dist/
npm start           # Dev server + auto-open browser
npm run lint        # ESLint check (src/**/*.{ts,tsx})
npm run lint:fix    # ESLint auto-fix
npm run format      # Prettier format (src/**/*.{ts,tsx,css})
npm run format:check # Prettier check only (CI)
```

## Architecture

### Build pipeline

```
index.html → HtmlWebpackPlugin (template)
src/index.tsx → ts-loader → bundle.js
src/styles/globals.css → postcss-loader (Tailwind + Autoprefixer) → css-loader → style-loader (dev) / MiniCssExtractPlugin (prod)
```

- Webpack 5 config is a function `(env, argv)` — mode-dependent: style-loader in dev, MiniCssExtractPlugin in prod.
- Path alias `@` → `src/` configured in both `tsconfig.json` (`paths`) and `webpack.config.js` (`resolve.alias`).
- `.gltf` / `.glb` files use Webpack 5 `asset/resource` module type (copied to output, returns URL).
- `moduleResolution: "bundler"` in tsconfig — Three.js example imports need `.js` extensions (`three/examples/jsm/loaders/GLTFLoader.js`).

### Component structure

**App.tsx** — Layout shell: dark sidebar (model selection) + fullscreen 3D viewport. Manages `currentModel` state (name + URL). Passes `key={currentModel.url}` to `ModelViewer` so React remounts the component on model switch, which triggers fresh scene init + load cycle.

**ModelViewer.tsx** — Three.js rendering via imperative refs (no React state for 3D internals). Two `useEffect` hooks:

1. **Mount once** (`[]` deps): Creates `Scene`, `PerspectiveCamera`, `WebGLRenderer`, 3-point lighting, procedural gradient environment map, `PolarGridHelper`, `OrbitControls`, and the `requestAnimationFrame` loop. Cleans up everything on unmount via `dispose()`.
2. **Load model** (`[modelUrl]` dep): Tears down previous model (dispose geometry/materials/textures), then loads new GLTF via `GLTFLoader` + `DRACOLoader` (Google CDN decoder). Auto-centers and scales the model via `Box3`.

Three.js objects are stored in `useRef` (not `useState`) to avoid React re-renders on every frame. Resource disposal is critical — geometries, materials, and textures must be explicitly freed when switching models or unmounting.

### Tailwind

Custom `primary` color scale (blue) added in `tailwind.config.js`. Reusable button components (`.btn`, `.btn-primary`, `.btn-outline`) defined in `globals.css` via `@layer components` with `@apply`. Dark theme throughout — `bg-gray-950`, `text-white`.
