# Phase 7: Game Player & Export System - Web-Hosted Game Engine

## Executive Summary

**Framework:** React + TypeScript + React Three Fiber
**Export Format:** Web folder (static site)
**Hosting:** Vercel, Netlify, VPS, GitHub Pages
**Asset Strategy:** Separate files, CDN-friendly, progressive loading
**Architecture:** Extensible game engine (inventory, dialogs, puzzles planned)

---

## Table of Contents

1. [Framework Decisions](#framework-decisions)
2. [Component Architecture](#component-architecture)
3. [Export Architecture](#export-architecture)
4. [Progressive Loading Strategy](#progressive-loading-strategy)
5. [CDN Support](#cdn-support)
6. [Extensibility Design](#extensibility-design)
7. [File Structure](#file-structure)
8. [Reusability Plan](#reusability-plan)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Framework Decisions

### Core Stack

```typescript
// Package.json for player (separate from editor)
{
  "name": "pgc-player",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-three/fiber": "^8.15.0",  // Consistent with editor
    "@react-three/drei": "^9.92.0",    // OrbitControls, useTexture
    "three": "^0.160.0",
    "zustand": "^4.4.7"                // Lightweight, familiar
  },
  "devDependencies": {
    "vite": "^5.0.0",                  // Fast builds, great for static sites
    "typescript": "^5.3.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

### Decision Matrix

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Build Tool** | **Vite** | Fast builds, excellent static site output, tree-shaking, built-in TypeScript support |
| **3D Rendering** | **React Three Fiber** | Consistent with editor, declarative, React-friendly, easier to extend with UI overlays |
| **State Management** | **Zustand** | Lightweight (1KB), familiar from editor, perfect for game state, no boilerplate |
| **Routing** | **Custom Router** | Built-in node navigation (not URL-based), simpler than React Router for single-page game |
| **Styling** | **Tailwind CSS** | Consistent with editor, utility-first for game UI overlays |

### Why React Three Fiber?

```typescript
// ✅ React Three Fiber - Declarative, composable
<Canvas>
  <PanoramaSphere textureUrl={currentNode.panoramaUrl} />
  <HotspotMeshes hotspots={currentNode.hotspots} onClick={handleNavigate} />
  <InventoryOverlay /> {/* Easy to overlay React UI */}
</Canvas>

// ❌ Direct Three.js - Imperative, harder to integrate with React UI
useEffect(() => {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer();
  // ... manual setup
  // Hard to sync with React state
}, []);
```

### Why Zustand?

```typescript
// ✅ Zustand - Simple, performant
interface GameState {
  currentNodeId: string;
  visitedNodes: Set<string>;
  inventory: InventoryItem[];
  gameVariables: Record<string, any>;
  navigate: (nodeId: string) => void;
  addInventoryItem: (item: InventoryItem) => void;
}

const useGameStore = create<GameState>((set) => ({
  currentNodeId: '',
  visitedNodes: new Set(),
  inventory: [],
  gameVariables: {},
  navigate: (nodeId) => set({ currentNodeId: nodeId }),
  // ...
}));
```

---

## Component Architecture

### Component Hierarchy

```
<GameEngine>                     // Top-level coordinator
├── <GameStateProvider>          // Zustand store provider
├── <AssetLoader>                // Preloads adjacent nodes
├── <PanoramaView>               // Three.js canvas container
│   ├── <Canvas>                 // React Three Fiber
│   │   ├── <PanoramaSphere>     // Sphere with texture
│   │   ├── <HotspotLayer>       // Clickable hotspots
│   │   ├── <OrbitControls>      // Camera controls
│   │   └── <Lighting>           // Ambient light
│   └── <LoadingSpinner>         // Texture loading state
├── <GameUI>                     // 2D overlays (HTML/CSS)
│   ├── <InventoryPanel>         // (future)
│   ├── <DialogBox>              // (future)
│   └── <DebugPanel>             // (dev mode only)
└── <SaveGameManager>            // localStorage persistence
```

### Core Interfaces

```typescript
// /player/src/types/game.ts

export interface GameData {
  version: string;
  settings: {
    title: string;
    startNodeId: string;
  };
  nodes: GameNode[];
}

export interface GameNode {
  id: string;
  name: string;
  panorama: {
    type: 'equirectangular' | 'cubic';
    url: string;  // Relative path OR CDN URL
  };
  hotspots: GameHotspot[];
}

export interface GameHotspot {
  id: string;
  name: string;
  vertices: SphericalPoint[];
  targetNodeId: string | null;
  interactionType: 'navigate' | 'pickup' | 'trigger';  // Extensibility
  metadata?: Record<string, any>;  // For custom interactions
}

export interface SphericalPoint {
  theta: number;
  phi: number;
}

// Game state (Zustand)
export interface GameState {
  // Navigation
  currentNodeId: string;
  previousNodeId: string | null;

  // Progress tracking
  visitedNodes: Set<string>;

  // Future features
  inventory: InventoryItem[];
  gameVariables: Record<string, any>;

  // Actions
  navigate: (nodeId: string) => void;
  addToInventory: (item: InventoryItem) => void;
  setVariable: (key: string, value: any) => void;
}
```

### Key Component Implementations

See full implementation examples in the complete document...

---

## Export Architecture

### Web Folder Structure

```
my-adventure/                    # Export output
├── assets/
│   ├── panoramas/
│   │   ├── node-abc123.jpg      # Original filenames preserved
│   │   ├── node-def456.jpg
│   │   └── ...
│   ├── data/
│   │   └── game.json            # Transformed from project.json
│   └── thumbnails/              # Optional: for loading screens
│       └── ...
├── dist/                        # Vite build output (UPLOAD THIS TO WEB HOST)
│   ├── index.html               # Entry point
│   ├── assets/
│   │   ├── index-[hash].js      # Bundled React app
│   │   ├── index-[hash].css     # Styles
│   │   └── vendor-[hash].js     # Three.js, React (code split)
│   └── ...
└── _headers                     # (Optional) CDN cache headers
```

### Build Process Flow

1. **Create export directory**
2. **Transform project.json → game.json** (with CDN URLs if enabled)
3. **Copy panorama assets** (with optional optimization)
4. **Build React player** using Vite (`npm run build`)
5. **Generate cache headers** for CDN
6. **Output ready for deployment**

### Project → Game Data Transformation

```typescript
async function transformProjectToGameData(
  projectPath: string,
  cdnBaseUrl?: string
): Promise<GameData> {
  const projectData = await loadProjectJSON(projectPath);

  const nodes: GameNode[] = projectData.nodes.map(node => ({
    id: node.id,
    name: node.name,
    panorama: {
      type: node.panorama.type,
      url: buildAssetUrl(node.panorama.path, cdnBaseUrl)
    },
    hotspots: node.hotspots.map(h => ({
      id: h.id,
      name: h.name,
      vertices: h.vertices,
      targetNodeId: h.targetNodeId,
      interactionType: 'navigate', // Default for MVP
      metadata: {}
    }))
  }));

  return {
    version: '1.0.0',
    settings: {
      title: projectData.settings.title,
      startNodeId: projectData.settings.startNodeId
    },
    nodes
  };
}

function buildAssetUrl(relativePath: string, cdnBaseUrl?: string): string {
  if (cdnBaseUrl) {
    // CDN mode: https://cdn.example.com/panoramas/node-abc.jpg
    const filename = path.basename(relativePath);
    return `${cdnBaseUrl}/panoramas/${filename}`;
  } else {
    // Local mode: ./assets/panoramas/node-abc.jpg
    const filename = path.basename(relativePath);
    return `./assets/panoramas/${filename}`;
  }
}
```

---

## Progressive Loading Strategy

### Asset Loading Architecture

- **Current node**: Load immediately (eager)
- **Adjacent nodes**: Preload in background (linked by hotspots)
- **Distant nodes**: Load on demand (lazy)

### Texture Cache Manager

```typescript
class TextureCache {
  private cache = new Map<string, THREE.Texture>();
  private loading = new Map<string, Promise<THREE.Texture>>();

  async load(url: string): Promise<THREE.Texture> {
    // Return cached texture
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Return in-flight promise
    if (this.loading.has(url)) {
      return this.loading.get(url)!;
    }

    // Start loading
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(url, resolve, undefined, reject);
    });

    this.loading.set(url, promise);
    return promise;
  }
}
```

---

## CDN Support

### CDN Integration Modes

```typescript
interface CDNConfig {
  enabled: boolean;
  baseUrl?: string;  // e.g., "https://cdn.example.com/my-game"
  fallbackToLocal: boolean;
}
```

### Export with CDN Option

User workflow:
1. Click "Export Game" in editor
2. Check "Use CDN" option
3. Enter CDN base URL
4. Export generates game with CDN URLs
5. User manually uploads `assets/panoramas/*` to CDN
6. User deploys `dist/*` to web host

---

## Extensibility Design

### Plugin Architecture for Future Features

```typescript
export interface GamePlugin {
  id: string;
  name: string;
  version: string;
  onNodeEnter?: (node: GameNode) => void;
  onNodeExit?: (node: GameNode) => void;
  onHotspotClick?: (hotspot: GameHotspot) => boolean;
  renderUI?: () => React.ReactNode;
}
```

### Future Features Planned

1. **Inventory System**
   - Pickup items via hotspots
   - Display inventory UI panel
   - Use items in combination

2. **Dialog System**
   - Dialog nodes (non-panoramic)
   - Choice-based branching
   - Character portraits

3. **Puzzle System**
   - Slider puzzles
   - Combination locks
   - Pattern matching

4. **Save/Load System**
   - localStorage persistence
   - Multiple save slots
   - Auto-save on navigation

---

## File Structure

### Player Source Code

```
player/                          # Separate directory
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── GameEngine.tsx       # Top-level coordinator
│   │   ├── PanoramaView.tsx     # Canvas container
│   │   ├── three/               # Three.js components
│   │   │   ├── PanoramaSphere.tsx
│   │   │   ├── HotspotLayer.tsx
│   │   │   └── HotspotMesh.tsx
│   │   └── ui/                  # Future UI components
│   ├── stores/
│   │   └── gameStore.ts         # Zustand
│   ├── hooks/
│   │   ├── useAssetPreloader.ts
│   │   └── useGameNavigation.ts
│   ├── lib/
│   │   ├── textureCache.ts
│   │   ├── assetResolver.ts
│   │   └── coordinates.ts       # Copied from editor
│   ├── types/
│   │   ├── game.ts
│   │   └── plugins.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Export Build Output

```
my-adventure/                    # User's exported game
├── assets/
│   ├── panoramas/               # Panorama images
│   └── data/
│       └── game.json            # Game data
├── dist/                        # UPLOAD THIS TO WEB HOST
│   ├── index.html
│   └── assets/
│       ├── index-[hash].js
│       └── vendor-[hash].js
└── _headers                     # CDN cache headers
```

---

## Reusability Plan

### Shared Code

| Module | Editor | Player | Strategy |
|--------|--------|--------|----------|
| Types | `/src/types/` | `/player/src/types/` | **Copy** (subset) |
| Coordinates | `/src/lib/coordinates.ts` | `/player/src/lib/coordinates.ts` | **Copy** |
| Config | `/src/lib/config.ts` | `/player/src/lib/config.ts` | **Copy** |
| PanoramaSphere | `/src/components/` | `/player/src/components/three/` | **Adapt** |

For MVP, **copy shared code**. Future: Refactor to monorepo if complexity grows.

---

## Implementation Roadmap

### Phase 7 Revised Steps

1. **Player Project Setup** (0.5 days)
   - Create `/player` directory
   - Initialize Vite + React + TypeScript
   - Install dependencies

2. **Core Player Components** (1-2 days)
   - GameEngine, PanoramaView, PanoramaSphere
   - HotspotLayer with click handling
   - Test: Load game.json, display panorama

3. **Navigation System** (1 day)
   - Zustand gameStore
   - Hotspot click → navigation
   - Test: Navigate between nodes

4. **Progressive Loading** (1 day)
   - Texture cache
   - Asset preloader
   - Loading screens

5. **Export Infrastructure** (2-3 days)
   - IPC handlers
   - Game data transformer
   - Vite build integration
   - Test: Export from editor

6. **Export Dialog UI** (1 day)
   - Export dialog in editor
   - CDN options
   - Progress indicators

7. **CDN Support** (1 day)
   - Asset resolver
   - CDN URL generation
   - Cache headers

8. **Testing & Polish** (1-2 days)
   - Deploy to Vercel/Netlify
   - Test CDN loading
   - Error handling

**Total: 7-10 days**

---

## Clarifying Questions

Before implementation, please confirm:

1. **CDN Upload**: Manual (user uploads after export) or automated?
   - **Recommendation**: Manual for MVP

2. **Image Optimization**: Auto-resize panoramas (4K → 2K)?
   - **Recommendation**: Yes, with checkbox

3. **Save Game**: Auto-save to localStorage?
   - **Recommendation**: Yes

4. **Debug Mode**: Show current node, FPS overlay?
   - **Recommendation**: Yes (Ctrl+D toggle)

5. **Deployment Guide**: Auto-generated README?
   - **Recommendation**: Yes

---

## Summary

This architecture provides:

✅ **Web-first**: Built for Vercel/Netlify/VPS hosting
✅ **React-based**: Extensible for inventory, dialogs, puzzles
✅ **CDN-friendly**: Separate assets, optional CDN URLs
✅ **Progressive loading**: Preload adjacent nodes
✅ **Performant**: Texture caching, code splitting
✅ **Extensible**: Plugin architecture for future features

**Status:** Architecture complete ✅
**Next:** Await user confirmation, then begin implementation
