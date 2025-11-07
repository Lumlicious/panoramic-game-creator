# Project Data Structure & Lifecycle

**Date**: 2025-11-06

## Overview

This document defines the exact structure of `project.json`, when it's created, when it's updated, and how the runtime consumes it.

---

## File Structure

```
MyProject.pgc/                          ← User-visible project bundle
├── project.json                        ← Complete project data (THIS FILE)
├── assets/
│   ├── panoramas/                      ← Original panorama images
│   │   ├── node-abc123.jpg            ← Filename = node ID
│   │   ├── node-def456.jpg
│   │   └── ...
│   └── thumbnails/                     ← Auto-generated thumbnails (200x100)
│       ├── node-abc123.jpg
│       └── node-def456.jpg
└── .pgc-meta/
    └── version.txt                     ← File format version (1.0.0)
```

---

## project.json Structure

### TypeScript Interface

```typescript
interface Project {
  projectId: string              // Unique project ID
  projectName: string            // Project name (from .pgc filename)
  version: string                // File format version (1.0.0)
  nodes: Node[]                  // All nodes in the project
  startNodeId: string | null     // ID of starting node (null if not set)
  settings: ProjectSettings      // Project-wide settings
  graphLayout?: GraphLayoutData  // Graph view layout (optional)
  metadata: {
    created: string              // ISO 8601 timestamp
    modified: string             // ISO 8601 timestamp
    author?: string              // Optional author name
  }
}

interface Node {
  id: string                     // Unique node ID (UUID)
  name: string                   // User-visible node name
  panorama: PanoramaData         // Panorama image data
  hotspots: Hotspot[]            // All hotspots on this node
  position: { x: number, y: number }  // Position in graph view
  metadata?: {
    description?: string         // Optional node description
    tags?: string[]              // Optional tags
  }
}

interface PanoramaData {
  type: 'equirectangular' | 'cubic'
  filePath?: string              // RELATIVE path: "assets/panoramas/node-abc123.jpg"
  thumbnailPath?: string         // RELATIVE path: "assets/thumbnails/node-abc123.jpg"
  metadata?: {
    width: number
    height: number
    format: string               // "jpeg", "png", "webp"
  }
  // For cubic (6 faces - future)
  faces?: {
    front: string, back: string, left: string,
    right: string, top: string, bottom: string
  }
}

interface Hotspot {
  id: string                     // Unique hotspot ID (UUID)
  name: string                   // User-visible hotspot name
  targetNodeId: string           // ID of node this hotspot links to
  polygon: SphericalPoint[]      // Polygon vertices in spherical coords
  style: HotspotStyle            // Visual styling
  enabled: boolean               // Can toggle hotspots on/off
  description?: string           // Optional tooltip text (future)
}

interface SphericalPoint {
  theta: number                  // Azimuthal angle [-π, π]
  phi: number                    // Polar angle [0, π]
}

interface HotspotStyle {
  fillColor: string              // Hex color: "#FF0000"
  strokeColor: string            // Hex color: "#000000"
  strokeWidth: number            // Pixels
  opacity: number                // 0.0 - 1.0
  hoverFillColor?: string        // Hover state color
}

interface ProjectSettings {
  defaultFOV: number             // Camera FOV (default: 75)
  hotspotDefaultColor: string    // Default hotspot fill color
  hotspotHoverColor: string      // Default hotspot hover color
}

interface GraphLayoutData {
  nodePositions: Record<string, { x: number, y: number }>
  zoom: number
  viewportX: number
  viewportY: number
}
```

---

## Example: Empty Project (After "New Project")

This is what gets created when user clicks "New Project":

```json
{
  "projectId": "proj-1730932800000-abc123",
  "projectName": "My Adventure",
  "version": "1.0.0",
  "nodes": [],
  "startNodeId": null,
  "settings": {
    "defaultFOV": 75,
    "hotspotDefaultColor": "#3b82f6",
    "hotspotHoverColor": "#60a5fa"
  },
  "metadata": {
    "created": "2025-11-06T10:00:00.000Z",
    "modified": "2025-11-06T10:00:00.000Z"
  }
}
```

**File location**: `MyAdventure.pgc/project.json`

---

## Example: Project with 2 Nodes and Hotspots

This is what gets saved after user adds nodes and draws hotspots:

```json
{
  "projectId": "proj-1730932800000-abc123",
  "projectName": "My Adventure",
  "version": "1.0.0",
  "nodes": [
    {
      "id": "node-550e8400-e29b-41d4-a716-446655440000",
      "name": "Forest Entrance",
      "panorama": {
        "type": "equirectangular",
        "filePath": "assets/panoramas/node-550e8400-e29b-41d4-a716-446655440000.jpg",
        "thumbnailPath": "assets/thumbnails/node-550e8400-e29b-41d4-a716-446655440000.jpg",
        "metadata": {
          "width": 4096,
          "height": 2048,
          "format": "jpeg"
        }
      },
      "hotspots": [
        {
          "id": "hotspot-123abc",
          "name": "Path to Clearing",
          "targetNodeId": "node-660e8400-e29b-41d4-a716-446655440001",
          "polygon": [
            { "theta": 0.5, "phi": 1.4 },
            { "theta": 0.7, "phi": 1.4 },
            { "theta": 0.7, "phi": 1.8 },
            { "theta": 0.5, "phi": 1.8 }
          ],
          "style": {
            "fillColor": "#3b82f6",
            "strokeColor": "#1e40af",
            "strokeWidth": 2,
            "opacity": 0.5,
            "hoverFillColor": "#60a5fa"
          },
          "enabled": true
        }
      ],
      "position": { "x": 100, "y": 200 },
      "metadata": {
        "description": "Starting point of the adventure"
      }
    },
    {
      "id": "node-660e8400-e29b-41d4-a716-446655440001",
      "name": "Forest Clearing",
      "panorama": {
        "type": "equirectangular",
        "filePath": "assets/panoramas/node-660e8400-e29b-41d4-a716-446655440001.jpg",
        "thumbnailPath": "assets/thumbnails/node-660e8400-e29b-41d4-a716-446655440001.jpg",
        "metadata": {
          "width": 4096,
          "height": 2048,
          "format": "jpeg"
        }
      },
      "hotspots": [],
      "position": { "x": 400, "y": 200 }
    }
  ],
  "startNodeId": "node-550e8400-e29b-41d4-a716-446655440000",
  "settings": {
    "defaultFOV": 75,
    "hotspotDefaultColor": "#3b82f6",
    "hotspotHoverColor": "#60a5fa"
  },
  "graphLayout": {
    "nodePositions": {
      "node-550e8400-e29b-41d4-a716-446655440000": { "x": 100, "y": 200 },
      "node-660e8400-e29b-41d4-a716-446655440001": { "x": 400, "y": 200 }
    },
    "zoom": 1.0,
    "viewportX": 0,
    "viewportY": 0
  },
  "metadata": {
    "created": "2025-11-06T10:00:00.000Z",
    "modified": "2025-11-06T11:30:00.000Z"
  }
}
```

---

## Lifecycle: When is project.json Created/Updated?

### 1. New Project (Initial Creation)

**Trigger**: User clicks "New Project"

**What happens** (already implemented in `projectHandlers.ts`):

```typescript
// 1. Show dialog to choose location/name
const result = await dialog.showSaveDialog({...})

// 2. Create directory structure
MyAdventure.pgc/
├── project.json          ← Created with EMPTY nodes array
├── assets/
│   ├── panoramas/        ← Empty folder
│   └── thumbnails/       ← Empty folder
└── .pgc-meta/
    └── version.txt

// 3. Write initial project.json
{
  "projectId": "proj-...",
  "projectName": "My Adventure",
  "version": "1.0.0",
  "nodes": [],              ← EMPTY
  "startNodeId": null,
  "settings": { defaults },
  "metadata": { created, modified }
}
```

**Result**: Empty project ready to add nodes

---

### 2. Save Project (Update)

**Trigger**: User clicks "Save" or Cmd/Ctrl+S

**What happens**:

```typescript
// 1. Gather all current state from projectStore
const projectData = {
  projectId: projectStore.projectId,
  projectName: projectStore.projectName,
  version: '1.0.0',
  nodes: projectStore.nodes,              ← All nodes with panoramas + hotspots
  startNodeId: projectStore.startNodeId,
  settings: projectStore.settings,
  graphLayout: projectStore.graphLayout,
  metadata: {
    created: projectStore.created,
    modified: new Date().toISOString()    ← Update timestamp
  }
}

// 2. Call IPC to write to disk
await window.projectAPI.saveProject(projectPath, projectData)

// 3. Main process writes to project.json
await writeFile(
  join(projectPath, 'project.json'),
  JSON.stringify(projectData, null, 2),
  'utf-8'
)
```

**Result**: project.json updated with all current state

---

### 3. Open Project (Load)

**Trigger**: User clicks "Open Project"

**What happens**:

```typescript
// 1. Show dialog to select .pgc directory
const result = await dialog.showOpenDialog({...})

// 2. Read project.json from disk
const projectData = JSON.parse(
  await readFile(join(projectPath, 'project.json'), 'utf-8')
)

// 3. Load into projectStore
projectStore.loadProject({
  ...projectData,
  projectPath: absolutePath  ← Add runtime-only field
})

// 4. Resolve relative paths for texture loading
projectStore.nodes.forEach(node => {
  const absoluteImagePath = join(projectPath, node.panorama.filePath)
  // Load texture from absoluteImagePath
})
```

**Result**: Project loaded into memory, ready to edit

---

## Critical: Relative vs Absolute Paths

### In project.json (Stored)
```json
{
  "filePath": "assets/panoramas/node-abc123.jpg",
  "thumbnailPath": "assets/thumbnails/node-abc123.jpg"
}
```
👆 **ALWAYS RELATIVE** - Makes project portable

### At Runtime (Resolved)
```typescript
// When loading textures:
const absolutePath = join(projectPath, node.panorama.filePath)
// Result: "/Users/me/MyProject.pgc/assets/panoramas/node-abc123.jpg"

// Load texture
const texture = textureLoader.load(absolutePath)
```
👆 **RESOLVE TO ABSOLUTE** - For file system access

---

## How Runtime Consumes project.json

### Editor Runtime (This App)

```typescript
// 1. User opens project
const result = await window.projectAPI.openProject()

// 2. Load into Zustand store
projectStore.loadProject(result.data)

// 3. When rendering a node:
const node = projectStore.getNode(selectedNodeId)
const absolutePath = join(projectStore.projectPath, node.panorama.filePath)

// 4. Load texture in Three.js
const texture = new THREE.TextureLoader().load(absolutePath)

// 5. Render hotspots
node.hotspots.forEach(hotspot => {
  // Convert spherical coords to 3D mesh
  const mesh = createHotspotMesh(hotspot.polygon)
  scene.add(mesh)
})
```

### Game Player Runtime (Future - Phase 8)

```typescript
// 1. Load project.json from exported bundle
const project = await fetch('./project.json').then(r => r.json())

// 2. Start from startNodeId
let currentNodeId = project.startNodeId

// 3. Render current node
const currentNode = project.nodes.find(n => n.id === currentNodeId)
const texture = new THREE.TextureLoader().load(currentNode.panorama.filePath)

// 4. Render clickable hotspots
currentNode.hotspots.forEach(hotspot => {
  // On click: navigate to hotspot.targetNodeId
  hotspot.onClick = () => {
    currentNodeId = hotspot.targetNodeId
    renderNode(currentNodeId)
  }
})
```

---

## When Does project.json Get Updated?

| Action | project.json Updated? | When? |
|--------|----------------------|-------|
| New Project | ✅ Yes | Immediately (empty project) |
| Add Node | ❌ No | Only when user saves |
| Delete Node | ❌ No | Only when user saves |
| Edit Node Name | ❌ No | Only when user saves |
| Draw Hotspot | ❌ No | Only when user saves |
| Edit Hotspot | ❌ No | Only when user saves |
| Delete Hotspot | ❌ No | Only when user saves |
| **Save Project** | ✅ Yes | Immediately |
| Open Project | ❌ No (reads only) | N/A |

**Key Point**: All changes happen in memory (Zustand store). Only when user explicitly saves does project.json get updated.

---

## Validation Requirements

### On New Project
- ✅ .pgc extension enforced
- ✅ Directory structure created
- ✅ Initial project.json written
- ✅ Version file created

### On Save Project
- ✅ projectPath must exist
- ✅ nodes must be valid array
- ✅ All filePath values must be relative
- ✅ modified timestamp updated

### On Open Project
- ✅ .pgc extension required
- ✅ project.json must exist
- ✅ JSON must be valid
- ✅ Required fields must exist (projectId, projectName, nodes)
- ⚠️ Missing image files: Show warning but allow opening

---

## Project Settings Defaults

When creating new project, use these defaults:

```typescript
const DEFAULT_SETTINGS: ProjectSettings = {
  defaultFOV: 75,
  hotspotDefaultColor: '#3b82f6',  // Blue 500
  hotspotHoverColor: '#60a5fa'      // Blue 400
}
```

---

## Summary

1. **New Project**: Creates `.pgc` directory + initial `project.json` with empty nodes array
2. **Work**: All changes in memory (Zustand store)
3. **Save**: Writes entire state to `project.json` (all nodes, hotspots, settings)
4. **Open**: Reads `project.json`, loads into memory, resolves paths at runtime
5. **Paths**: Always relative in JSON, resolved to absolute at runtime

**The save functionality is already implemented in projectHandlers.ts** - we just need to wire it up to the UI and call it when user clicks Save!
