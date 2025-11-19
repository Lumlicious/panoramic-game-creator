# Panoramic Game Creator - Implementation Plan

> **📘 Companion Document**: See [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) for detailed technical specifications, implementation algorithms, and answers to technical questions.

## Project Overview

A desktop application that allows users to create panoramic point-and-click adventure games. Users can create nodes in a game world, assign panoramic images (spherical or cubic), preview nodes, add polygonal hotspot areas that link to other nodes, and visualize the node graph.

## Tech Stack

### Core Technologies
- **electron-vite** - Official Electron + Vite integration for optimal development experience
- **React** - UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Pre-built accessible components (using official template)

### Key Libraries
- **Three.js + React Three Fiber + Drei** - 3D panoramic rendering and hotspot drawing (equirectangular & cubic)
- **React Flow** - Node graph visualization
- **Zustand** - Lightweight state management
- **electron-builder** - Application packaging

## Starting Point

Use the official **shadcn/shadcn-electron-app** template which includes:
- electron-vite pre-configured
- React + TypeScript setup
- Tailwind CSS integrated
- shadcn/ui components ready to use
- Proper path alias configuration (`@/` imports)

This avoids common configuration pitfalls between shadcn and electron-vite.

## Project Structure

```
panoramic-game-creator/
├── electron/
│   ├── main/
│   │   ├── index.ts                    # Main process
│   │   └── ipc/
│   │       ├── fileSystem.ts           # File operations handlers
│   │       └── dialogs.ts              # Native dialog handlers
│   ├── preload/
│   │   └── index.ts                    # IPC bridge
│   └── resources/                      # Build resources
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── Panels.tsx
│   │   ├── panorama/
│   │   │   ├── PanoramaViewer.tsx      # Three.js viewer with hotspots
│   │   │   ├── HotspotMesh.tsx         # Three.js hotspot geometry
│   │   │   └── ViewerControls.tsx
│   │   ├── graph/
│   │   │   ├── NodeGraph.tsx           # React Flow graph
│   │   │   └── CustomNode.tsx
│   │   └── ui/                         # shadcn components
│   ├── stores/
│   │   ├── projectStore.ts             # Project data (Zustand)
│   │   └── editorStore.ts              # UI state (Zustand)
│   ├── lib/
│   │   ├── ipc.ts                      # IPC wrapper functions
│   │   ├── coordinates.ts              # Screen ↔ spherical conversion
│   │   ├── projectManager.ts           # Save/load logic
│   │   └── utils.ts
│   ├── types/
│   │   ├── project.ts
│   │   ├── node.ts
│   │   └── hotspot.ts
│   ├── App.tsx
│   └── main.tsx
├── player/                              # Game player runtime (future)
├── electron.vite.config.ts
├── package.json
└── README.md
```

## Data Models

### Project
```typescript
interface Project {
  id: string;
  name: string;
  version: string;
  created: string;
  modified: string;
  startNodeId: string | null;
  nodes: Node[];
  settings: ProjectSettings;
}

interface ProjectSettings {
  defaultFOV: number;
  hotspotDefaultColor: string;
  hotspotHoverColor: string;
}
```

### Node
```typescript
interface Node {
  id: string;
  name: string;
  panorama: PanoramaData;
  hotspots: Hotspot[];
  position: { x: number; y: number };  // For graph layout
  metadata?: {
    description?: string;
    tags?: string[];
  };
}

interface PanoramaData {
  type: 'equirectangular' | 'cubic';
  // For equirectangular
  filePath?: string;
  // For cubic (future)
  faces?: {
    front: string;
    back: string;
    left: string;
    right: string;
    top: string;
    bottom: string;
  };
}
```

### Hotspot
```typescript
interface Hotspot {
  id: string;
  name: string;
  targetNodeId: string;
  polygon: SphericalPoint[];  // Stored in spherical coordinates
  style: HotspotStyle;
}

interface SphericalPoint {
  theta: number;  // Azimuthal angle (horizontal rotation)
  phi: number;    // Polar angle (vertical angle)
}

interface HotspotStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  hoverFillColor?: string;
}
```

## Project File Format

**Decision**: Directory bundle with `.pgc` extension (macOS bundle style)

Projects are saved as directories with the `.pgc` extension. On macOS, these appear as bundles (single file). On Windows/Linux, they appear as folders.

```
MyAdventure.pgc/
├── project.json                        # Main project file with relative paths
├── assets/
│   ├── panoramas/
│   │   ├── node-abc123.jpg             # Filename = node ID
│   │   ├── node-def456.jpg
│   │   └── ...
│   └── thumbnails/                     # Auto-generated 200x100 thumbnails
│       ├── node-abc123.jpg
│       └── node-def456.jpg
└── .pgc-meta/
    └── version.txt                     # File format version (1.0.0)
```

**Why this approach**:
- ✅ Easy to debug (files visible)
- ✅ No compression overhead
- ✅ Cross-platform compatible
- ✅ Git-friendly
- ✅ Easy asset management

**File Dialog**: On save, allow user to create directory. On open, select directory with `.pgc` extension.

See [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md#project-file-format) for implementation details.

## Strategic Pivot: Vertical Slice First

**Decision (2025-11-16):** Phases 7 and 8 have been **reordered** to prioritize getting a complete vertical slice (create → edit → save → **PLAY**) before investing in editor robustness features.

### Why Game Player Before Robustness?

1. **Complete Vertical Slice Required**: Cannot validate the product works end-to-end without a playable runtime
2. **Validate Core Assumptions**: Prove the data model supports gameplay (hotspot navigation, node transitions) before polishing the editor
3. **Basic Save/Load Already Works**: Phase 7's critical blocker (project persistence) is already implemented - we have New, Open, and Save working
4. **Early Feedback Loop**: Get feedback on actual game experience sooner, iterate faster
5. **Reduced Risk**: Discover issues with navigation mechanics early, before investing in editor polish features
6. **Aligns with MVP Definition**: plan.md success criteria states "User can export a playable game"

### What's Already Complete

- ✅ Phases 1-6: Full editor workflow (create, edit, draw hotspots, assign targets, view graph)
- ✅ Basic Project Operations: New, Open, Save with IPC handlers
- ✅ Dirty State Tracking: isDirty flag prevents accidental data loss
- ✅ Keyboard Shortcuts: Cmd/Ctrl+S, N, O working
- ✅ Unsaved Changes Dialog: Save/Don't Save/Cancel on New/Open

### Revised Phase Order

- **New Phase 7**: Game Player & Export (was Phase 8) ← **BUILD THIS NEXT**
- **New Phase 8**: Editor Robustness (was Phase 7) ← Defer until player works

## Implementation Phases

### Phase 1: Project Setup ✓
**Goal**: Get the development environment ready

1. Clone official shadcn-electron-app template
2. Install additional dependencies:
   - `three` + `@react-three/fiber` + `@react-three/drei`
   - `reactflow`
   - `zustand`
   - `uuid`
3. Verify dev environment works (`npm run dev`)
4. Set up project structure (folders for stores, types, lib)

### Phase 2: Basic App Layout ✓
**Goal**: Create the application shell

1. Build main layout with:
   - Top toolbar (New, Open, Save buttons)
   - Left panel (node list)
   - Center area (panorama viewer OR node graph)
   - Right panel (properties)
2. Use shadcn components: Button, Card, Tabs, ScrollArea
3. Add view switching (Editor vs Graph view)
4. Implement basic styling with Tailwind

### Phase 3: Panorama Viewer (Core Feature) ✓
**Goal**: Display 360° panoramic images (both equirectangular and cubic)

1. Create Three.js scene with React Three Fiber:
   - **Equirectangular**: Sphere geometry (radius 500, 64 segments, inverted normals)
   - **Cubic**: Box geometry (1000x1000x1000) with 6-face texture mapping
   - Perspective camera (FOV 75°, position at origin)
   - Dynamic geometry switching based on panorama type
2. Add camera controls (OrbitControls):
   - Mouse drag to rotate view
   - Mouse wheel to zoom (adjust FOV between 30° and 110°)
   - Prevent camera panning and distance changes
   - Constrain rotation to prevent upside-down view
   - Enable damping for smooth movement
3. Load panorama textures:
   - **Equirectangular**: Single image via TextureLoader
   - **Cubic**: Six images via CubeTextureLoader
4. Handle window resize and texture disposal
5. Add loading state indicator
6. **Early Implementation**: Basic node management (projectStore) and test loader UI

**Camera Configuration**:
```typescript
controls.enablePan = false;
controls.enableRotate = true;
controls.enableDamping = true;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;
```

**Technical Notes**:
- Use `THREE.SphereGeometry` with negative scale to invert for equirectangular
- Use `THREE.BoxGeometry` with BackSide material for cubic
- Camera stays at (0,0,0) looking outward
- CubeTextureLoader face order: [right, left, top, bottom, front, back]
- Dispose textures when switching nodes to prevent memory leaks
- See [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md#camera-configuration) for details

### Phase 4: Hotspot Drawing System (Pure Three.js)
**Goal**: Draw polygonal hotspots directly on the panoramic geometry (sphere or box)

**Note**: With cubic panorama support now implemented, hotspot drawing needs to handle both:
- **Equirectangular**: Spherical coordinates on sphere surface
- **Cubic**: Planar coordinates on box faces (simpler - no seam crossing issues)

1. **Implement polygon drawing mode** with raycasting:
   - Click on geometry to add points (min 3, max 20)
   - Use THREE.Raycaster to detect click position on geometry
   - Convert intersection point to appropriate coordinates (spherical or planar)
   - Store polygon vertices in geometry-appropriate format
   - **Keyboard**: Press **Enter** to finish polygon, **Escape** to cancel

2. **Visual feedback during drawing**:
   - Render temporary point markers (small spheres) at click positions
   - Draw lines connecting points using THREE.Line
   - Show preview of closing edge when hovering near first point
   - For spherical: Validate polygon doesn't cross theta=±π seam
   - For cubic: No seam validation needed (faces are separate)

3. **Render existing hotspots as 3D geometry**:
   - **Use earcut library** to triangulate polygon
   - **Equirectangular**: Project spherical points to tangent plane → triangulate → map back to sphere
   - **Cubic**: Direct planar triangulation on box faces
   - Convert coords to 3D cartesian at appropriate radius (499.5 for sphere)
   - Create BufferGeometry from triangulated vertices
   - Apply semi-transparent MeshBasicMaterial
   - Add outline using THREE.Line for polygon border

4. **Hotspot interaction**:
   - Raycasting for hover detection (throttled to 16ms for 60fps)
   - Change opacity/color on hover
   - Click to select hotspot
   - Show selection highlight

5. **Editing hotspots**:
   - Render draggable vertex markers (small spheres) on selected hotspot
   - Implement custom drag handler with sphere constraint
   - Update spherical coords as vertices move
   - **Keyboard**: Press **Delete/Backspace** to delete selected hotspot
   - Realtime mesh regeneration during vertex drag

6. **Implement keyboard shortcuts** (see Keyboard Shortcuts section):
   - Delete/Backspace: Delete selected hotspot
   - Escape: Cancel drawing mode or deselect
   - Enter: Finish current polygon

**Technical Notes**:
- All geometry exists in 3D space - no coordinate syncing needed
- Hotspots naturally follow sphere curvature
- Use raycasting for all user interactions (prioritize vertices → hotspots → sphere)
- Store in spherical coords, render as 3D meshes
- Theta range: [-π, π], Phi range: [0, π]
- Use THREE.DoubleSide for materials to ensure visibility
- Polygon triangulation algorithm in [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md#polygon-rendering-on-sphere)
- Vertex dragging implementation in [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md#vertex-dragging-implementation)

### Phase 5: Node Management (In Progress)
**Goal**: Create and manage panoramic nodes (both equirectangular and cubic)

**Note**: Basic node management (projectStore) already implemented in Phase 3 for testing. This phase focuses on proper UI, IPC, and validation.

**Current Status**: IPC infrastructure and validation complete. UI implementation in progress.

1. **Enhance Node store (Zustand)** - Already exists:
   - ✅ Add node (with UUID)
   - ✅ Update node properties
   - ✅ Delete node (with confirmation if has hotspots)
   - ✅ Get node by ID
   - Track dirty state (unsaved changes) - needs integration with editorStore

2. **Electron IPC Setup** - ✅ Complete:
   - ✅ File operation handlers (`src/main/ipc/fileHandlers.ts`)
     - `file:pickImage` - Single file picker
     - `file:pickImages` - Multi-file picker (for cubic)
     - `file:validateEquirectangular` - Validate equirectangular images
     - `file:validateCubicFaces` - Validate cubic face images
     - `file:copyToProject` - Copy files to project directory
     - `file:generateThumbnail` - Generate 200x100 thumbnails
   - ✅ Image validation utilities (`src/main/utils/imageValidation.ts`)
     - Format validation (JPG, PNG, WebP)
     - Equirectangular: 2:1 aspect ratio (±5%), 2048-8192px width
     - Cubic: Square faces (1:1), 1024-4096px per side
     - File size validation (max 50MB)
     - Thumbnail generation using sharp
   - ✅ Preload script (`src/preload/index.ts`)
     - Exposed `window.fileAPI` to renderer
     - Full TypeScript type definitions (`src/shared/types/ipc.ts`)
   - ✅ Test UI in Properties Panel
     - Test equirectangular validation
     - Test cubic validation (6 faces)

3. **Node list panel (left sidebar)** - TODO:
   - ✅ Display all nodes
   - Add thumbnails (200x100)
   - ✅ Click to select/edit node
   - Add/delete buttons with proper dialogs
   - Highlight start node
   - Show node with missing image (error state)

4. **Node properties panel (right sidebar)** - TODO (Replace TestCubicLoader):
   - Edit node name (text input)
   - **Assign panorama**: Support both types
     - Equirectangular: Single file picker
     - Cubic: Six file pickers (or multi-select dialog)
   - View/edit hotspots list
   - Set as start node (checkbox)
   - Show image dimensions and file size

5. **Image import flow** - Partially implemented:
   - ✅ Electron IPC for native file dialog
   - ✅ Image validation (equirectangular and cubic)
   - ✅ Thumbnail generation (sharp in main process)
   - TODO: Copy to `assets/panoramas/{nodeId}.{ext}` or `{nodeId}_face.{ext}`
   - TODO: Update projectStore with relative paths
   - TODO: Show validation errors with toast notifications

**Validation Example**:
```typescript
// Reject if not equirectangular
if (aspectRatio < 1.9 || aspectRatio > 2.1) {
  showError('Invalid aspect ratio', 'Expected ~2:1 for equirectangular');
}
```

See [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md#image-specifications) for complete validation rules.

### Phase 6: Node Graph Visualization
**Goal**: Visual overview of all nodes and connections

1. Integrate React Flow:
   - Create custom node component showing thumbnail
   - Display node name
   - Show connections based on hotspots
2. Graph interactions:
   - Click node to open in panorama editor
   - Drag nodes to arrange layout
   - Auto-layout option (dagre or force-directed)
3. Visual indicators:
   - Start node (distinct styling)
   - Orphaned nodes (no incoming connections)
   - Current selected node highlight

### Phase 7: Game Player & Export ⭐ PRIORITY
**Goal**: Export playable games - complete the vertical slice

**Status**: Next phase to implement (after Phases 1-6 complete)

1. **Create standalone player component**:
   - Lightweight panorama viewer (reuse PanoramaViewer code in read-only mode)
   - Hotspot rendering and interaction
   - Navigation between nodes (click hotspot → load target node)
   - Start from startNodeId
   - Camera controls (OrbitControls for navigation)
   - Load textures from project assets

2. **Export functionality**:
   - Export dialog with options:
     - **Option A**: Single HTML file (recommended for small projects)
       - Embed project JSON inline
       - Embed panoramas as base64 data URIs
       - Self-contained, no external dependencies
     - **Option B**: Web folder (recommended for large projects)
       - index.html + player.js bundle
       - assets/ folder with panoramas (not base64)
       - Can be hosted on web server or opened locally
   - IPC handler for export operation
   - Progress indicator for export process

3. **Player features**:
   - Click hotspot to navigate to target node
   - Smooth transitions between nodes (fade out/in)
   - Basic UI overlay:
     - Current node name
     - Navigation hints (hover over hotspots)
     - Simple styling (minimal, non-intrusive)
   - No editing capabilities (read-only)
   - Responsive design (works on mobile browsers)

4. **Technical implementation**:
   - Create `GamePlayer.tsx` component
   - Create `PlayerUI.tsx` overlay component
   - Create `exportProject()` function in projectStore
   - Create IPC handler `project:export`
   - Generate standalone HTML with embedded Three.js + React (or vanilla JS player)
   - Test in multiple browsers (Chrome, Firefox, Safari)

**Success Criteria**:
- User can click "Export Game" button
- Exported HTML file opens in browser
- Panoramas load and display correctly
- Clicking hotspots navigates to target nodes
- Complete vertical slice working: create → edit → save → **PLAY**

See detailed implementation checklist below.

### Phase 8: Editor Robustness (DEFERRED)
**Goal**: Polish editor with advanced features

**Status**: Defer until Phase 7 (Game Player) is complete and validated

1. **Save As functionality**:
   - `project:saveAs` IPC handler
   - Copy all assets to new location
   - Update projectPath in store
   - Keyboard shortcut: Cmd/Ctrl+Shift+S

2. **Project validation on load**:
   - Check format version compatibility (`.pgc-meta/version.txt`)
   - Verify all panorama files exist
   - Show warnings for missing images (but allow opening)
   - Detect corrupted JSON with helpful error messages
   - Validate data integrity (required fields, structure)

3. **Recent projects list**:
   - Use electron-store for persistence
   - Track last 10 opened projects
   - Display in WelcomeScreen
   - Update on open/save operations
   - Remove deleted projects

4. **Unsaved changes on window close**:
   - Add `before-quit` handler in main process
   - Show dialog if isDirty is true
   - Options: Save/Don't Save/Cancel
   - Prevent quit if user cancels
   - Platform-specific handling (macOS Cmd+Q, Windows Alt+F4)

5. **Enhanced error handling**:
   - Disk full errors (ENOSPC) with specific messages
   - Permission errors (EACCES/EPERM) with guidance
   - Path traversal prevention (security)
   - Emergency save on crash (ErrorBoundary)
   - Save recovery file to Documents folder

6. **Auto-save** (optional, nice-to-have):
   - Configurable interval (default 5 minutes)
   - Background save without interrupting work
   - Visual indicator when auto-saving
   - Conflict resolution if manual save occurs

**File Format** (project.json):
```json
{
  "id": "uuid",
  "name": "My Adventure",
  "version": "1.0.0",
  "created": "2025-11-04T...",
  "modified": "2025-11-04T...",
  "startNodeId": "node-1",
  "nodes": [...],
  "settings": {...}
}
```

## Features Deferred to Later

These are important but not required for MVP:

- **Undo/Redo system** - Can be added later
- **Dark mode** - Not essential for editor
- **Auto-save** - Manual save first
- **Advanced validation** - Basic checks only (image format, size validation for Phase 5)
- **Multiple hotspot styles** - Single style initially
- **Audio support** - Visual only for now
- **Hotspot descriptions/tooltips** - Just navigation first
- **Custom player theming** - Basic player only
- **Project templates** - Empty projects only
- **Asset management** - Simple file copying only
- **IPC file dialogs** - Using browser file picker for Phase 3 testing, proper IPC in Phase 5

## Configuration Constants

See [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) for complete specifications.

### Core Constants
```typescript
// Sphere configuration
SPHERE_RADIUS = 500
HOTSPOT_RADIUS = 499.5  // Slightly smaller to prevent z-fighting
SEGMENTS = 64

// Camera
DEFAULT_FOV = 75°
FOV_MIN = 30°
FOV_MAX = 110°

// Limits
MAX_NODES = 500
MAX_HOTSPOTS_PER_NODE = 50
MIN_POLYGON_POINTS = 3
MAX_POLYGON_POINTS = 20

// Image specs
SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp']
EQUIRECT_ASPECT_RATIO = 2.0 (±5% tolerance)
MIN_WIDTH = 2048px
MAX_WIDTH = 8192px
MAX_FILE_SIZE = 50MB
```

## Keyboard Shortcuts (MVP)

Essential shortcuts needed for basic functionality:

| Action | Shortcut | Phase |
|--------|----------|-------|
| New Project | Ctrl/Cmd+N | 7 |
| Open Project | Ctrl/Cmd+O | 7 |
| Save | Ctrl/Cmd+S | 7 |
| Save As | Ctrl/Cmd+Shift+S | 7 |
| **Delete Hotspot** | **Delete/Backspace** | **4** ⚠️ |
| **Cancel Drawing** | **Escape** | **4** ⚠️ |
| **Finish Polygon** | **Enter** | **4** ⚠️ |
| Toggle View | Tab | 2 |

⚠️ **Critical for Phase 4**: Delete, Escape, and Enter are required for hotspot editing workflow.

## Key Technical Considerations

### 1. Coordinate System (Critical)
Hotspots must be stored in **spherical coordinates** to be resolution-independent:

```typescript
// Screen to Spherical conversion
function screenToSpherical(screenX: number, screenY: number, camera: Camera): SphericalPoint {
  // Use raycasting to find intersection with sphere
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(normalizedScreenCoords, camera);
  const intersects = raycaster.intersectObject(sphereMesh);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    const theta = Math.atan2(point.z, point.x);
    const phi = Math.acos(point.y / radius);
    return { theta, phi };
  }
}

// Spherical to Screen conversion
function sphericalToScreen(theta: number, phi: number, camera: Camera): {x: number, y: number} {
  const point = new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
  point.project(camera);

  return {
    x: (point.x + 1) * width / 2,
    y: (-point.y + 1) * height / 2
  };
}
```

### 2. Hotspot Rendering in 3D
Hotspots are rendered as 3D geometry on the sphere surface:

- Convert spherical coordinates to 3D cartesian coordinates
- Create mesh geometry slightly inside sphere radius (e.g., radius * 0.99)
- Use semi-transparent materials for fill and stroke
- Raycasting handles all interaction (hover, click, drag)
- No coordinate syncing required - everything in one 3D scene

### 3. State Management (Zustand)
Two main stores:

**projectStore**:
- Current project data
- Nodes, hotspots, settings
- Persisted to file

**editorStore**:
- UI state (selected node, drawing mode, etc.)
- Current view (editor vs graph)
- Not persisted

### 4. Performance Optimization
- Load panoramas on-demand (not all at once)
- Reduce texture size if needed (max 4K)
- Throttle hotspot redrawing
- Use React.memo for expensive components
- Lazy load node thumbnails

### 5. Electron IPC Security
Use contextBridge in preload script:

```typescript
// preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  project: {
    new: () => ipcRenderer.invoke('project:new'),
    save: (data) => ipcRenderer.invoke('project:save', data),
    open: () => ipcRenderer.invoke('project:open')
  },
  file: {
    pickImage: () => ipcRenderer.invoke('file:pickImage')
  }
});
```

## Dependencies to Install

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.170.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.117.0",
    "reactflow": "^11.11.4",
    "zustand": "^5.0.2",
    "uuid": "^11.0.3",
    "earcut": "^2.2.4",
    "file-type": "^18.7.0",
    "sharp": "^0.33.1",
    "electron-store": "^8.2.0",
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.170.0",
    "@types/uuid": "^10.0.0",
    "@types/earcut": "^2.1.4",
    "@types/lodash-es": "^4.17.12",
    "electron-builder": "^24.13.3"
  }
}
```

**New Dependencies Explained**:
- **earcut** - Polygon triangulation for rendering hotspots on sphere
- **file-type** - Validate image formats
- **sharp** - High-performance thumbnail generation (main process)
- **electron-store** - Persist app preferences and recent files
- **lodash-es** - Utilities (throttle for performance optimization)

## Development Workflow

1. **Phase by phase**: Complete each phase before moving to next
2. **Test incrementally**: Verify each feature works before adding more
3. **Commit often**: Version control after each working feature
4. **Keep it simple**: Minimal viable implementation first
5. **Refactor later**: Get it working, then optimize

---

## Phase 7 Implementation Checklist

**Goal**: Build game player and export functionality to complete the vertical slice (create → edit → save → **PLAY**)

### Step 1: Verify Current Safety Features ✅ COMPLETE
**Objective**: Confirm basic save/load works before building player

**Status**: Completed 2025-11-16

**Tasks:**
- [x] Code review of IPC handlers (projectHandlers.ts)
- [x] Code review of store actions (projectStore.ts)
- [x] Code review of keyboard shortcuts (Toolbar.tsx)
- [x] Code review of isDirty tracking (editorStore.ts)
- [x] **FIXED**: isDirty tracking - added setDirty(true) to all mutation operations
- [x] Verified compilation - all changes HMR updated successfully

**Files Reviewed:**
- `src/main/ipc/projectHandlers.ts` - IPC handlers ✅
- `src/renderer/src/stores/projectStore.ts` - save/load actions ✅
- `src/renderer/src/stores/editorStore.ts` - isDirty flag ✅
- `src/renderer/src/components/layout/Toolbar.tsx` - keyboard shortcuts ✅

**Files Modified (isDirty Fix):**
- `src/renderer/src/components/layout/PropertiesPanel.tsx` - Added 5 setDirty(true) calls
- `src/renderer/src/components/panorama/PanoramaSphere.tsx` - Added 2 setDirty(true) calls
- `src/renderer/src/components/graph/GraphView.tsx` - Added 1 setDirty(true) call

**What Works:**
- ✅ New Project creates .pgc directory with assets/panoramas, assets/thumbnails, .pgc-meta
- ✅ Save Project writes project.json with timestamps
- ✅ Open Project loads and validates existing .pgc directories
- ✅ Keyboard shortcuts: Cmd/Ctrl+S (Save), Cmd/Ctrl+N (New), Cmd/Ctrl+O (Open)
- ✅ Unsaved changes dialog shows on New/Open when isDirty = true
- ✅ isDirty now tracks ALL mutations (nodes, hotspots, positions, properties)

**Critical Fix Applied:**
The isDirty flag was only set when creating new nodes. Fixed by adding setDirty(true) to:
- Node name updates, start node toggle, node deletion
- Hotspot creation, name/target updates, deletion, vertex dragging
- Graph node position updates (drag)

**Acceptance Criteria:**
- [x] Can create new project
- [x] Can save project (Cmd/Ctrl+S)
- [x] Can open existing project
- [x] Dirty flag prevents data loss (NOW FULLY WORKING)

---

### Step 2: Plan Player Architecture ✅ COMPLETE
**Objective**: Design player component structure and export format

**Status**: Completed 2025-11-18 (REDESIGNED for web hosting)

**Tasks:**
- [x] Review existing PanoramaViewer code to identify reusable parts
- [x] Design read-only panorama viewer (no editing)
- [x] Plan hotspot click → navigation flow
- [x] Choose export format: Web Folder vs Single HTML
- [x] Design player UI overlay (minimal, non-intrusive)
- [x] Plan file structure for player components
- [x] Design extensibility for future features (inventory, dialogs, puzzles)

**Critical Decisions Made:**
- ✅ **Export format**: Web folder (static site) for Vercel/Netlify/VPS hosting
- ✅ **Player framework**: **React + TypeScript + React Three Fiber** (extensible game engine)
- ✅ **Asset strategy**: **Separate files** (CDN-friendly, progressive loading, browser cache)
- ✅ **Build tool**: **Vite** (fast builds, optimized static output)
- ✅ **State management**: **Zustand** (familiar from editor, lightweight)
- ✅ **Progressive loading**: Load current node immediately, preload adjacent nodes in background
- ✅ **CDN support**: Optional CDN URLs for panoramas (manual upload for MVP)

**Architecture Highlights:**
- React-based game engine (NOT Vanilla JS)
- Plugin architecture for inventory, dialogs, puzzles
- Texture caching and preloading system
- Auto-save to localStorage
- Separate `/player` directory (independent Vite project)

**Files Planned:**
Player source (`/player/src/`):
- `components/GameEngine.tsx` - Top-level coordinator
- `components/PanoramaView.tsx` - Canvas container
- `components/three/PanoramaSphere.tsx` - React Three Fiber sphere
- `components/three/HotspotLayer.tsx` - Interactive hotspots
- `stores/gameStore.ts` - Zustand game state
- `lib/textureCache.ts` - Asset caching
- `lib/assetResolver.ts` - CDN/local URL resolution

Export infrastructure:
- `electron/main/exportHandlers.ts` - IPC export handler
- `electron/main/transformers/gameDataTransformer.ts` - Project → game.json
- Export output: `my-game/dist/` (upload to web host)

**Documentation:**
- Complete architecture document: `PHASE7_ARCHITECTURE.md` (web-hosted game engine)

**Acceptance Criteria:**
- [x] Clear architecture documented (React-based, web-first)
- [x] File structure planned (separate `/player` project)
- [x] Export format decided (web folder, not single HTML)
- [x] Framework decided (React + R3F for extensibility)
- [x] Progressive loading strategy defined
- [x] CDN support designed
- [x] Plugin architecture for future features

---

### Step 3: Create GamePlayer Component
**Objective**: Build basic panorama viewer for player (read-only mode)

**Tasks:**
- [ ] Create `src/renderer/src/components/player/GamePlayer.tsx`
- [ ] Reuse PanoramaViewer code (copy and simplify)
- [ ] Remove editing features (drawing mode, vertex markers)
- [ ] Add props: `projectData`, `currentNodeId`, `onNavigate(nodeId)`
- [ ] Load panorama from node data (equirectangular + cubic support)
- [ ] Implement OrbitControls for navigation
- [ ] Handle texture loading and disposal
- [ ] Add loading state

**Implementation Details:**
```typescript
interface GamePlayerProps {
  projectData: Project  // Full project JSON
  currentNodeId: string  // Which node to display
  onNavigate: (targetNodeId: string) => void  // Callback when hotspot clicked
}
```

**Files to Create/Modify:**
- **NEW:** `src/renderer/src/components/player/GamePlayer.tsx`
- Reference: `src/renderer/src/components/editor/PanoramaViewer.tsx`

**Acceptance Criteria:**
- [ ] GamePlayer component renders panorama
- [ ] Camera controls work (orbit, zoom)
- [ ] Can switch between nodes programmatically
- [ ] Textures load and dispose correctly
- [ ] Works with equirectangular and cubic panoramas

---

### Step 4: Implement Hotspot Interaction
**Objective**: Click hotspot → navigate to target node

**Tasks:**
- [ ] Render hotspots in GamePlayer (reuse HotspotRenderer)
- [ ] Add raycasting for hotspot detection
- [ ] Implement hover effects (highlight on mouseover)
- [ ] Implement click handler → call `onNavigate(targetNodeId)`
- [ ] Add cursor change on hover (pointer cursor)
- [ ] Remove editing features (no vertex markers, no dragging)
- [ ] Test navigation flow between multiple nodes

**Implementation Details:**
- Reuse existing hotspot triangulation code
- Raycaster priority: hotspots only (no sphere clicking)
- On click: `onNavigate(hotspot.targetNodeId)`
- Visual feedback: Change hotspot opacity/color on hover

**Files to Create/Modify:**
- Modify `src/renderer/src/components/player/GamePlayer.tsx`
- Reuse `src/renderer/src/components/editor/HotspotRenderer.tsx` (read-only version)

**Acceptance Criteria:**
- [ ] Hotspots render on panorama
- [ ] Hover highlights hotspot
- [ ] Click navigates to target node
- [ ] Navigation works bidirectionally
- [ ] No console errors during navigation

---

### Step 5: Build Player UI Overlay
**Objective**: Minimal UI showing current node and navigation hints

**Tasks:**
- [ ] Create `src/renderer/src/components/player/PlayerUI.tsx`
- [ ] Display current node name (top-left or top-center)
- [ ] Show navigation hint on hotspot hover (e.g., "Go to Kitchen")
- [ ] Add simple styling (semi-transparent background, white text)
- [ ] Ensure UI doesn't interfere with panorama interaction
- [ ] Make responsive (works on mobile)

**UI Elements:**
- **Top bar**: Current node name
- **Hover tooltip**: Target node name when hovering hotspot
- **Minimal styling**: Clean, non-intrusive

**Files to Create:**
- **NEW:** `src/renderer/src/components/player/PlayerUI.tsx`

**Acceptance Criteria:**
- [ ] Node name displays clearly
- [ ] Hover tooltips show target node
- [ ] UI doesn't block panorama interaction
- [ ] Styling is clean and minimal
- [ ] Works on desktop and mobile browsers

---

### Step 6: Create Export Dialog & Options
**Objective**: UI for exporting game with user options

**Tasks:**
- [ ] Create export dialog component
- [ ] Add export format selector:
  - **Single HTML** (recommended for small projects)
  - **Web Folder** (for large projects, future enhancement)
- [ ] Add export destination file picker
- [ ] Add export button to Toolbar
- [ ] Connect to exportProject() action in projectStore
- [ ] Show progress indicator during export
- [ ] Show success/error notifications

**UI Flow:**
1. User clicks "Export Game" in toolbar
2. Dialog shows export options
3. User selects format and destination
4. Click "Export" button
5. Progress indicator shows during export
6. Success toast on completion

**Files to Create/Modify:**
- **NEW:** `src/renderer/src/components/dialogs/ExportDialog.tsx`
- Modify `src/renderer/src/components/layout/Toolbar.tsx` - Add Export button
- Modify `src/renderer/src/stores/projectStore.ts` - Add exportProject() action

**Acceptance Criteria:**
- [ ] Export button in toolbar
- [ ] Dialog shows export options
- [ ] File picker works
- [ ] Progress indicator during export
- [ ] Success/error notifications

---

### Step 7: Generate Standalone HTML Export
**Objective**: Create self-contained HTML file with embedded game

**Tasks:**
- [ ] Create IPC handler `project:export` in main process
- [ ] Implement `generateStandaloneHTML()` function
- [ ] Embed project JSON inline (as JavaScript object)
- [ ] Embed Three.js library (CDN link or bundled)
- [ ] Embed panorama images as base64 data URIs
- [ ] Generate player JavaScript code (vanilla JS or bundled React)
- [ ] Create HTML template with all assets embedded
- [ ] Write HTML file to selected destination
- [ ] Test in browser (open file:// directly)

**Export Format (Single HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Game Title</title>
  <script src="https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.min.js"></script>
</head>
<body>
  <div id="game-container"></div>
  <script>
    // Embedded project data
    const PROJECT_DATA = { /* project.json */ };

    // Embedded panoramas (base64)
    const PANORAMAS = {
      'node-123': 'data:image/jpeg;base64,...',
      // ...
    };

    // Player code
    // ... (GamePlayer logic in vanilla JS)
  </script>
</body>
</html>
```

**Files to Create/Modify:**
- **NEW:** `src/main/ipc/exportHandlers.ts` - IPC handler
- **NEW:** `src/lib/export/generateHTML.ts` - HTML generation logic
- **NEW:** `templates/player-template.html` - HTML template
- Modify `src/main/index.ts` - Register export handlers
- Modify `src/preload/index.ts` - Add export API

**Technical Challenges:**
- Converting images to base64 (use sharp or fs.readFile + Buffer.toString('base64'))
- Minifying player code for smaller file size
- Handling large panoramas (file size limits)

**Acceptance Criteria:**
- [ ] Export generates HTML file
- [ ] HTML file opens in browser without server
- [ ] Project data embedded correctly
- [ ] Panoramas display (base64 works)
- [ ] Player functionality works in exported file
- [ ] File size reasonable (<50MB for typical project)

---

### Step 8: Test Complete Vertical Slice
**Objective**: Validate end-to-end workflow from create to play

**Test Workflow:**
1. **Create**: Create new project
2. **Add Content**: Add 3+ nodes with panoramas
3. **Draw Hotspots**: Draw hotspots on each node
4. **Assign Targets**: Link hotspots to target nodes
5. **Set Start**: Set start node
6. **Save**: Save project
7. **Export**: Export as HTML
8. **Play**: Open HTML in browser, test navigation

**Test Cases:**
- [ ] Navigation works in all directions
- [ ] Start node loads first
- [ ] Hotspot hover effects work
- [ ] Clicking hotspots navigates correctly
- [ ] All panoramas load successfully
- [ ] No console errors in browser
- [ ] Works in Chrome, Firefox, Safari
- [ ] Mobile browser compatibility (basic test)

**Files to Test:**
- All player components
- Export functionality
- Generated HTML output

**Acceptance Criteria:**
- [ ] Complete vertical slice works end-to-end
- [ ] Can create → edit → save → export → **PLAY**
- [ ] Exported game works in browsers
- [ ] No critical bugs in player or export
- [ ] Ready for user feedback/testing

---

### Step 9-15: Return to Phase 8 (Editor Robustness)
**After Phase 7 is complete and validated**, implement Phase 8 features:

9. [ ] **Save As** - Copy project to new location
10. [ ] **Project Validation** - Check missing images, version compatibility
11. [ ] **Recent Projects List** - Track and display recent projects
12. [ ] **Window Close Prevention** - Prompt before closing with unsaved changes
13. [ ] **Enhanced Error Handling** - Better file system error messages
14. [ ] **Auto-save** (optional) - Periodic background saves
15. [ ] **Final Polish** - Bug fixes, UX improvements

---

## Success Criteria (MVP)

The MVP is complete when:
- ✅ User can create a new project
- ✅ User can add nodes with panoramic images
- ✅ User can draw hotspot polygons on panoramas
- ✅ User can link hotspots to target nodes
- ✅ User can view node graph with connections
- ✅ User can save project to disk
- ✅ User can open existing projects
- ✅ User can export a playable game

## Next Steps After MVP

Once core functionality works:
1. Add cubic panorama support
2. Implement undo/redo
3. Add validation and error handling
4. Create better player UI
5. Add hotspot tooltips/descriptions
6. Implement auto-save
7. Add project templates
8. Improve export options
9. Add keyboard shortcuts
10. Polish UI/UX

## Resources

- [electron-vite docs](https://electron-vite.org/)
- [shadcn/ui docs](https://ui.shadcn.com/)
- [Three.js docs](https://threejs.org/docs/)
- [React Three Fiber docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei docs](https://github.com/pmndrs/drei) - React Three Fiber helpers
- [React Flow docs](https://reactflow.dev/)
- [Zustand docs](https://zustand-demo.pmnd.rs/)

## Error Boundaries & Recovery

Wrap the app in an Error Boundary component:

```typescript
<ErrorBoundary project={currentProject}>
  <App />
</ErrorBoundary>
```

On crash:
- Attempt emergency save to Documents folder
- Show error message with recovery path
- Offer to reload application

See [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md#error-boundary) for implementation.

---

## Summary of Key Technical Decisions

✅ **Sphere radius**: 500 units (hotspot radius: 499.5)
✅ **Hotspot rendering**: Earcut triangulation on tangent plane
✅ **Vertex dragging**: Custom raycasting with sphere constraint
✅ **Project format**: Directory bundle (`.pgc`)
✅ **File paths**: Relative paths in JSON, resolved at runtime
✅ **Camera controls**: OrbitControls with FOV zoom (30-110°)
✅ **Coordinate system**: Standard spherical (theta: [-π,π], phi: [0,π])
✅ **Image validation**: Format, aspect ratio (~2:1), size (2048-8192px), max 50MB
✅ **Thumbnail generation**: Sharp library, 200x100 JPEG
✅ **Keyboard shortcuts**: Delete, Escape, Enter required for Phase 4
✅ **Dependencies**: Added earcut, sharp, file-type, electron-store, lodash-es
✅ **Error handling**: Toast notifications + error boundary + IPC error returns
✅ **Seam crossing**: Disallow polygons crossing theta=±π for MVP

**📘 Complete technical details**: See [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)

---

**Last Updated**: 2025-11-04
**Status**: Ready for Implementation
**Target Scale**: 20-100 nodes per game
**Next Step**: Begin Phase 1 - Project Setup
