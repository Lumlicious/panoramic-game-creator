# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Panoramic Game Creator is a desktop Electron application for creating panoramic point-and-click adventure games. Users create nodes with 360° panoramic images, draw polygonal hotspots on the panoramas that link to other nodes, and visualize the node graph.

**Current Status**: Phase 1 complete. Ready for Phase 2: Basic App Layout.

### Completed Phases

- ✅ **Phase 1: Project Setup**
  - shadcn-electron-app template cloned and configured
  - All dependencies installed (Three.js, React Three Fiber, Zustand, React Flow, earcut, sharp, etc.)
  - Project structure created (`src/types/`, `src/lib/`, `src/stores/`)
  - Type definitions implemented (Project, Node, Hotspot, PanoramaData, SphericalPoint)
  - Configuration constants defined (all specs in `src/lib/config.ts`)
  - Coordinate conversion utilities scaffolded in `src/lib/coordinates.ts`

### Current Phase

**Phase 2: Basic App Layout** - See **plan.md Phase 2** for complete details.

Key deliverables:
- Application shell with toolbar, panels, and center area
- View switching between Editor and Graph views
- Use shadcn components (Button, Card, Tabs, ScrollArea)
- Basic styling with Tailwind CSS

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
│   │   └── index.ts                   # Electron main process (template)
│   ├── preload/
│   │   ├── index.ts                   # IPC bridge (template)
│   │   └── index.d.ts                 # Preload type definitions
│   └── renderer/
│       └── src/
│           ├── components/
│           │   └── ui/                # shadcn: Button, AlertDialog
│           ├── lib/
│           │   ├── config.ts          # ✅ All constants (SPHERE_CONFIG, CAMERA_CONFIG, etc.)
│           │   ├── coordinates.ts     # ✅ Cartesian ↔ Spherical conversions
│           │   └── utils.ts           # Tailwind merge utilities
│           ├── types/
│           │   ├── project.ts         # ✅ Project, ProjectSettings
│           │   ├── node.ts            # ✅ Node, PanoramaData
│           │   ├── hotspot.ts         # ✅ Hotspot, SphericalPoint, HotspotStyle
│           │   └── index.ts           # Barrel exports
│           ├── stores/                # 📁 Empty - ready for Zustand stores
│           ├── App.tsx                # Template boilerplate (to be replaced)
│           └── main.tsx               # React entry
├── package.json                       # ✅ All dependencies installed
├── CLAUDE.md                          # This file
├── plan.md                            # Phase-by-phase implementation plan
├── TECHNICAL_SPEC.md                  # Detailed algorithms and specs
└── DECISIONS.md                       # All technical decisions
```

### What to Build Next (Phase 2)

See **plan.md Phase 2: Basic App Layout** for complete requirements. Summary:

1. Create layout components:
   - `components/layout/AppLayout.tsx` - Main container
   - `components/layout/Toolbar.tsx` - Top toolbar with buttons
   - `components/layout/NodeListPanel.tsx` - Left sidebar
   - `components/layout/PropertiesPanel.tsx` - Right sidebar
2. Create editor store: `stores/editorStore.ts` (UI state: selected node, view mode, etc.)
3. Install additional shadcn components: Card, Tabs, ScrollArea
4. Update `App.tsx` to use new layout
5. Implement view switching (Editor ↔ Graph)

## Important Implementation Notes

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

**Status**: Phase 1 ✅ Complete | Phase 2 🔄 Ready to Start
**Last Updated**: 2025-11-04
**Current Milestone**: Create application shell (see plan.md Phase 2)
**Next Phase After Phase 2**: Phase 3 - Panorama Viewer (Three.js sphere rendering)
