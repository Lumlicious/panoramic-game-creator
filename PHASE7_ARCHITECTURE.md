# Phase 7 Step 2: Game Player & Export Architecture

## Executive Summary

**Framework Recommendation:** Vanilla JS + Three.js
**Export Format (MVP):** Single HTML file with base64-embedded assets
**Rationale:** Minimize bundle size, eliminate React overhead, ensure maximum compatibility

---

## 1. Major Technical Decisions

### Decision A: Vanilla JS + Three.js (No React)

**Chosen: Vanilla JS + Three.js**

**Rationale:**
1. **Bundle Size:** React + React Three Fiber + deps = ~150KB minified. For a player that just navigates panoramas, this overhead isn't justified.
2. **Simplicity:** Player only needs basic DOM manipulation (show/hide UI, handle clicks). No complex state management needed.
3. **Performance:** Direct Three.js calls are faster than React Three Fiber's reconciliation layer.
4. **Portability:** Easier to embed in single HTML file without complex bundling.

**Trade-offs:**
- ❌ Can't directly reuse React components
- ✅ Can reuse all the Three.js logic (geometry, materials, raycasting)
- ✅ Can reuse utility functions (coordinates, triangulation)

### Decision B: Single HTML File (MVP)

**Chosen: Single HTML with base64-embedded panoramas**

**Rationale:**
1. **User Experience:** One file to share/host. Drag-and-drop simplicity.
2. **No Path Issues:** No relative path problems on different file systems.
3. **Easier Export Logic:** Bundle everything, write one file, done.

**File Size Concerns:**
- Base64 encoding increases size by ~33%
- Typical panorama: 2-5MB JPG → 3-7MB base64
- 10-node game: ~30-70MB HTML file (acceptable for MVP)
- Chrome/Firefox handle 100MB+ HTML files fine

**Future Enhancement (Phase 8+):**
- Add "Web Folder" export option for larger games
- Implement external asset loading for 50+ node games

### Decision C: Reuse Strategy

**Direct Reuse (Copy & Simplify):**
- `coordinates.ts` - All coordinate conversion functions
- `hotspotGeometry.ts` - Earcut triangulation logic
- `config.ts` - Constants (sphere radius, etc.)

**Adapt from Existing:**
- `PanoramaSphere.tsx` → `PanoramaRenderer.js` (Three.js only)
- `HotspotMesh.tsx` → `HotspotRenderer.js` (Three.js only)

**New Implementation:**
- `GamePlayer.js` - Main player orchestrator
- `NavigationManager.js` - Node navigation state machine
- `UIOverlay.js` - Minimal DOM overlay
- `exportPlayer.ts` - Export IPC handler
- `player-template.html` - HTML scaffold

---

## 2. Component Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────┐
│           player.html (Single File)      │
│  ┌───────────────────────────────────┐  │
│  │  <div id="game-container">        │  │
│  │    ├─ <canvas id="game-canvas">   │  │  ← Three.js renders here
│  │    └─ <div id="ui-overlay">       │  │  ← Minimal UI (title, help)
│  │         └─ <div id="hotspot-hint">│  │  ← Hover tooltip
│  └───────────────────────────────────┘  │
│                                          │
│  <script>                                │
│    // Embedded project JSON              │
│    const GAME_DATA = { ... };            │
│                                          │
│    // Embedded panorama images (base64) │
│    const ASSET_MAP = {                   │
│      "node-uuid-1": "data:image/jpeg;..." │
│    };                                    │
│                                          │
│    // Bundled player code                │
│    class GamePlayer { ... }              │
│    class PanoramaRenderer { ... }        │
│    class HotspotRenderer { ... }         │
│    // ... (all player logic)             │
│                                          │
│    // Bootstrap                          │
│    new GamePlayer(GAME_DATA, ASSET_MAP); │
│  </script>                               │
└─────────────────────────────────────────┘
```

### 2.2 Core Classes

#### GamePlayer (Main Orchestrator)

```typescript
class GamePlayer {
  private project: Project;
  private assetMap: Map<string, string>; // nodeId → data URI
  private currentNodeId: string;

  private panoramaRenderer: PanoramaRenderer;
  private hotspotRenderer: HotspotRenderer;
  private navigationManager: NavigationManager;
  private uiOverlay: UIOverlay;

  constructor(projectData: Project, assetMap: Record<string, string>) {
    this.project = projectData;
    this.assetMap = new Map(Object.entries(assetMap));

    // Find start node
    this.currentNodeId = this.findStartNode();

    // Initialize subsystems
    this.panoramaRenderer = new PanoramaRenderer(canvas);
    this.hotspotRenderer = new HotspotRenderer(this.panoramaRenderer.scene);
    this.navigationManager = new NavigationManager();
    this.uiOverlay = new UIOverlay();

    // Setup event handlers
    this.setupInteractions();

    // Load first node
    this.loadNode(this.currentNodeId);
  }

  private findStartNode(): string {
    const startNode = this.project.nodes.find(n => n.isStartNode);
    return startNode?.id || this.project.nodes[0]?.id;
  }

  private setupInteractions(): void {
    // Click handler for hotspot navigation
    this.panoramaRenderer.canvas.addEventListener('click', (e) => {
      const clickedHotspot = this.raycastHotspots(e);
      if (clickedHotspot?.targetNodeId) {
        this.navigateToNode(clickedHotspot.targetNodeId);
      }
    });

    // Hover handler for cursor changes
    this.panoramaRenderer.canvas.addEventListener('mousemove', (e) => {
      const hoveredHotspot = this.raycastHotspots(e);
      this.uiOverlay.setHotspotHint(hoveredHotspot?.name);
      this.panoramaRenderer.canvas.style.cursor =
        hoveredHotspot ? 'pointer' : 'grab';
    });
  }

  private loadNode(nodeId: string): void {
    const node = this.project.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Load panorama
    const imageDataUri = this.assetMap.get(nodeId);
    this.panoramaRenderer.loadPanorama(imageDataUri, node.panorama.type);

    // Load hotspots
    this.hotspotRenderer.setHotspots(node.hotspots);

    // Update UI
    this.uiOverlay.setNodeTitle(node.name);
    this.navigationManager.pushHistory(nodeId);
  }

  private navigateToNode(nodeId: string): void {
    this.currentNodeId = nodeId;
    this.loadNode(nodeId);
  }

  private raycastHotspots(event: MouseEvent): Hotspot | null {
    // Convert mouse to NDC, raycast against hotspot meshes
    // (Reuse raycasting logic from editor)
  }
}
```

#### PanoramaRenderer (Simplified PanoramaSphere)

```typescript
class PanoramaRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public canvas: HTMLCanvasElement;

  private controls: OrbitControls;
  private panoramaMesh: THREE.Mesh | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.enableDamping = true;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;

    this.animate();
  }

  loadPanorama(imageDataUri: string, type: PanoramaType): void {
    // Dispose old texture/mesh
    if (this.panoramaMesh) {
      this.panoramaMesh.geometry.dispose();
      (this.panoramaMesh.material as THREE.Material).dispose();
      this.scene.remove(this.panoramaMesh);
    }

    // Load texture from data URI
    const loader = new THREE.TextureLoader();
    loader.load(imageDataUri, (texture) => {
      const geometry = type === 'equirectangular'
        ? new THREE.SphereGeometry(SPHERE_RADIUS, 64, 64)
        : new THREE.BoxGeometry(SPHERE_RADIUS * 2, ...);

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide
      });

      this.panoramaMesh = new THREE.Mesh(geometry, material);
      if (type === 'equirectangular') {
        this.panoramaMesh.scale.x = -1; // Invert for inside-out view
      }
      this.scene.add(this.panoramaMesh);
    });
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
```

#### HotspotRenderer (Simplified HotspotMesh)

```typescript
class HotspotRenderer {
  private scene: THREE.Scene;
  private hotspotMeshes: Map<string, THREE.Mesh> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  setHotspots(hotspots: Hotspot[]): void {
    // Clear existing hotspots
    this.hotspotMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.scene.remove(mesh);
    });
    this.hotspotMeshes.clear();

    // Create new hotspot meshes
    hotspots.forEach(hotspot => {
      const mesh = this.createHotspotMesh(hotspot);
      this.hotspotMeshes.set(hotspot.id, mesh);
      this.scene.add(mesh);
    });
  }

  private createHotspotMesh(hotspot: Hotspot): THREE.Mesh {
    // Convert spherical polygon to 3D vertices
    const vertices3D = hotspot.polygon.map(pt =>
      sphericalToCartesian(pt.theta, pt.phi, HOTSPOT_RADIUS)
    );

    // Triangulate (reuse earcut logic from hotspotGeometry.ts)
    const geometry = triangulatePolygonOnSphere(vertices3D);

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { hotspotId: hotspot.id, hotspot };
    return mesh;
  }

  getHotspotByMesh(mesh: THREE.Mesh): Hotspot | null {
    return mesh.userData.hotspot || null;
  }
}
```

#### NavigationManager (History & State)

```typescript
class NavigationManager {
  private history: string[] = [];
  private currentIndex: number = -1;

  pushHistory(nodeId: string): void {
    // Remove forward history if navigating from middle
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(nodeId);
    this.currentIndex++;
  }

  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  goBack(): string | null {
    if (!this.canGoBack()) return null;
    this.currentIndex--;
    return this.history[this.currentIndex];
  }

  goForward(): string | null {
    if (!this.canGoForward()) return null;
    this.currentIndex++;
    return this.history[this.currentIndex];
  }
}
```

#### UIOverlay (Minimal DOM UI)

```typescript
class UIOverlay {
  private container: HTMLElement;
  private titleElement: HTMLElement;
  private hintElement: HTMLElement;

  constructor() {
    this.container = document.getElementById('ui-overlay')!;
    this.titleElement = document.getElementById('node-title')!;
    this.hintElement = document.getElementById('hotspot-hint')!;
  }

  setNodeTitle(title: string): void {
    this.titleElement.textContent = title;
    this.titleElement.style.display = 'block';
    // Fade out after 3 seconds
    setTimeout(() => {
      this.titleElement.style.opacity = '0';
    }, 3000);
  }

  setHotspotHint(hotspotName: string | undefined): void {
    if (hotspotName) {
      this.hintElement.textContent = hotspotName;
      this.hintElement.style.display = 'block';
    } else {
      this.hintElement.style.display = 'none';
    }
  }
}
```

---

## 3. File Structure

### 3.1 New Player Components

```
src/
└── renderer/
    └── src/
        └── player/                      # NEW: Player-specific code
            ├── core/
            │   ├── GamePlayer.ts        # Main orchestrator
            │   ├── PanoramaRenderer.ts  # Vanilla Three.js panorama
            │   ├── HotspotRenderer.ts   # Vanilla Three.js hotspots
            │   ├── NavigationManager.ts # History & state
            │   └── UIOverlay.ts         # DOM manipulation
            ├── utils/
            │   ├── coordinates.ts       # COPY from lib/coordinates.ts
            │   ├── hotspotGeometry.ts   # COPY from lib/hotspotGeometry.ts
            │   └── raycasting.ts        # NEW: Raycasting utilities
            ├── types/
            │   └── player.d.ts          # Player-specific types
            └── build/
                ├── bundlePlayer.ts      # Rollup/esbuild bundler
                └── template.html        # HTML scaffold

electron/
└── main/
    └── exportHandlers.ts                # NEW: Export IPC handler
```

### 3.2 Export Logic Location

```
electron/main/exportHandlers.ts          # IPC handler
src/renderer/src/player/build/           # Build scripts
```

---

## 4. Reusability Plan

### 4.1 Direct Reuse (Copy As-Is)

**From `src/renderer/src/lib/`:**
- ✅ `coordinates.ts` - All spherical ↔ cartesian conversions
- ✅ `config.ts` - Constants (SPHERE_RADIUS, HOTSPOT_RADIUS, etc.)

**From existing hotspot code:**
- ✅ Earcut triangulation logic (adapt to vanilla JS)

### 4.2 Adapt & Simplify

**PanoramaSphere.tsx → PanoramaRenderer.ts:**
```diff
- React component with hooks
- useFrame for animation loop
- useThree for scene access
+ Pure class with constructor
+ requestAnimationFrame loop
+ Direct Three.js scene management
```

**HotspotMesh.tsx → HotspotRenderer.ts:**
```diff
- React component per hotspot
- useState for hover/selection
+ Single class managing all hotspots
+ Direct mesh creation in loop
```

### 4.3 New Implementations

**GamePlayer.ts:**
- Main orchestration logic
- Event handling
- Navigation flow

**NavigationManager.ts:**
- History stack (back/forward buttons for future)
- State persistence (could save progress to localStorage)

**UIOverlay.ts:**
- Minimal DOM manipulation
- Fade-in/out animations

**exportHandlers.ts:**
- Read project.json
- Read panorama images
- Base64 encode images
- Inject into template
- Write output HTML

---

## 5. Export Architecture

### 5.1 IPC Flow

```
Renderer (Export button click)
  ↓
  window.electronAPI.exportGame(projectPath, outputPath)
  ↓
Main Process (exportHandlers.ts)
  ↓
  1. Read project.json from projectPath
  2. Read all panorama images from projectPath/assets/panoramas/
  3. Base64 encode all images → assetMap
  4. Bundle player code (GamePlayer.ts, etc.) → playerBundle.js
  5. Read template.html
  6. Inject: GAME_DATA, ASSET_MAP, playerBundle.js
  7. Write to outputPath (e.g., MyGame.html)
  ↓
Return { success: true, outputPath }
  ↓
Renderer (Show success toast)
```

### 5.2 Template Structure

**`src/renderer/src/player/build/template.html`:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{GAME_TITLE}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; font-family: sans-serif; }

    #game-container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }

    #game-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    #ui-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    #node-title {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-size: 18px;
      transition: opacity 0.5s;
    }

    #hotspot-hint {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 5px;
      font-size: 14px;
      display: none;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
    <div id="ui-overlay">
      <div id="node-title"></div>
      <div id="hotspot-hint"></div>
    </div>
  </div>

  <script>
    // ==================== EMBEDDED GAME DATA ====================
    const GAME_DATA = {{GAME_DATA_JSON}};
    const ASSET_MAP = {{ASSET_MAP_JSON}};

    // ==================== BUNDLED PLAYER CODE ====================
    {{PLAYER_BUNDLE_JS}}

    // ==================== BOOTSTRAP ====================
    window.addEventListener('DOMContentLoaded', () => {
      const canvas = document.getElementById('game-canvas');
      new GamePlayer(canvas, GAME_DATA, ASSET_MAP);
    });
  </script>
</body>
</html>
```

### 5.3 Asset Embedding Strategy

**Base64 Encoding:**

```typescript
// In exportHandlers.ts
async function embedAssets(projectPath: string, nodes: Node[]): Promise<Record<string, string>> {
  const assetMap: Record<string, string> = {};

  for (const node of nodes) {
    const imagePath = path.join(projectPath, 'assets', 'panoramas', `${node.id}.jpg`);
    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg'; // Could detect from file extension
    assetMap[node.id] = `data:${mimeType};base64,${base64}`;
  }

  return assetMap;
}
```

**File Size Optimization:**

For MVP, accept larger file sizes. Post-MVP optimizations:
1. Compress images to 2048px width (vs original 4096px+)
2. Convert PNG to JPG where possible
3. Quality adjustment (80-90% JPG quality)
4. Offer "Web Folder" export for 20+ node games

---

## 6. Player Build Process

### 6.1 Bundler Configuration

Use **esbuild** for fast bundling (already in project):

**`src/renderer/src/player/build/bundlePlayer.ts`:**

```typescript
import * as esbuild from 'esbuild';
import * as fs from 'fs-extra';

export async function bundlePlayerCode(): Promise<string> {
  const result = await esbuild.build({
    entryPoints: ['src/renderer/src/player/core/GamePlayer.ts'],
    bundle: true,
    minify: true,
    format: 'iife', // Immediately Invoked Function Expression
    globalName: 'GamePlayer', // Expose as global
    target: 'es2020',
    write: false, // Return as string, don't write to disk
    external: [], // Bundle everything
  });

  return result.outputFiles[0].text;
}
```

### 6.2 Export Handler Implementation

**`electron/main/exportHandlers.ts`:**

```typescript
import { ipcMain } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import { bundlePlayerCode } from '../renderer/src/player/build/bundlePlayer';

ipcMain.handle('export-game', async (event, projectPath: string, outputPath: string) => {
  try {
    // 1. Read project.json
    const projectJson = await fs.readFile(path.join(projectPath, 'project.json'), 'utf-8');
    const project = JSON.parse(projectJson);

    // 2. Embed assets
    const assetMap = await embedAssets(projectPath, project.nodes);

    // 3. Bundle player code
    const playerBundle = await bundlePlayerCode();

    // 4. Read template
    const templatePath = path.join(__dirname, '../renderer/src/player/build/template.html');
    let html = await fs.readFile(templatePath, 'utf-8');

    // 5. Inject data
    html = html
      .replace('{{GAME_TITLE}}', project.settings.projectName)
      .replace('{{GAME_DATA_JSON}}', JSON.stringify(project))
      .replace('{{ASSET_MAP_JSON}}', JSON.stringify(assetMap))
      .replace('{{PLAYER_BUNDLE_JS}}', playerBundle);

    // 6. Write output
    await fs.writeFile(outputPath, html, 'utf-8');

    return { success: true, outputPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

---

## 7. API/Interface Design

### 7.1 GamePlayer Constructor

```typescript
interface GamePlayerOptions {
  canvas: HTMLCanvasElement;
  project: Project;
  assetMap: Record<string, string>; // nodeId → data URI
  onNavigate?: (nodeId: string) => void; // Optional callback
}

class GamePlayer {
  constructor(options: GamePlayerOptions);

  // Public API (for future extensions)
  navigateToNode(nodeId: string): void;
  getCurrentNode(): Node;
  destroy(): void; // Cleanup
}
```

### 7.2 Preload API Extension

Add to `src/preload/index.ts`:

```typescript
const electronAPI = {
  // ... existing handlers

  // Export game
  exportGame: (projectPath: string, outputPath: string): Promise<{
    success: boolean;
    error?: string;
    outputPath?: string;
  }> => ipcRenderer.invoke('export-game', projectPath, outputPath),
};
```

### 7.3 Navigation Callback Interface

```typescript
type NavigationCallback = (event: NavigationEvent) => void;

interface NavigationEvent {
  type: 'navigate' | 'back' | 'forward';
  fromNodeId: string;
  toNodeId: string;
  timestamp: number;
}
```

---

## 8. Code Reuse Matrix

| Component | Source | Reuse Strategy |
|-----------|--------|----------------|
| Coordinate conversions | `lib/coordinates.ts` | ✅ Copy as-is |
| Constants | `lib/config.ts` | ✅ Copy as-is |
| Earcut triangulation | `lib/hotspotGeometry.ts` | ✅ Copy, remove React deps |
| Panorama rendering | `PanoramaSphere.tsx` | 🔄 Adapt to vanilla JS |
| Hotspot rendering | `HotspotMesh.tsx` | 🔄 Adapt to vanilla JS |
| Raycasting | `PanoramaSphere.tsx` | 🔄 Extract to utility |
| OrbitControls setup | `PanoramaSphere.tsx` | ✅ Copy Three.js setup |
| Project types | `types/project.ts` | ✅ Reuse (shared types) |

**Legend:**
- ✅ Direct copy
- 🔄 Adapt/simplify

---

## 9. Summary & Next Steps

### What We Decided

1. ✅ **Vanilla JS + Three.js** (no React) - Minimize bundle size
2. ✅ **Single HTML file** (base64 assets) - Simplicity for MVP
3. ✅ **Direct reuse** of coordinate/triangulation logic
4. ✅ **Adapted** panorama/hotspot renderers (remove React)
5. ✅ **New** GamePlayer orchestrator, export handler

### File Structure Created

```
src/renderer/src/player/
├── core/
│   ├── GamePlayer.ts
│   ├── PanoramaRenderer.ts
│   ├── HotspotRenderer.ts
│   ├── NavigationManager.ts
│   └── UIOverlay.ts
├── utils/
│   ├── coordinates.ts (copy)
│   ├── hotspotGeometry.ts (copy)
│   └── raycasting.ts (new)
├── build/
│   ├── bundlePlayer.ts
│   └── template.html
└── types/
    └── player.d.ts

electron/main/
└── exportHandlers.ts (new)
```

### Success Criteria for Phase 7 Step 2

- [x] Clear architecture documented
- [x] File structure planned
- [x] Export format decided (Single HTML with base64)
- [x] Framework decided (Vanilla JS + Three.js)
- [x] Component relationships defined
- [x] Reusability strategy outlined

---

**Status:** Phase 7 Step 2 COMPLETE ✅
**Next Step:** Phase 7 Step 3 - Create GamePlayer Component
**Date:** 2025-11-18
