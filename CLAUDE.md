# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Panoramic Game Creator is a desktop Electron application for creating panoramic point-and-click adventure games. Users create nodes with 360° panoramic images, draw polygonal hotspots on the panoramas that link to other nodes, and visualize the node graph.

**Current Status**: Phases 1-6 complete! ✅ Full node management, hotspot drawing, target assignment, and node graph visualization working. **Strategic Pivot**: Building Game Player (Phase 7) before editor robustness features to complete vertical slice (create → edit → save → **PLAY**).

### Completed Phases

- ✅ **Phase 1: Project Setup**
  - shadcn-electron-app template cloned and configured
  - All dependencies installed (Three.js, React Three Fiber, Zustand, React Flow, earcut, sharp, etc.)
  - Project structure created (`src/types/`, `src/lib/`, `src/stores/`)
  - Type definitions implemented (Project, Node, Hotspot, PanoramaData, SphericalPoint)
  - Configuration constants defined (all specs in `src/lib/config.ts`)
  - Coordinate conversion utilities scaffolded in `src/lib/coordinates.ts`

- ✅ **Phase 2: Basic App Layout**
  - Application shell with toolbar, panels, and center area
  - View switching between Editor and Graph views
  - Layout components (AppLayout, Toolbar, NodeListPanel, PropertiesPanel)
  - shadcn components integrated (Button, Card, Tabs, ScrollArea)

- ✅ **Phase 3: Panorama Viewer**
  - Three.js panoramic viewer with React Three Fiber
  - Support for equirectangular and cubic panoramas
  - OrbitControls with proper constraints
  - Texture loading and disposal
  - PanoramaSphere component with dynamic geometry switching

- ✅ **Phase 4: Hotspot Drawing System**
  - Polygon drawing with raycasting on sphere/box
  - Earcut triangulation for hotspot rendering
  - Hotspot mesh rendering with fill and outline
  - Vertex markers and editing
  - Keyboard shortcuts (Enter, Escape, Delete)
  - Drawing mode state management
  - Hover and selection interactions

- ✅ **Phase 5: Node Management**
  - Project lifecycle (New/Open/Save with .pgc directory bundles)
  - Add Node dialog with panorama type selection
  - Image import flow with validation and thumbnail generation
  - Node list panel with thumbnails
  - Panorama viewer integration with runtime path resolution
  - IPC infrastructure complete (`fileHandlers.ts`, `projectHandlers.ts`)
  - Image validation for equirectangular and cubic panoramas

- ✅ **Phase 5.5: Hotspot Target Assignment** (2025-11-09)
  - **Hotspot Properties Card**: Edit name, assign target node, delete hotspot
  - **Target Node Dropdown**: Select which node each hotspot links to
  - **Enhanced Node Properties**: Edit name, set start node, view linked hotspots
  - **Interactive Hotspots List**: Click to select, shows target assignments
  - Complete CRUD operations for nodes and hotspots
  - Enables Phase 6 graph connections (edges require targetNodeId)

- ✅ **Phase 6: Node Graph Visualization** (2025-11-10)
  - **React Flow Integration**: Full graph canvas with custom node cards
  - **Custom Node Cards**: Thumbnails, badges (start node, orphaned), connection counts
  - **Smooth Bezier Edges**: Curved connectors from source (right) to target (left) handles
  - **Edge Styling**: Animated green edges from start node, gray for others
  - **Drag-and-Drop Positioning**: Nodes draggable with position persistence
  - **Selection Sync**: Click node in graph switches to Editor view with node selected
  - **Graph Controls**: Pan, zoom, fit view, minimap with color-coded nodes
  - **Type-Safe Converters**: `graphConverters.ts` transforms project data to React Flow format
  - **Empty State Handling**: User-friendly message when no nodes exist

### Current Phase

**Phase 7: Game Player & Export** ⭐ **IN PROGRESS** - See **plan.md Phase 7 Implementation Checklist** for detailed steps.

- ✅ **Phase 7 Step 1: Verify Safety Features** (2025-11-16)
  - **Code Review**: Verified IPC handlers, store actions, keyboard shortcuts
  - **Critical Fix**: isDirty tracking now works for ALL mutations
  - **Files Modified**: PropertiesPanel.tsx, PanoramaSphere.tsx, GraphView.tsx
  - **Result**: Save button, unsaved changes dialog now fully functional

**Strategic Rationale:**
Phases 7 & 8 have been **reordered** to prioritize completing the vertical slice (create → edit → save → **PLAY**) before investing in editor robustness features. Basic save/load already works, so we can now validate the core gameplay experience.

**Goals:**
- Build standalone game player component (read-only panorama viewer)
- Implement hotspot click → node navigation
- Create export functionality (standalone HTML with embedded assets)
- Test complete vertical slice end-to-end
- Validate data model works for actual gameplay

**Why This Order:**
1. Complete vertical slice required to validate product works end-to-end
2. Prove data model supports gameplay before polishing editor
3. Basic project persistence already complete (New/Open/Save working)
4. Early feedback loop on actual game experience
5. Reduced risk - discover navigation issues early

**Phase 8 (Deferred):** Editor robustness features (Save As, validation, auto-save, recent projects) - Build AFTER player works

## Essential Reading

Before starting any implementation work, read these documents in order:

1. **DECISIONS.md** - All finalized technical decisions (quick reference)
2. **plan.md** - High-level implementation roadmap with 8 phases
3. **TECHNICAL_SPEC.md** - Detailed technical specifications and algorithms

These documents contain ALL architectural decisions, implementation details, and rationale.

## Environment Setup

**Node.js**: v23.9.0 (managed via NVM)
**npm**: 10.9.2
**Package Manager**: npm
**Development Server**: `npm run dev` - starts Electron with HMR

### Installed Dependencies

All dependencies from plan.md have been installed:
- ✅ React 18 + TypeScript
- ✅ Three.js + @react-three/fiber + @react-three/drei
- ✅ reactflow (React Flow for node graph)
- ✅ zustand (state management)
- ✅ uuid, earcut, sharp, file-type, electron-store, lodash-es
- ✅ shadcn/ui components (Button, AlertDialog installed)

### Available Scripts

- `npm run dev` - Start development with hot reload
- `npm run build` - Type check and build for production
- `npm run typecheck` - Type check all TypeScript files
- `npm run lint` - ESLint with auto-fix
- `npm run format` - Prettier formatting
- `npm run build:mac/win/linux` - Build platform-specific apps

## Technology Stack

- **electron-vite** - Electron + Vite integration (from shadcn template)
- **React 18 + TypeScript** - UI framework
- **Tailwind CSS + shadcn/ui** - Styling and components
- **Three.js + React Three Fiber + Drei** - 3D panoramic rendering and hotspot drawing
- **React Flow** - Node graph visualization
- **Zustand** - State management (two stores: projectStore, editorStore)
- **earcut** - Polygon triangulation for hotspots on sphere
- **sharp** - Thumbnail generation (main process)
- **electron-store** - App preferences persistence

## Architecture Overview

### Three-Layer Architecture

1. **Electron Main Process** (`electron/main/`)
   - File system operations (save/load projects)
   - Native dialogs (file picker)
   - Image validation and thumbnail generation
   - IPC handlers for renderer communication

2. **Renderer Process** (`src/`)
   - React UI components
   - Three.js panoramic viewer with hotspot drawing
   - Zustand state management
   - React Flow node graph

3. **Preload Script** (`electron/preload/`)
   - Type-safe IPC bridge using contextBridge
   - Exposes `window.electronAPI` to renderer

### Data Flow

```
User Action → Component → Zustand Store → IPC (if needed) → Main Process → File System
                             ↓
                    Update React State
                             ↓
                    Re-render Components
```

### State Management (Zustand)

Two stores:

- **projectStore**: Project data (nodes, hotspots, settings) - persisted to disk
- **editorStore**: UI state (selected node, drawing mode, dirty flag) - ephemeral

### Project File Format

Projects are **directory bundles** with `.pgc` extension:

```
MyAdventure.pgc/
├── project.json              # Relative paths only
├── assets/
│   ├── panoramas/
│   │   ├── {nodeId}.jpg     # Filename = node UUID
│   │   └── ...
│   └── thumbnails/
│       └── {nodeId}.jpg     # 200x100 generated thumbnails
└── .pgc-meta/
    └── version.txt          # Format version (1.0.0)
```

**Critical**: Always use relative paths in JSON. Resolve to absolute at runtime.

## Critical Technical Specifications

### Coordinate System

- **Sphere radius**: 500 units (panorama), 499.5 units (hotspots - prevents z-fighting)
- **Spherical coordinates**:
  - theta (azimuth): [-π, π] - horizontal rotation
  - phi (polar): [0, π] - vertical angle
  - theta=0 points to positive X axis
  - phi=0 points to positive Y axis (top)

### Hotspot Rendering

Hotspots are 3D meshes on the sphere surface:

1. Store polygon vertices as spherical coordinates
2. Convert to 3D cartesian at radius 499.5
3. Project to tangent plane for triangulation
4. Use **earcut** library to triangulate
5. Map triangulated vertices back to sphere surface
6. Create BufferGeometry with MeshBasicMaterial

**See TECHNICAL_SPEC.md section "Polygon Rendering on Sphere"** for complete algorithm.

### Raycasting Priority Order

When handling clicks/hover:

1. Vertex markers (if in editing mode)
2. Hotspot meshes (if any)
3. Sphere surface (for drawing)

### Camera Configuration

- **OrbitControls** from Three.js
- FOV: 75° default, zoom range 30-110°
- Enable: rotate, damping
- Disable: pan, dolly (camera stays at origin)
- Constrain: minPolarAngle=0, maxPolarAngle=π (prevent upside-down)

### Image Validation

Equirectangular panoramas must meet:

- Format: JPG, PNG, WebP
- Aspect ratio: 2.0 ±5% (width ≈ 2x height)
- Resolution: 2048px - 8192px width
- File size: max 50MB

Use **sharp** (main process) to validate and generate thumbnails.

### Performance Limits

- Max nodes: 500 (hard limit)
- Max hotspots per node: 50
- Polygon points: 3 min, 20 max
- Hover raycasting: throttle to 16ms (60fps)

## Keyboard Shortcuts (Required for MVP)

These are **critical** for Phase 4 (Hotspot Drawing):

- **Delete/Backspace**: Delete selected hotspot
- **Escape**: Cancel drawing mode or deselect
- **Enter**: Finish polygon drawing
- **Ctrl/Cmd+S**: Save project
- **Ctrl/Cmd+O**: Open project
- **Tab**: Toggle Editor/Graph view

Implement keyboard shortcuts using React hooks in Phase 4. See TECHNICAL_SPEC.md for hook implementation.

## Key Constraints

### MVP Limitations

1. **Equirectangular only** - No cubic panorama support yet
2. **No seam crossing** - Hotspots cannot cross theta=±π boundary (back of sphere)
3. **Manual graph layout** - No auto-layout algorithm
4. **No undo/redo** - Deferred to post-MVP

### Security

- Use contextBridge in preload script (never expose full IPC)
- Validate all IPC inputs in main process
- Prevent path traversal attacks (restrict to project directory)

## Implementation Phases

Follow plan.md phases sequentially:

1. **Phase 1**: Project Setup - Clone template, install deps, verify environment
2. **Phase 2**: Basic App Layout - Toolbar, panels, view switching
3. **Phase 3**: Panorama Viewer - Three.js sphere with OrbitControls
4. **Phase 4**: Hotspot Drawing - Raycasting, triangulation, editing (MOST COMPLEX)
5. **Phase 5**: Node Management - Image import, validation, thumbnails
6. **Phase 6**: Node Graph - React Flow with connections
7. **Phase 7**: Project Files - Save/load with error handling
8. **Phase 8**: Game Export - Standalone player

**Do not skip phases.** Each builds on the previous.

## Phase 4 Special Notes (Hotspot Drawing)

This is the most complex phase. Key components:

1. **Drawing mode state**: Track points being added
2. **Raycasting**: Convert mouse clicks to sphere intersections
3. **Coordinate conversion**: Cartesian ↔ Spherical
4. **Triangulation**: Use earcut on tangent plane projection
5. **Vertex dragging**: Custom drag handler constrained to sphere
6. **Keyboard shortcuts**: Must implement Delete, Escape, Enter

**See TECHNICAL_SPEC.md sections**:
- "Polygon Rendering on Sphere"
- "Vertex Dragging Implementation"
- "Hotspot Interaction System"

## Error Handling

1. **User errors** → Toast notifications (shadcn/ui Toast component)
2. **System errors** → Error dialog with details
3. **Fatal errors** → ErrorBoundary with emergency save to Documents folder

All IPC handlers must return `{success: boolean, error?: string}`.

## Common Gotchas

1. **Texture disposal**: Always dispose Three.js textures when switching nodes to prevent memory leaks
2. **Path resolution**: Store relative paths in JSON, resolve to absolute at runtime
3. **Z-fighting**: Hotspots at radius 499.5, sphere at 500 (0.1% offset)
4. **Seam discontinuity**: Validate polygons don't cross theta=±π during drawing
5. **Triangulation complexity**: Cannot use THREE.Shape directly - must project to plane first
6. **Thumbnail generation**: Must happen in main process (sharp requires Node.js)

## Testing Approach

Not yet implemented. When adding tests:

- Unit tests: Coordinate conversions, validation functions, state management
- Integration tests: Project save/load, image import flow
- E2E tests: Full workflow (create → draw → save → export)

Use Vitest for unit tests (compatible with Vite).

## File Path Conventions

- All paths in `project.json`: **relative** (e.g., `"assets/panoramas/node-abc.jpg"`)
- Runtime loading: Resolve via `path.join(projectPath, relativePath)`
- IPC returns: `file://` URLs for renderer to load textures

## Dependencies Rationale

- **earcut**: Required for polygon triangulation (cannot use THREE.Shape on sphere)
- **sharp**: High-performance image processing in main process (Node.js only)
- **file-type**: Validate image format from buffer (security)
- **electron-store**: Persist app preferences (window size, recent files)
- **lodash-es**: Throttle utility for performance (hover detection)

## Current Project Structure

```
panoramic-game-creator/
├── src/
│   ├── main/
│   │   └── index.ts                      # Electron main process
│   ├── preload/
│   │   ├── index.ts                      # IPC bridge
│   │   └── index.d.ts                    # Preload type definitions
│   └── renderer/
│       └── src/
│           ├── components/
│           │   ├── layout/               # ✅ Layout components
│           │   │   ├── AppLayout.tsx     # Main app container
│           │   │   ├── Toolbar.tsx       # Top toolbar
│           │   │   ├── NodeListPanel.tsx # Left sidebar with node list
│           │   │   └── PropertiesPanel.tsx # Right sidebar with properties
│           │   ├── editor/               # ✅ Editor components
│           │   │   ├── PanoramaViewer.tsx
│           │   │   ├── PanoramaSphere.tsx
│           │   │   ├── HotspotRenderer.tsx
│           │   │   └── ... (hotspot drawing components)
│           │   ├── graph/                # ✅ NEW: Phase 6
│           │   │   ├── GraphView.tsx     # React Flow container
│           │   │   └── CustomNodeCard.tsx # Custom node component
│           │   ├── dialogs/              # ✅ Dialogs
│           │   │   ├── AddNodeDialog.tsx
│           │   │   └── NewProjectDialog.tsx
│           │   └── ui/                   # ✅ shadcn components
│           │       ├── button.tsx
│           │       ├── card.tsx
│           │       ├── badge.tsx
│           │       └── ... (other shadcn components)
│           ├── lib/
│           │   ├── config.ts             # ✅ All constants
│           │   ├── coordinates.ts        # ✅ Coordinate conversions
│           │   ├── graphConverters.ts    # ✅ NEW: Project → React Flow converters
│           │   ├── graphSelectors.ts     # ✅ NEW: Graph data selectors
│           │   ├── graphUtils.ts         # ✅ NEW: Graph utilities
│           │   ├── graphValidation.ts    # ✅ NEW: Graph validation
│           │   ├── imageImport.ts        # ✅ Image import utilities
│           │   └── utils.ts              # Tailwind merge utilities
│           ├── types/
│           │   ├── project.ts            # ✅ Project, ProjectSettings
│           │   ├── node.ts               # ✅ Node, PanoramaData
│           │   ├── hotspot.ts            # ✅ Hotspot, SphericalPoint
│           │   ├── graph.ts              # ✅ NEW: GraphNode, GraphEdge
│           │   └── index.ts              # Barrel exports
│           ├── stores/
│           │   ├── projectStore.ts       # ✅ Project data store
│           │   └── editorStore.ts        # ✅ UI state store
│           ├── App.tsx                   # ✅ Main app component
│           └── main.tsx                  # React entry
├── electron/
│   └── main/
│       ├── fileHandlers.ts               # ✅ File dialog handlers
│       └── projectHandlers.ts            # ✅ Project save/load handlers
├── package.json                          # ✅ All dependencies installed
├── CLAUDE.md                             # This file
├── plan.md                               # Phase-by-phase implementation plan
├── TECHNICAL_SPEC.md                     # Detailed algorithms and specs
└── DECISIONS.md                          # All technical decisions
```

### What's Working Now (Phase 6 Complete)

The application now has a fully functional node graph visualization:

1. **Graph View**: React Flow canvas showing all nodes with smooth bezier edge connections
2. **Interactive Nodes**: Drag to reposition (persisted), click to select and switch to Editor
3. **Visual Feedback**: Start node (green border), orphaned nodes (orange), connection counts
4. **Smart Edges**: Curved connectors from right handle → left handle, animated from start node
5. **Graph Controls**: Pan, zoom, fit view, minimap with color-coded nodes
6. **View Switching**: Seamless switching between Editor and Graph views with state sync

## Important Implementation Notes

### When implementing React Flow (Graph View):

- Use `type: 'default'` for smooth bezier curves (not 'smoothstep' which creates angled corners)
- Handles must have explicit IDs that match edge `sourceHandle`/`targetHandle` properties
- Position handles: `target` on left (Position.Left), `source` on right (Position.Right)
- Node position changes: throttle updates to avoid excessive store mutations
- Edge derivation: edges are computed from hotspots, never created directly by user
- Selection sync: clicking a node in graph view switches to editor and selects that node

### When implementing Three.js components:

- Use React Three Fiber (`<Canvas>`) for declarative Three.js
- Use refs to access Three.js objects imperatively when needed
- Camera must be at origin (0,0,0) looking outward
- Sphere geometry needs negative scale to invert normals

### When implementing IPC:

- Type the preload API with TypeScript
- Export type from preload, declare global in renderer
- Always validate inputs in main process handlers
- Return structured errors, never throw

### When implementing Zustand stores:

- Keep stores minimal and focused
- Use middleware for devtools in development
- Don't store derived state (compute on-demand)
- Separate persisted data (project) from ephemeral UI state (editor)

### When implementing file operations:

- Use `fs-extra` or `fs/promises` (async)
- Create directories before writing files
- Validate paths to prevent directory traversal
- Handle ENOENT, EACCES, ENOSPC errors gracefully

## Decision Authority

All technical decisions are documented in DECISIONS.md. If you need to make a new decision:

1. Check if it contradicts existing decisions
2. Consider impact on other phases
3. Document the decision and rationale
4. Update relevant sections of plan.md and TECHNICAL_SPEC.md

**Do not change fundamental decisions** (sphere radius, coordinate system, file format) without explicit user approval.

## Getting Unstuck

If blocked on technical details:

1. Check TECHNICAL_SPEC.md first (most detailed)
2. Check plan.md for high-level approach
3. Check DECISIONS.md for what was already decided
4. Ask user for clarification rather than guessing

If implementation differs from spec, update the spec to reflect reality.

---

**Status**: Phase 7 Step 1 ✅ Complete | Building Game Player (Phase 7) 🎯
**Last Updated**: 2025-11-16
**Current Progress**: Phase 7 Step 1 complete - Safety features verified and isDirty tracking fixed
**Strategic Pivot**: Phases 7 & 8 reordered - Building game player FIRST to complete vertical slice (create → play)
**Next Step**: Phase 7 Step 2 - Plan Player Architecture (see plan.md Phase 7 Implementation Checklist)
**Recent Fix**: isDirty tracking now works for all mutations (nodes, hotspots, graph positions)
