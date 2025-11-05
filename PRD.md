# Panoramic Game Creator (PGC) - Product Requirements Document

**Version:** 1.0  
**Last Updated:** November 5, 2025  
**Status:** Draft

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Core Features (MVP)](#2-core-features-mvp)
3. [Data Models](#3-data-models)
4. [Architecture](#4-architecture)
5. [Interactive Nodes System](#5-interactive-nodes-system)
6. [Hotspot Polygon Editor](#6-hotspot-polygon-editor)
7. [User Interface Layout](#7-user-interface-layout)
8. [Development Phases](#8-development-phases)
9. [Technical Specifications](#9-technical-specifications)
10. [Success Metrics](#10-success-metrics)

---

## 1. Product Overview

### 1.1 Vision

A desktop application that enables game developers to create narrative-driven, panoramic point-and-click adventure games with full game engine capabilities.

### 1.2 Target Users

Game developers comfortable with light front-end coding (React/TypeScript) for advanced interactive features.

### 1.3 Export Target

Static web application (HTML/CSS/JS bundle) that can be hosted anywhere without a backend.

### 1.4 Key Differentiators

- **Panoramic navigation**: 360° spherical or cubic panoramas
- **Visual hotspot editor**: Draw polygons directly on 3D panorama
- **Interactive nodes**: Custom React components for complex puzzles
- **Game engine capabilities**: State management, inventory, audio
- **Web export**: No proprietary runtime, just standard web tech

---

## 2. Core Features (MVP)

### 2.1 Project Management

- ✅ Create new project with name and settings
- ✅ Open existing `.pgc` projects
- ✅ Save project (auto-save + manual save)
- ✅ Project settings panel (default FOV, hotspot colors, starting node)
- ✅ Export to web bundle (HTML/JS/CSS + assets)

### 2.2 Node Management

**Node Types:**

- **Panoramic Node**: 360° navigable space (equirectangular or cubic)
- **Interactive Node**: Custom React component for puzzles/interactions

**Features:**

- ✅ Add/delete/duplicate nodes
- ✅ Set node name and description
- ✅ Upload panoramic images (single equirectangular or 6 cubic faces)
- ✅ Auto-generate thumbnails (200x100px)
- ✅ Mark starting node (visual indicator)
- ✅ Node position in graph view (drag to organize)

### 2.3 Hotspot System

- ✅ Draw polygonal hotspots directly on panorama (click to place vertices)
- ✅ Edit existing hotspots (move vertices, add/remove)
- ✅ Link hotspots to target nodes
- ✅ Hotspot styling (fill color, stroke, opacity, hover state)
- ✅ Hotspot naming
- ✅ Visual feedback in preview (highlight on hover)
- ✅ Max 20 vertices per polygon

### 2.4 Audio System

**Per-Node Audio:**

- ✅ Ambient background music (looping)
- ✅ Ambient sound effects (looping, e.g., wind, water)
- ✅ Entry sound (plays once when node loads)

**Per-Hotspot Audio:**

- ✅ Hover SFX (on mouse enter)
- ✅ Click SFX (on interaction)

**Future: Spatial Audio**

- 🔮 3D positional audio based on look direction
- 🔮 Attenuation and distance falloff

### 2.5 State Management (Game Engine)

- ✅ Global variables/flags system (boolean, number, string)
- ✅ Inventory system (item IDs)
- ✅ Conditional hotspot visibility (show/hide based on state)
- ✅ Conditional node access (gate nodes behind requirements)
- ✅ Save/load game state in exported runtime

### 2.6 Graph Visualization

- ✅ React Flow-based node graph
- ✅ Nodes display thumbnail + name + type icon
- ✅ Edges show hotspot connections
- ✅ Click node to select/edit
- ✅ Drag nodes to organize layout
- ✅ Pan and zoom navigation
- ✅ Highlight selected node and connections
- ✅ Visual indicators: starting node, orphaned nodes

### 2.7 Preview Mode

- ✅ Navigate as player would (first-person camera)
- ✅ Mouse drag to look around
- ✅ Click hotspots to navigate
- ✅ Audio playback (music, SFX)
- ✅ State display (debug overlay)
- ✅ Toggle hotspot editor overlay
- ✅ Exit preview returns to last view
- ✅ Camera rotation persists between views

---

## 3. Data Models

### 3.1 Project

```typescript
interface Project {
  id: string // UUID
  name: string // User-defined project name
  version: string // File format version (e.g., "1.0.0")
  created: string // ISO timestamp
  modified: string // ISO timestamp
  startNodeId: string | null // Starting node for the game
  nodes: Node[] // All nodes in the project
  gameState: GameState // Initial game state
  settings: ProjectSettings // Project-wide settings
}

interface ProjectSettings {
  defaultFOV: number // Default field of view (default: 75)
  hotspotDefaultColor: string // Hex color
  hotspotHoverColor: string // Hex color
  hotspotOpacity: number // 0-1
  transitionDuration: number // ms
  enableAudio: boolean
  masterVolume: number // 0-1
}
```

### 3.2 Game State

```typescript
interface GameState {
  variables: Record<string, boolean | number | string>
  inventory: string[] // Item IDs
  visitedNodes: string[] // Node IDs
  currentNodeId: string | null
}
```

### 3.3 Node

```typescript
interface Node {
  id: string // UUID
  name: string // User-defined name
  type: 'panoramic' | 'interactive'

  // For panoramic nodes
  panorama?: PanoramaData
  hotspots?: Hotspot[]

  // For interactive nodes
  interactive?: InteractiveNodeData

  // Common
  audio: NodeAudio
  position: { x: number; y: number } // For graph layout
  metadata: {
    description?: string
    tags?: string[]
    created: string
    modified: string
  }
}
```

### 3.4 Panorama Data

```typescript
interface PanoramaData {
  type: 'equirectangular' | 'cubic'

  // Equirectangular: single image
  filePath?: string // Relative to assets/panoramas/

  // Cubic: 6 faces (naming convention: {nodeId}_front.jpg, etc.)
  faces?: {
    front: string
    back: string
    left: string
    right: string
    top: string
    bottom: string
  }

  thumbnailPath?: string // Auto-generated
}
```

### 3.5 Hotspot

```typescript
interface Hotspot {
  id: string // UUID
  name: string // User-defined name
  targetNodeId: string | null // Destination node
  polygon: SphericalPoint[] // Min 3, max 20 vertices
  style: HotspotStyle
  audio: HotspotAudio
  conditions?: HotspotConditions // Phase 2
}

interface SphericalPoint {
  theta: number // Azimuthal angle (-π to π, horizontal rotation)
  phi: number // Polar angle (0 to π, 0=top, π=bottom)
}

interface HotspotStyle {
  fillColor: string // Hex color
  strokeColor: string // Hex color
  strokeWidth: number // px
  opacity: number // 0-1
  hoverFillColor?: string // Hex color (optional)
  hoverOpacity?: number // 0-1 (optional)
  cursorStyle?: 'pointer' | 'crosshair' | 'help'
}

interface HotspotAudio {
  hoverSFX?: AudioAsset
  clickSFX?: AudioAsset
}
```

### 3.6 Interactive Node Data

```typescript
interface InteractiveNodeData {
  componentPath: string // e.g., "interactive-nodes/CombinationLock.tsx"
  componentName: string // e.g., "CombinationLock"
  initialProps: Record<string, any> // JSON props passed to component
  declaredVariables: string[] // Variables this component uses
  dimensions: {
    fullscreen: boolean
    width?: number // px (if not fullscreen)
    height?: number // px (if not fullscreen)
  }
}
```

### 3.7 Audio Asset

```typescript
interface AudioAsset {
  filePath: string // Relative to assets/audio/
  volume: number // 0-1
  loop: boolean
  fadeIn?: number // ms
  fadeOut?: number // ms
}

interface NodeAudio {
  ambientMusic?: AudioAsset
  ambientSFX?: AudioAsset
  entrySFX?: AudioAsset
}
```

### 3.8 Conditions (Phase 2)

```typescript
interface HotspotConditions {
  visible?: Condition[] // Show/hide hotspot
  enabled?: Condition[] // Enable/disable interaction
}

type Condition =
  | { type: 'variable'; key: string; operator: '==' | '!=' | '>' | '<'; value: any }
  | { type: 'inventory'; itemId: string; has: boolean }
  | { type: 'visited'; nodeId: string }
```

---

## 4. Architecture

### 4.1 Tech Stack

```
Core Technologies:
- electron-vite       - Official Electron + Vite integration
- React               - UI framework
- TypeScript          - Type-safe development
- Tailwind CSS        - Utility-first styling
- shadcn/ui           - Pre-built accessible components

Key Libraries:
- Three.js            - 3D rendering
- React Three Fiber   - React wrapper for Three.js
- Drei                - Three.js helpers
- React Flow          - Node graph visualization
- Zustand             - Lightweight state management
- electron-builder    - Application packaging
```

### 4.2 Project Structure

```
src/
├── main/                          # Electron main process
│   ├── index.ts                   # Main entry point
│   ├── ipc/                       # IPC handlers
│   │   ├── project.ts             # File I/O operations
│   │   ├── assets.ts              # Asset management
│   │   └── export.ts              # Web export
│   └── utils/
│       └── bundler.ts             # .pgc bundle operations
│
├── renderer/                      # Electron renderer process
│   ├── src/
│   │   ├── App.tsx                # Root component
│   │   │
│   │   ├── store/                 # Zustand stores
│   │   │   ├── projectStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── MainLayout.tsx          # 3-pane layout
│   │   │   │   ├── LeftPanel.tsx           # Actions & node list
│   │   │   │   ├── CenterPanel.tsx         # Panorama/Graph/Preview
│   │   │   │   └── RightPanel.tsx          # Properties
│   │   │   │
│   │   │   ├── LeftPanel/
│   │   │   │   ├── NodeList.tsx
│   │   │   │   ├── NodeListItem.tsx
│   │   │   │   ├── QuickActions.tsx
│   │   │   │   └── HotspotList.tsx
│   │   │   │
│   │   │   ├── CenterPanel/
│   │   │   │   ├── ViewTabs.tsx
│   │   │   │   ├── PanoramaView/
│   │   │   │   │   ├── PanoramaCanvas.tsx   # Three.js scene
│   │   │   │   │   ├── HotspotOverlay.tsx   # SVG overlay
│   │   │   │   │   ├── HotspotDrawer.tsx    # Polygon drawing
│   │   │   │   │   └── Toolbar.tsx          # Drawing tools
│   │   │   │   ├── GraphView/
│   │   │   │   │   ├── NodeGraph.tsx        # React Flow
│   │   │   │   │   └── CustomNode.tsx       # Node component
│   │   │   │   └── InteractiveView/
│   │   │   │       ├── InteractivePreview.tsx
│   │   │   │       ├── TestToolbar.tsx
│   │   │   │       └── ConsolePanel.tsx
│   │   │   │
│   │   │   ├── RightPanel/
│   │   │   │   ├── PropertiesPanel.tsx
│   │   │   │   ├── NodeProperties.tsx
│   │   │   │   ├── HotspotProperties.tsx
│   │   │   │   ├── InteractiveNodeProperties.tsx
│   │   │   │   ├── ProjectSettings.tsx
│   │   │   │   └── AudioSettings.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── FileUpload.tsx
│   │   │       ├── ColorPicker.tsx
│   │   │       ├── AudioPlayer.tsx
│   │   │       └── CodeEditor.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── panorama/
│   │   │   │   ├── renderer.ts              # Three.js setup
│   │   │   │   ├── raycaster.ts             # Hotspot detection
│   │   │   │   └── sphericalUtils.ts        # Coordinate conversions
│   │   │   ├── hotspot/
│   │   │   │   ├── polygonEditor.ts
│   │   │   │   └── validator.ts
│   │   │   ├── interactive/
│   │   │   │   ├── componentLoader.ts
│   │   │   │   ├── gameContextProvider.ts
│   │   │   │   └── validator.ts
│   │   │   ├── export/
│   │   │   │   ├── bundler.ts               # Create web export
│   │   │   │   └── runtime.ts               # Runtime player code
│   │   │   └── audio/
│   │   │       └── manager.ts               # Audio playback
│   │   │
│   │   └── types/
│   │       ├── project.ts                   # All interfaces
│   │       └── ipc.ts                       # IPC types
│   │
│   └── index.html
│
└── runtime/                       # Exported game runtime (separate build)
    ├── index.html
    ├── player.js
    └── styles.css
```

### 4.3 State Management (Zustand Stores)

```typescript
// Project store
interface ProjectStore {
  project: Project | null
  selectedNodeId: string | null
  selectedHotspotId: string | null

  // Actions
  createProject: (name: string) => void
  openProject: (path: string) => Promise<void>
  saveProject: () => Promise<void>

  addNode: (type: 'panoramic' | 'interactive') => void
  deleteNode: (id: string) => void
  updateNode: (id: string, updates: Partial<Node>) => void

  addHotspot: (nodeId: string, polygon: SphericalPoint[]) => void
  deleteHotspot: (nodeId: string, hotspotId: string) => void
  updateHotspot: (nodeId: string, hotspotId: string, updates: Partial<Hotspot>) => void

  selectNode: (id: string | null) => void
  selectHotspot: (id: string | null) => void
}

// UI state store
interface UIStore {
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  activeView: 'panorama' | 'graph'
  previewMode: boolean
  hotspotEditMode: boolean

  // Camera state (for persistence)
  cameraRotation: { theta: number; phi: number }

  // Actions
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setActiveView: (view: 'panorama' | 'graph') => void
  enterPreview: () => void
  exitPreview: () => void
  toggleHotspotEdit: () => void
  saveCameraRotation: (theta: number, phi: number) => void
}
```

### 4.4 File Structure (.pgc Bundle)

```
MyAdventure.pgc/                  # Directory with .pgc extension
├── project.json                  # Main project file
├── assets/
│   ├── panoramas/
│   │   ├── node-abc123.jpg       # Equirectangular
│   │   ├── node-def456_front.jpg # Cubic faces
│   │   ├── node-def456_back.jpg
│   │   ├── node-def456_left.jpg
│   │   ├── node-def456_right.jpg
│   │   ├── node-def456_top.jpg
│   │   └── node-def456_bottom.jpg
│   ├── thumbnails/               # Auto-generated
│   │   ├── node-abc123.jpg
│   │   └── node-def456.jpg
│   ├── audio/
│   │   ├── ambient_forest.mp3
│   │   ├── success.mp3
│   │   └── error.mp3
│   └── images/                   # For interactive nodes
│       └── texture.png
├── interactive-nodes/            # User-created React components
│   ├── CombinationLock.tsx
│   └── DocumentReader.tsx
└── .pgc-meta/
    └── version.txt               # File format version
```

**Bundle Behavior:**

- **macOS**: Appears as single file (bundle)
- **Windows/Linux**: Appears as folder with .pgc extension

---

## 5. Interactive Nodes System

### 5.1 Overview

Interactive nodes are custom React components for puzzles and complex interactions. Developers write the components, and the editor provides:

- Scaffolding generation
- Live preview in editor
- State management interface
- Testing environment

### 5.2 Creating an Interactive Node

**Workflow:**

1. User clicks "Add Node" → Selects "Interactive Node"

2. Properties panel shows two options:
   - **Create New**: Enter component name, generates scaffolding
   - **Select Existing**: Dropdown of `.tsx` files in `interactive-nodes/`

3. When "Create Component" clicked:
   - App generates file with boilerplate code
   - Component automatically assigned to node
   - Properties panel updates to show loaded state

4. After component loaded, properties panel shows:
   - Component name and file path
   - "Open in External Editor" button
   - "Refresh Component" button
   - Initial Props JSON editor
   - Shared State Variables list
   - Dimensions settings (fullscreen or custom)

5. Center panel shows live preview:
   - Component renders in isolated context
   - User can interact and test
   - State changes visible in properties
   - "Test Mode" toggle

### 5.3 GameContext Interface

Every interactive node component receives a `gameContext` prop:

```typescript
export interface GameContext {
  // Navigation
  closeNode: () => void // Return to previous panoramic node
  navigateToNode: (nodeId: string) => void // Jump to specific node

  // State management
  state: {
    variables: Record<string, any>
    inventory: string[]
    visitedNodes: string[]
  }

  // State mutations
  setVariable: (key: string, value: any) => void
  getVariable: (key: string) => any
  addInventoryItem: (itemId: string) => void
  removeInventoryItem: (itemId: string) => void
  hasInventoryItem: (itemId: string) => boolean

  // Audio
  playSound: (filePath: string, options?: AudioOptions) => void
  stopSound: (filePath: string) => void

  // Save/Load
  saveGame: () => void

  // Node info
  currentNodeId: string
  previousNodeId: string | null
}

interface AudioOptions {
  volume?: number
  loop?: boolean
  fadeDuration?: number
}
```

### 5.4 Component Scaffolding Template

When creating a new interactive node, the editor generates this boilerplate:

```typescript
import React, { useState } from 'react';

/**
 * Auto-generated interactive node component
 *
 * Props:
 * - gameContext: Provided by the game engine
 * - [custom props]: Defined in the editor's "Initial Props" JSON
 *
 * Available via gameContext:
 * - closeNode(): Return to previous panoramic node
 * - navigateToNode(nodeId): Jump to specific node
 * - setVariable(key, value): Set global game variable
 * - getVariable(key): Get global game variable
 * - addInventoryItem(itemId): Add item to player inventory
 * - removeInventoryItem(itemId): Remove item from inventory
 * - hasInventoryItem(itemId): Check if player has item
 * - playSound(path, options): Play audio file
 * - saveGame(): Trigger game save
 * - state: Current game state (variables, inventory, visitedNodes)
 */

export interface GameContext {
  closeNode: () => void;
  navigateToNode: (nodeId: string) => void;
  setVariable: (key: string, value: any) => void;
  getVariable: (key: string) => any;
  addInventoryItem: (itemId: string) => void;
  removeInventoryItem: (itemId: string) => void;
  hasInventoryItem: (itemId: string) => boolean;
  playSound: (filePath: string, options?: { volume?: number; loop?: boolean }) => void;
  stopSound: (filePath: string) => void;
  saveGame: () => void;
  state: {
    variables: Record<string, any>;
    inventory: string[];
    visitedNodes: string[];
  };
  currentNodeId: string;
  previousNodeId: string | null;
}

interface ComponentNameProps {
  gameContext: GameContext;
  // Add your custom props here (defined in editor's Initial Props)
}

export default function ComponentName({
  gameContext
}: ComponentNameProps) {
  const [state, setState] = useState({});

  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl text-white mb-4">Interactive Node</h2>

        <p className="text-gray-300 mb-4">
          Customize this component to create your puzzle or interaction.
        </p>

        <button
          onClick={gameContext.closeNode}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

### 5.5 Testing Interactive Nodes

**Live Preview in Editor:**

- Center panel renders component with mock `gameContext`
- User can interact (type, click, drag)
- State changes visible in properties panel
- Console shows `gameContext` method calls

**Test Controls:**

- [Test Mode: ON/OFF] - Simulates full game context
- [Reset State] - Clear all variables/inventory
- [View Console] - Show gameContext call log

### 5.6 Export and Runtime

**Export Process:**

1. Bundle all `.tsx` files with esbuild/vite
2. Include bundled components in exported game
3. Runtime player loads components dynamically

**Runtime Behavior:**

1. When hotspot links to interactive node:
   - Fade out panorama
   - Mount React component with real `gameContext`
   - Render fullscreen or in modal
2. When `closeNode()` called:
   - Unmount component
   - Fade back to previous panoramic node
   - Resume audio/state

---

## 6. Hotspot Polygon Editor

### 6.1 Overview

Visual tool for drawing polygonal hotspots directly on 3D panorama sphere. Hotspots define clickable regions that navigate to other nodes.

### 6.2 Editor Modes

**View Mode (Default):**

- Mouse drag to look around
- Click hotspots to select (highlights them)
- Cannot modify polygons

**Edit Mode:**

- Toggle with "🎨 Edit Hotspots" button or `E` key
- Can draw new polygons
- Can edit existing polygons
- Visual overlay shows all hotspots with vertices

### 6.3 Drawing Workflow

**Creating New Polygon:**

1. Enter Edit Mode (click toggle or press `E`)
2. Click "+ New Hotspot" button (or press `N`)
3. Click on panorama to place vertices (min 3, max 20)
4. Each click adds vertex, lines connect automatically
5. After 3rd vertex, polygon fills with semi-transparent color
6. Press `ENTER` to finish (or click near first vertex, or right-click)
7. Polygon auto-named "Hotspot 1", "Hotspot 2", etc.
8. Properties panel opens for naming and target assignment

**Visual Feedback:**

- Vertices: Blue circles (8px radius)
- Edges: Blue lines (2px stroke)
- Fill: Semi-transparent blue (30% opacity after 3+ vertices)
- Preview line: Dashed line from last vertex to cursor
- Vertex labels: Small numbers (1, 2, 3...)

**Canceling:**

- Press `ESC` key
- All placed vertices removed
- Returns to edit mode idle

### 6.4 Editing Existing Polygons

**Selecting Polygon:**

- Click inside polygon area
- Click on edge or vertex
- Select from hotspot list in left panel

**Moving Vertices:**

1. Select polygon
2. Hover over vertex (cursor changes to `move`)
3. Click and drag to new position
4. Release to confirm

**Adding Vertices:**

1. Select polygon
2. Hover over edge (midpoint indicator appears)
3. Click edge to insert new vertex
4. Immediately enter drag mode for positioning

**Removing Vertices:**

1. Select polygon
2. Right-click vertex → "Delete Vertex"
3. OR: Select vertex and press `DELETE` key
4. Blocked if polygon has only 3 vertices (minimum required)

**Deleting Hotspot:**

1. Select polygon
2. Click "Delete" button in toolbar (or press `DEL`)
3. Confirm deletion in dialog

### 6.5 Visual States

| State      | Fill Opacity | Stroke Width | Vertex Size | Color |
| ---------- | ------------ | ------------ | ----------- | ----- |
| Unselected | 10%          | 1px          | 5px         | Gray  |
| Hovered    | 40%          | 2px          | 5px         | Gray  |
| Selected   | 30%          | 2px          | 10px        | Blue  |
| Drawing    | 30%          | 2px          | 8px         | Blue  |
| Invalid    | -            | 2px          | 8px         | Red   |

### 6.6 Keyboard Shortcuts

| Key      | Action                            |
| -------- | --------------------------------- |
| `E`      | Toggle edit mode                  |
| `N`      | Start new hotspot                 |
| `V`      | Switch to vertex edit tool        |
| `ENTER`  | Finish drawing polygon            |
| `ESC`    | Cancel drawing / deselect         |
| `DELETE` | Delete selected hotspot or vertex |
| `Z`      | Undo last vertex (while drawing)  |
| `Space`  | Hold to temporarily pan camera    |

### 6.7 Coordinate System

**Storage: Spherical Coordinates**

```typescript
interface SphericalPoint {
  theta: number // Azimuthal angle: -π to π (horizontal)
  phi: number // Polar angle: 0 to π (vertical, 0=top)
}
```

**Why Spherical?**

- Rotation-independent (polygon stays fixed on sphere)
- Consistent across panorama resolutions
- Natural for spherical geometry

**Key Conversions:**

```typescript
// Screen click → 3D position on sphere
function screenToWorld(
  screenX: number,
  screenY: number,
  camera: THREE.Camera,
  sphereRadius: number
): THREE.Vector3 | null

// 3D position → Spherical coordinates
function worldToSpherical(position: THREE.Vector3): SphericalPoint

// Spherical → 3D position
function sphericalToWorld(point: SphericalPoint, radius: number): THREE.Vector3

// 3D position → Screen coordinates (for SVG rendering)
function worldToScreen(
  position: THREE.Vector3,
  camera: THREE.Camera
): { x: number; y: number } | null
```

### 6.8 Rendering Approach

**SVG Overlay (Recommended)**

- Render polygons as SVG elements overlaid on Three.js canvas
- Convert spherical coords → screen coords each frame
- Update positions when camera moves
- Pros: Easy styling, smooth edges, good performance

**Render Loop:**

```typescript
// Each frame
for (const hotspot of hotspots) {
  // Convert spherical points to screen coordinates
  const screenPoints = hotspot.polygon
    .map((sphericalPoint) => {
      const worldPos = sphericalToWorld(sphericalPoint, SPHERE_RADIUS)
      return worldToScreen(worldPos, camera)
    })
    .filter((p) => p !== null) // Remove points behind camera

  // Draw SVG polygon
  drawSVGPolygon(screenPoints, hotspot.style)
}
```

### 6.9 Click Detection (Ray-casting)

```typescript
function handleCanvasClick(event: MouseEvent, camera: THREE.Camera) {
  // Get world position on sphere
  const worldPos = screenToWorld(event.clientX, event.clientY, camera, SPHERE_RADIUS)
  if (!worldPos) return

  // Convert to spherical
  const sphericalPos = worldToSpherical(worldPos)

  // Check if click is inside any hotspot polygon
  const clickedHotspot = findHotspotAtPosition(sphericalPos, hotspots)

  if (clickedHotspot) {
    handleHotspotClick(clickedHotspot)
  } else if (drawingMode) {
    addVertex(sphericalPos)
  }
}

// Point-in-polygon test on sphere surface
function isPointInSphericalPolygon(point: SphericalPoint, polygon: SphericalPoint[]): boolean {
  // Convert to 3D vectors
  const pointVec = sphericalToWorld(point, 1)
  const polyVecs = polygon.map((p) => sphericalToWorld(p, 1))

  // Use winding number algorithm
  // Return true if point is inside
}
```

### 6.10 Validation Rules

- **Minimum vertices**: 3 (enforced)
- **Maximum vertices**: 20 (hard limit)
- **Warning at**: 15 vertices ("Consider simplifying")
- **Self-intersections**: Warn but allow
- **Overlapping hotspots**: Allow (topmost selected on click)
- **Points behind camera**: Don't render (check z > 1)

### 6.11 Performance

**Optimization Strategies:**

- Throttle SVG updates to 60fps (requestAnimationFrame)
- Don't render hotspots behind camera (occlusion culling)
- Cache screen positions when camera unchanged (dirty checking)
- Vertex limit (20) prevents excessive complexity

**Expected Performance:**

- 50 hotspots @ 10 vertices = 500 vertices
- Screen projection: 30k calculations/sec at 60fps
- With memoization: 10x reduction (only on camera move)
- Result: Smooth 60fps on integrated graphics

---

## 7. User Interface Layout

### 7.1 Three-Pane Layout

```
┌────────────────────────────────────────────────────────────┐
│ Menu Bar: File | Edit | View | Help                        │
├──────────┬──────────────────────────────────┬──────────────┤
│          │                                  │              │
│  LEFT    │           CENTER                 │    RIGHT     │
│  PANEL   │           PANEL                  │    PANEL     │
│          │                                  │              │
│  Actions │  Panorama / Graph / Preview      │  Properties  │
│  & Nodes │                                  │              │
│          │                                  │              │
│  280px   │          (flex-grow)             │    320px     │
│          │                                  │              │
│  [◀]     │                                  │     [▶]      │
│  Collapse│                                  │   Collapse   │
└──────────┴──────────────────────────────────┴──────────────┘
│ Status Bar: Current Node | Vertex Count | FPS             │
└────────────────────────────────────────────────────────────┘
```

### 7.2 Left Panel (~280px, collapsible)

```
┌─────────────────────────────┐
│ [+ Add Node]  [🎮 Preview] │
├─────────────────────────────┤
│ 🔍 Search nodes...          │
├─────────────────────────────┤
│ Nodes (12)                  │
│ ┌─────────────────────────┐ │
│ │ 🌟 [Thumbnail]          │ │  ← Starting node
│ │ 🗺️ Entrance Hall        │ │  ← Panoramic
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │   [Thumbnail]           │ │
│ │ 🧩 Combination Lock     │ │  ← Interactive
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │   [Thumbnail]           │ │
│ │ 🗺️ Library              │ │  ← Panoramic
│ └─────────────────────────┘ │
│ ...                         │
└─────────────────────────────┘
```

**Features:**

- Node list with thumbnails
- Type indicators (🗺️ panoramic, 🧩 interactive)
- Starting node marker (🌟)
- Search and filter
- Quick actions: Add Node, Preview Game
- Collapsible to maximize center panel

### 7.3 Center Panel (flex-grow)

```
┌───────────────────────────────────────────────┐
│ [Panorama] [Graph]       🎮 Preview Mode      │ ← Tabs + Toggle
├───────────────────────────────────────────────┤
│ 🎨 Edit Hotspots [ON] | + New | Edit | Delete│ ← Toolbar (panorama)
├───────────────────────────────────────────────┤
│                                               │
│           [Panorama Canvas with SVG]          │
│                                               │
│          OR [React Flow Graph]                │
│                                               │
│          OR [Interactive Preview]             │
│                                               │
└───────────────────────────────────────────────┘
│ Status: Library | 3 hotspots | 60 FPS        │ ← Status bar
└───────────────────────────────────────────────┘
```

**Views:**

- **Panorama View**: Three.js canvas with SVG hotspot overlay
- **Graph View**: React Flow node graph
- **Preview Mode**: Player perspective for testing

**Toolbar** (context-sensitive):

- Panorama: Edit tools, hotspot controls
- Graph: Layout options, zoom controls
- Interactive: Test controls, console toggle

### 7.4 Right Panel (~320px, collapsible)

```
┌────────────────────────────┐
│ Node Properties            │ ← Context-sensitive header
├────────────────────────────┤
│ Name: [Library           ] │
│ Type: 🗺️ Panoramic         │
│                            │
│ Description:               │
│ [_______________________]  │
│                            │
│ Panorama:                  │
│ Type: ⚪ Equirectangular   │
│       ⚪ Cubic             │
│ [Upload Image...]          │
│                            │
│ Audio:                     │
│ 🎵 Ambient: [Browse...]   │
│    Volume: [====○-----]    │
│ 🔊 Entry SFX: [None]      │
│                            │
│ ─────────────────────────  │
│ Hotspots (3):              │
│ • Door to Hallway          │
│ • Window view              │
│ • Book shelf               │
│ [+ Add Hotspot]            │
└────────────────────────────┘
```

**Context-Sensitive Content:**

- **Panoramic Node**: Name, description, panorama settings, audio, hotspots
- **Interactive Node**: Component selector, props editor, state variables, dimensions
- **Hotspot Selected**: Name, target node, styling, audio, conditions
- **Project Settings**: When nothing selected

### 7.5 Color Scheme (Tailwind)

```typescript
const THEME = {
  background: {
    primary: 'bg-gray-900', // Main app background
    secondary: 'bg-gray-800', // Panels
    tertiary: 'bg-gray-700' // Cards, inputs
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    muted: 'text-gray-500'
  },
  accent: {
    primary: 'bg-blue-600', // Buttons, active states
    hover: 'bg-blue-700',
    selected: 'bg-blue-500'
  },
  border: 'border-gray-700',
  hotspot: {
    default: 'rgba(59, 130, 246, 0.1)', // blue-500, 10%
    hover: 'rgba(59, 130, 246, 0.4)', // blue-500, 40%
    selected: 'rgba(59, 130, 246, 0.3)' // blue-500, 30%
  }
}
```

---

## 8. Development Phases

### Phase 1: Core Editor (Weeks 1-3)

- ✅ Project creation/open/save (.pgc bundles)
- ✅ Node CRUD operations
- ✅ Upload equirectangular images
- ✅ Basic panorama rendering (Three.js)
- ✅ 3-pane layout with collapsible panels
- ✅ Node list with thumbnails
- ✅ Properties panel (node name, description)

### Phase 2: Hotspot System (Weeks 4-5)

- ✅ Polygon drawing on panorama (click to place vertices)
- ✅ Hotspot editing (move vertices, add/remove)
- ✅ Link hotspots to nodes
- ✅ Hotspot styling (colors, opacity, hover)
- ✅ Ray-casting for click detection
- ✅ SVG overlay rendering

### Phase 3: Graph View (Week 6)

- ✅ React Flow integration
- ✅ Display nodes and connections
- ✅ Click to select node
- ✅ Drag to reposition nodes
- ✅ Highlight selected node and connections
- ✅ Visual indicators (starting node, orphaned nodes)

### Phase 4: Preview & Audio (Weeks 7-8)

- ✅ Preview mode (player perspective)
- ✅ Navigate between nodes via hotspots
- ✅ Audio upload and management
- ✅ Per-node ambient audio
- ✅ Per-hotspot SFX
- ✅ Camera rotation persistence

### Phase 5: Export & Polish (Weeks 9-10)

- ✅ Export to web bundle
- ✅ Runtime player implementation
- ✅ Auto-save and undo/redo
- ✅ Error handling and validation
- ✅ Packaging with electron-builder
- ✅ Documentation

### Phase 6: Interactive Nodes (Weeks 11-14)

**Week 11: Foundation**

- ✅ Data model support for interactive node type
- ✅ Create interactive node workflow
- ✅ Component file structure
- ✅ Scaffolding template generation
- ✅ GameContext interface definition

**Week 12: Editor Integration**

- ✅ Component selector (create new / select existing)
- ✅ Props editor (JSON input with validation)
- ✅ State variables declaration UI
- ✅ "Open in External Editor" button
- ✅ Component validation

**Week 13: Live Preview**

- ✅ Render component in center panel
- ✅ Mock GameContext provider
- ✅ Test mode with state manipulation
- ✅ Console panel showing gameContext calls
- ✅ Hot reload support

**Week 14: Runtime Integration**

- ✅ Bundle .tsx files with esbuild in export
- ✅ Runtime component loader
- ✅ Real GameContext implementation
- ✅ Transition animations (fade panorama ↔ interactive)
- ✅ Save/load state persistence

### Phase 7: Advanced Features (Weeks 15+)

- 🔲 Cubic panorama support
- 🔲 Conditional hotspot visibility
- 🔲 State-driven logic (variables, inventory)
- 🔲 Spatial audio (if performance allows)
- 🔲 Advanced graph features (minimap, search)
- 🔲 Asset library UI

---

## 9. Technical Specifications

### 9.1 File Formats

**Panoramic Images:**

- Equirectangular: Single JPG or PNG (2:1 aspect ratio)
- Cubic: 6 images with naming convention:
  - `{prefix}_front.jpg`
  - `{prefix}_back.jpg`
  - `{prefix}_left.jpg`
  - `{prefix}_right.jpg`
  - `{prefix}_top.jpg`
  - `{prefix}_bottom.jpg`

**Image Requirements:**

- Recommended: Power of 2 dimensions (1024, 2048, 4096)
- Max size: 4096x4096 per face / 8192x4096 equirect
- Formats: JPG, PNG, WebP

**Audio:**

- Formats: MP3, OGG, WAV
- Recommended: MP3 for size, OGG for quality
- Max file size: 10MB per file (warning, not blocked)

### 9.2 Cubic Panorama Auto-Detection

```typescript
// Upload flow
function detectCubicPanorama(files: File[]): CubicPanoramaSet[] {
  const groups: Record<string, Partial<CubicFaces>> = {}

  for (const file of files) {
    const match = file.name.match(/^(.+)_(front|back|left|right|top|bottom)\.(jpg|png)$/)
    if (!match) continue

    const [, prefix, face] = match
    if (!groups[prefix]) groups[prefix] = {}
    groups[prefix][face] = file
  }

  // Validate each group has all 6 faces
  return Object.entries(groups)
    .filter(([_, faces]) =>
      ['front', 'back', 'left', 'right', 'top', 'bottom'].every((face) => faces[face])
    )
    .map(([prefix, faces]) => ({ prefix, faces: faces as CubicFaces }))
}
```

### 9.3 Electron IPC Channels

```typescript
// Main → Renderer
ipcMain.handle('project:create', async (event, name: string) => Project)
ipcMain.handle('project:open', async (event, path: string) => Project)
ipcMain.handle('project:save', async (event, project: Project) => void)
ipcMain.handle('project:export', async (event, project: Project, outputPath: string) => void)

ipcMain.handle('asset:upload', async (event, files: FileList) => Asset[])
ipcMain.handle('asset:delete', async (event, assetPath: string) => void)
ipcMain.handle('asset:generateThumbnail', async (event, imagePath: string) => string)

ipcMain.handle('component:create', async (event, name: string) => string)
ipcMain.handle('component:list', async () => string[])
ipcMain.handle('component:openExternal', async (event, path: string) => void)

ipcMain.handle('dialog:openFile', async (event, options: OpenDialogOptions) => string[])
ipcMain.handle('dialog:saveFile', async (event, options: SaveDialogOptions) => string)
```

### 9.4 Export Process

**Steps:**

1. Create output directory
2. Copy all assets (panoramas, audio, images)
3. Bundle interactive node components (esbuild)
4. Generate static HTML with embedded runtime
5. Inline project.json as JavaScript constant
6. Tree-shake unused runtime features
7. Minify JavaScript

**Output Structure:**

```
MyAdventure/                  # Exported game
├── index.html                # Entry point
├── assets/
│   ├── panoramas/
│   ├── audio/
│   └── images/
├── components/               # Bundled interactive nodes
│   └── bundle.js
└── runtime/
    ├── player.js             # Game runtime
    └── styles.css
```

### 9.5 Performance Targets

| Metric              | Target | Notes                       |
| ------------------- | ------ | --------------------------- |
| Panorama rendering  | 60fps  | On integrated graphics      |
| Hotspot ray-casting | <5ms   | Per frame                   |
| Node switching      | <200ms | Transition duration         |
| Export time         | <30s   | For 50-node project         |
| Memory usage        | <500MB | Editor with 50 nodes loaded |
| Web bundle size     | <50MB  | Typical project export      |

---

## 10. Success Metrics

### 10.1 MVP Success Criteria

- ✅ Create project with 10+ nodes
- ✅ Draw and connect 50+ hotspots
- ✅ Export playable web game under 50MB
- ✅ Navigate smoothly (60fps) on mid-range hardware
- ✅ Build 1 complete interactive puzzle using scaffolding

### 10.2 User Experience Goals

- **Onboarding**: New user creates first interactive scene in <5 minutes
- **Development**: Developer builds complete game in 1-2 weeks
- **Compatibility**: Exported games work on 95%+ of modern browsers
- **Stability**: No crashes during normal workflow (save often works)

### 10.3 Technical Goals

- **Code Quality**: TypeScript strict mode, <5 ESLint errors
- **Test Coverage**: >70% for core utilities (panorama, hotspot, export)
- **Documentation**: All public APIs documented
- **Build Time**: <30s for development build, <2min for production

---

## Appendix A: Naming Conventions

### Cubic Panorama Files

```
{prefix}_front.jpg
{prefix}_back.jpg
{prefix}_left.jpg
{prefix}_right.jpg
{prefix}_top.jpg
{prefix}_bottom.jpg
```

**Examples:**

- `forest_front.jpg`, `forest_back.jpg`, ...
- `library_front.jpg`, `library_back.jpg`, ...
- `room3_front.jpg`, `room3_back.jpg`, ...

### Node IDs

- Format: UUID v4
- Example: `550e8400-e29b-41d4-a716-446655440000`
- Generated automatically on node creation

### Asset Paths

- Always relative to project root
- Panoramas: `assets/panoramas/{nodeId}.jpg` or `{nodeId}_front.jpg`
- Thumbnails: `assets/thumbnails/{nodeId}.jpg`
- Audio: `assets/audio/{filename}.mp3`
- Images: `assets/images/{filename}.png`

---

## Appendix B: Open Questions & Future Considerations

### Resolved Design Decisions

1. ✅ **Cubic mapping upload**: Batch upload with naming convention
2. ✅ **Hotspot vertex limit**: 20 vertices max
3. ✅ **Runtime styling**: Fullscreen, opinionated design
4. ✅ **Spatial audio**: Nice-to-have, Web Audio API
5. ✅ **Scripting**: Via interactive nodes (React components)
6. ✅ **Localization**: Not in MVP

### Future Enhancements

1. **Asset Library UI** (Phase 7)
   - Centralized management
   - Drag-and-drop assignment
   - Unused asset detection

2. **Advanced Conditions** (Phase 7)
   - Variable comparisons
   - Inventory requirements
   - Visited node checks

3. **Spatial Audio** (Phase 7+)
   - 3D positional audio
   - Distance attenuation
   - Audio zones

4. **VR Export** (Future)
   - WebXR support
   - Optimizations for VR rendering
   - VR interaction patterns

5. **Multiplayer** (Future)
   - Shared state across clients
   - Real-time sync
   - Server infrastructure

---

## Document History

| Version | Date        | Changes       | Author |
| ------- | ----------- | ------------- | ------ |
| 1.0     | Nov 5, 2025 | Initial draft | -      |

---

**End of Document**
