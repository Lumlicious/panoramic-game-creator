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

### Phase 7: Project File Operations
**Goal**: Save and load projects

1. **Set up Electron IPC handlers**:
   - `project:new` - Create new project (with confirmation if unsaved changes)
   - `project:save` - Save current project
   - `project:saveAs` - Save with new location
   - `project:open` - Open existing project
   - `file:pickImage` - Select panorama image
   - **Error handling**: Return `{success, error}` from all IPC calls

2. **Implement project manager**:
   - Serialize project to JSON
   - Create `.pgc` directory structure
   - Copy panorama files with node ID as filename
   - Generate thumbnails using sharp
   - Store relative paths in JSON
   - Load project and validate:
     - Check format version compatibility
     - Verify all images exist
     - Show warning for missing images but allow opening
   - Set dirty flag to false after successful save

3. **File menu integration with keyboard shortcuts**:
   - New Project (Cmd/Ctrl+N)
   - Open Project (Cmd/Ctrl+O) - select `.pgc` directory
   - Save (Cmd/Ctrl+S)
   - Save As (Cmd/Ctrl+Shift+S)
   - Recent projects list (using electron-store)

4. **Unsaved changes handling**:
   - Track dirty flag in editor store
   - Show confirmation dialog before:
     - Creating new project
     - Opening different project
     - Closing window
   - Offer to save, discard, or cancel

5. **Error handling**:
   - File system errors (permissions, disk full)
   - JSON parse errors (corrupted project)
   - Missing images (show warning, allow opening)
   - Use toast notifications for user-facing errors
   - Log errors for debugging

**Example Error Handling**:
```typescript
const result = await window.electronAPI.project.save(project, path);
if (!result.success) {
  showError('Save failed', result.error);
}
```

See [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md#error-handling-strategy) for complete error handling patterns.

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

### Phase 8: Basic Game Player/Export
**Goal**: Export playable games

1. Create standalone player component:
   - Lightweight panorama viewer
   - Hotspot rendering and interaction
   - Navigation between nodes
   - Start from start node
2. Export functionality:
   - Option A: Single HTML file
     - Embed project JSON
     - Include panoramas as base64 (small projects)
   - Option B: Web folder
     - index.html + player.js
     - assets/ folder with panoramas
     - Can be hosted or opened locally
3. Player features:
   - Click hotspot to navigate
   - Smooth transition between nodes
   - Basic UI (node name, navigation hints)

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
