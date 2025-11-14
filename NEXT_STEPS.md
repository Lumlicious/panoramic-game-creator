# Next Steps - Linear Implementation Order

**Date**: 2025-11-13
**Current Status**: Phases 1-6 complete! ✅ Full node graph visualization with React Flow working. Ready for Phase 7 (Project Files & Robustness).

---

## The Core Issue

The app started importing images and saving to the root directory because it had **no project context**. We need:

1. **Project lifecycle FIRST** - New/Open project
2. **Save functionality** - Already mostly done, just wire it up
3. **Node management** - Add/edit/delete nodes with proper paths

---

## What's Already Done

✅ IPC handlers exist (`src/main/ipc/projectHandlers.ts`):
- `project:new` - Creates .pgc directory + initial project.json
- `project:save` - Saves project.json
- `project:open` - Loads project.json

✅ Types defined in `src/renderer/src/types/`

✅ Panorama viewer works

✅ Hotspot drawing works

❌ **Missing**: UI to call these IPC handlers and manage project state

---

## Linear Implementation Steps

### ✅ Step 1: Project Store Enhancements (COMPLETE - 2025-11-08)

**File**: `src/renderer/src/stores/projectStore.ts`

**Status**: Already implemented! The store has:
- ✅ `projectPath`, `projectId`, `projectName`, `created`, `modified`, `settings` state
- ✅ `newProject()` - Calls window.projectAPI.newProject(), initializes store (lines 324-355)
- ✅ `openProject()` - Calls window.projectAPI.openProject(), loads data (lines 357-387)
- ✅ `saveProject()` - Calls window.projectAPI.saveProject(), updates modified timestamp (lines 389-431)
- ✅ `closeProject()` - Resets store to initial state (lines 433-436)
- ✅ Node operations already check `projectPath` before file operations (lines 126-132, 196-200)

**Note**: The `isDirty` flag also already exists in editorStore (line 27).

No changes needed for this step.

---

### ✅ Step 2: Welcome Screen (Entry Point) (COMPLETE - 2025-11-08)

**File**: `src/renderer/src/components/WelcomeScreen.tsx` (NEW)

**Status**: Fully implemented with:
- ✅ Full-screen centered layout with app title and tagline
- ✅ Two clickable Card components (New Project, Open Project)
- ✅ Integration with `useProjectStore` hooks
- ✅ Async handlers with error logging
- ✅ Follows shadcn/ui and Tailwind patterns

**Notes**:
- Recent Projects section deferred (requires electron-store setup)
- Error notifications show in console only (toast notifications to be added later)

---

### ✅ Step 3: App Entry Logic (COMPLETE - 2025-11-08)

**File**: `src/renderer/src/App.tsx`

**Status**: Fully implemented with conditional rendering:
- ✅ Shows `<WelcomeScreen />` when `projectPath` is null
- ✅ Shows `<AppLayout />` when project is loaded
- ✅ Automatic state-driven navigation based on projectStore

**Implementation**:
```typescript
function App() {
  const projectPath = useProjectStore(state => state.projectPath)

  if (!projectPath) {
    return <WelcomeScreen />
  }

  return <AppLayout />
}
```

---

### ✅ Step 4: Toolbar Updates (COMPLETE - 2025-11-08)

**File**: `src/renderer/src/components/layout/Toolbar.tsx`

**Status**: Fully implemented with:
- ✅ ProjectStore integration (newProject, openProject, saveProject)
- ✅ Real file operation handlers replacing stubs
- ✅ Unsaved changes AlertDialog with 3 options (Save, Don't Save, Cancel)
- ✅ Keyboard shortcuts (Cmd/Ctrl+S, N, O) with platform detection
- ✅ Project name display from store (replaces "Untitled Project")
- ✅ Dirty indicator (*) shows after project name when unsaved changes exist
- ✅ All handlers use `useCallback` with proper dependencies
- ✅ Type-safe throughout, production-ready

**Additional Fix** (2025-11-08):
- Fixed Open Project on macOS: Added `treatPackageAsDirectory` to dialog properties
- File: `src/main/ipc/projectHandlers.ts` line 198

**UI Implemented**:
```
┌─────────────────────────────────────────────┐
│ [New] [Open] [Save]  MyProject.pgc *  [View]│
└─────────────────────────────────────────────┘
          ↑ Shows * when unsaved changes
```

**Future Enhancements** (optional, not blocking):
- Toast notifications for errors (currently console only)
- Concurrent save protection (loading states)
- Extract keyboard shortcuts to reusable hook

---

### ✅ Step 5: Add Node Dialog with Thumbnails (COMPLETE - 2025-11-08)

**File**: `src/renderer/src/components/layout/NodeListPanel.tsx`

**Status**: Fully implemented with:
- ✅ AddNodeDialog component with name input and panorama type selector
- ✅ Integration with `projectStore.createNodeWithPanorama()`
- ✅ Automatic face detection for cubic panoramas from filenames
- ✅ Thumbnail display in node list (200x100px)
- ✅ Loading states during import process
- ✅ Error handling with console logging
- ✅ Dirty flag integration (`setDirty(true)` on node creation)
- ✅ Auto-selection of newly created nodes

**Implementation Highlights**:
- Cubic panorama faces auto-detected from filenames (front, back, left, right, top, bottom)
- Thumbnails generated from front face for cubic panoramas
- Custom `local://` protocol handler for serving images in Electron
- CSP updated to allow `local:` protocol
- Runtime path resolution from relative to absolute URLs

---

### ✅ Step 6: Panorama Viewer Integration (COMPLETE - 2025-11-08)

**File**: `src/renderer/src/components/layout/AppLayout.tsx`

**Status**: Fully implemented with:
- ✅ Runtime path resolution using `getPanoramaUrl()`
- ✅ Support for both equirectangular and cubic panoramas
- ✅ Memoized panorama data with useMemo
- ✅ Automatic display when node is selected

**Implementation**:
- Resolves relative paths from store to absolute `local://` URLs
- Handles both panorama types correctly
- Three.js TextureLoader successfully loads images via custom protocol

---

### ✅ Step 7: Electron Protocol Handler (COMPLETE - 2025-11-08)

**File**: `src/main/index.ts`

**Status**: Custom protocol registered for local file access:
- ✅ `local://` protocol handler using `protocol.handle()`
- ✅ MIME type detection (JPG, PNG, WebP, GIF)
- ✅ Error handling for missing files
- ✅ Proper Response object with headers

**File**: `src/renderer/index.html`
- ✅ CSP updated: `img-src 'self' data: blob: local:`

**File**: `src/renderer/src/lib/imageImport.ts`
- ✅ `getPanoramaUrl()` and `getThumbnailUrl()` return `local://` URLs
- ✅ Cubic face detection from filenames
- ✅ Thumbnail generated from front face

---

### Step 8: Node Management (With Project Context)

**File**: `src/renderer/src/stores/projectStore.ts`

**Update addNode to use projectPath**:

```typescript
addNode: async (name: string, panoramaType: 'equirectangular' | 'cubic') => {
  // 1. Check project is open
  if (!projectStore.projectPath) {
    throw new Error('No project open')
  }

  // 2. File picker
  const result = await window.fileAPI.pickImage()
  if (!result.success) return null

  // 3. Validate
  const validation = await window.fileAPI.validateEquirectangular(result.data.filePath)
  if (!validation.data.valid) {
    throw new Error(validation.data.error)
  }

  // 4. Generate node ID
  const nodeId = uuid()

  // 5. Copy to project directory
  await window.fileAPI.copyToProject(
    result.data.filePath,
    projectStore.projectPath,
    `assets/panoramas/${nodeId}.jpg`
  )

  // 6. Generate thumbnail
  await window.fileAPI.generateThumbnail(
    result.data.filePath,
    join(projectStore.projectPath, `assets/thumbnails/${nodeId}.jpg`)
  )

  // 7. Add to store
  const node = {
    id: nodeId,
    name,
    panorama: {
      type: panoramaType,
      filePath: `assets/panoramas/${nodeId}.jpg`,  // RELATIVE
      thumbnailPath: `assets/thumbnails/${nodeId}.jpg`,  // RELATIVE
      metadata: validation.data.metadata
    },
    hotspots: [],
    position: { x: 0, y: 0 }
  }

  set(state => ({
    nodes: [...state.nodes, node]
  }))

  // 8. Mark dirty
  editorStore.setDirty(true)

  return node
}
```

---

### Step 8: Properties Panel Cleanup (NEXT)

**File**: `src/renderer/src/components/layout/PropertiesPanel.tsx`

**Remove**:
- All IPC test code (lines 24-100)
- TestCubicLoader import and usage

**Add**:
- Node name input (editable)
- Panorama info (read-only)
- Hotspots list
- "Set as Start Node" checkbox

---

### Step 9: Delete Test Components

**Remove**:
- `src/renderer/src/components/test/` directory
- `src/renderer/src/components/TestCubicLoader.tsx`

---

### Step 10: Unsaved Changes Dialog

**File**: `src/renderer/src/components/UnsavedChangesDialog.tsx` (NEW)

**Logic**:
- Show when user tries to:
  - Close window (handle beforeunload)
  - New Project (when dirty)
  - Open Project (when dirty)

**Buttons**: [Save] [Don't Save] [Cancel]

---

## Implementation Order Summary

```
1. Update projectStore (newProject, openProject, saveProject actions)
2. Create WelcomeScreen component
3. Update App.tsx (show WelcomeScreen if no project)
4. Update Toolbar (Save button, project name, dirty indicator)
5. Add dirty flag to editorStore
6. Update addNode to use projectPath
7. Update NodeListPanel (Add Node button)
8. Clean PropertiesPanel (remove test code)
9. Delete test components
10. Add unsaved changes dialog
```

---

## Testing Checklist

**Phase 5 Complete - All Tests Passing** ✅

- [✅] App starts with WelcomeScreen
- [✅] Click "New Project" → Creates .pgc directory with structure
- [✅] project.json created with empty nodes array
- [✅] App transitions to editor
- [✅] Toolbar shows project name
- [✅] Click "Add Node" → File picker opens
- [✅] Select image(s) → Validates, copies to assets/panoramas/, generates thumbnail
- [✅] Node appears in list with thumbnail
- [✅] Click node → Loads in panorama viewer
- [✅] Equirectangular panoramas display correctly
- [✅] Cubic panoramas display correctly with auto-detected faces
- [✅] Thumbnails use front face for cubic panoramas
- [✅] Draw hotspot → Works (already implemented)
- [✅] Dirty indicator (*) appears after node creation
- [✅] Click "Save" → project.json updated with nodes + hotspots
- [✅] Dirty indicator clears after save
- [✅] Close and reopen → All data persists

---

## Key Principles

1. **projectPath must exist** before any file operations
2. **Always use relative paths** in project.json
3. **Resolve to absolute** at runtime for file access
4. **Mark dirty on any change** so user doesn't lose work
5. **Test manually** after each step

---

## Phase 5 Complete! 🎉

---

## ✅ Phase 5.5: Properties Panel Polish & Hotspot Target Assignment (COMPLETE - 2025-11-09)

**Status**: ✅ COMPLETE
**Priority**: CRITICAL - Phase 6 (Node Graph) now has meaningful connections
**Time Taken**: ~3 hours
**Commit**: eac169a

### What Was Implemented

**All 5 tasks completed successfully:**

#### ✅ Task 1: Install Missing Components (5 min)
```bash
npx shadcn@latest add select checkbox
```

- ✅ Select and Checkbox components installed
- ✅ Added to `src/renderer/src/components/ui/`

#### ✅ Task 2: Clean Up PropertiesPanel (15 min)
- ✅ Removed all IPC test code (lines 24-104)
- ✅ Removed TestCubicLoader import and usage
- ✅ Added conditional rendering for node/hotspot/none states
- ✅ Panel now updates dynamically based on selection

- ✅ **Editable hotspot name** with Input component (blur/Enter to save)
- ✅ **Target Node Dropdown** - THE CRITICAL FEATURE!
  - Shows all nodes except self (prevents circular links)
  - Updates `targetNodeId` in store
  - "No target" option to clear assignment
- ✅ Polygon info display (vertices, enabled state)
- ✅ Delete hotspot button with Trash icon

#### ✅ Task 4: Enhance Node Properties Card (30 min)
- ✅ **Editable node name** with Input component
- ✅ **"Set as Start Node" Checkbox** - marks game entry point
- ✅ Panorama type display (equirectangular/cubic)
- ✅ **Interactive hotspots list**:
  - Shows all hotspots with names
  - Shows target node for each hotspot ("→ Node Name")
  - Click to select hotspot in viewer
  - Highlights currently selected hotspot

#### ✅ Task 5: Wire Up Delete Handler (10 min)
- ✅ Delete button calls `removeHotspot()` from projectStore
- ✅ Clears selection after deletion
- ✅ Sets dirty flag
- ✅ Works alongside existing keyboard shortcut (Delete/Backspace)

### Bonus Fixes
- ✅ Fixed pre-existing TypeScript error in HotspotDrawing.tsx (line geometry)
- ✅ All type checks passing

---

## 🎉 Phase 5.5 Complete - Ready for Phase 6!

**Achievements:**
- ✅ Users can now create fully navigable panoramic games
- ✅ Hotspots can be linked to target nodes (MVP requirement met!)
- ✅ Phase 6 will show meaningful connections (edges between nodes)
- ✅ Complete CRUD operations for nodes and hotspots
- ✅ Type-safe implementation with all checks passing

---

## ✅ Phase 6: Node Graph Visualization (COMPLETE - 2025-11-13)

**Status**: ✅ COMPLETE
**Time Taken**: ~6 hours
**Commit**: d697fed

### What Was Implemented

**All core features successfully delivered:**

#### ✅ React Flow Integration
- Full interactive graph canvas with pan/zoom controls
- Custom node cards with thumbnails and metadata
- Smooth bezier edge connections (right handle → left handle)
- Minimap with color-coded nodes

#### ✅ Visual Features
- **Node Cards**: Display thumbnails, names, connection counts (in/out)
- **Start Node Badge**: Green border indicator for game entry point
- **Orphaned Nodes Badge**: Orange badge for nodes with no incoming connections
- **Edge Styling**: Animated green edges from start node, gray for others
- **Empty State**: User-friendly message when no nodes exist

#### ✅ Interaction & Sync
- Drag-and-drop node positioning with automatic persistence
- Click node in graph → switches to Editor view and selects node
- Graph view state management in editorStore
- Fit view button to center all nodes

#### ✅ Type-Safe Implementation
- New types: `GraphNode`, `GraphEdge` in `graph.ts`
- Graph converters: Transform project data to React Flow format
- Graph selectors: Derive edges from hotspot connections
- Graph utilities: Connection counting, orphan detection
- Graph validation: Ensure data integrity

#### ✅ New Dependencies
- `reactflow@11.11.4` - Graph visualization library
- `react-use@17.5.1` - Hooks including useDebounce

### Files Created
- `src/renderer/src/components/graph/GraphView.tsx`
- `src/renderer/src/components/graph/CustomNodeCard.tsx`
- `src/renderer/src/lib/graphConverters.ts`
- `src/renderer/src/lib/graphSelectors.ts`
- `src/renderer/src/lib/graphUtils.ts`
- `src/renderer/src/lib/graphValidation.ts`
- `src/renderer/src/types/graph.ts`
- shadcn/ui components: badge, toast, toaster

---

## 🎯 Phase 7: Project Files & Robustness (NEXT)

**Status**: Ready to begin
**Priority**: CRITICAL - Production readiness
**Estimated Time**: 8-10 hours
**Dependencies**: All core features complete

### Overview

From `plan.md Phase 7`, we need to implement:

1. **Enhanced Error Handling**
   - Comprehensive error handling for all file operations
   - User-friendly error messages with recovery options
   - Graceful degradation for non-critical errors

2. **Project Validation on Load**
   - Check format version compatibility
   - Verify all referenced images exist
   - Show warnings for missing files but allow opening
   - Detect and report project corruption

3. **Auto-Save System**
   - Auto-save with configurable interval
   - Dirty state tracking (already exists)
   - Visual feedback during save operations
   - Prevent data loss on crashes

4. **Recent Projects List**
   - Track recently opened projects (electron-store)
   - Show in welcome screen
   - File watching to detect external changes
   - Remove deleted projects from list

5. **Game Export**
   - Export as standalone HTML bundle
   - Package all assets and player runtime
   - Optimize for web delivery
   - Test exported games

### Implementation Tasks

See `plan.md Phase 7` for detailed step-by-step implementation.

### Key Challenges

- **File validation**: Need to check all panorama/thumbnail paths on load
- **Auto-save**: Must handle concurrent saves and prevent corruption
- **Export**: Need to create minimal player runtime (subset of editor)
- **Error recovery**: Emergency save to Documents folder on crash

---
