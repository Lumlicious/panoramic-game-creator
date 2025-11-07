# Next Steps - Linear Implementation Order

**Date**: 2025-11-06
**Current Status**: Phases 1-4 complete, Phase 5 partially done

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

### Step 1: Project Store Enhancements

**File**: `src/renderer/src/stores/projectStore.ts`

**Add**:
```typescript
// Project lifecycle state
projectPath: string | null        // Absolute path to .pgc directory
projectId: string | null
projectName: string | null
created: string | null
modified: string | null
settings: ProjectSettings

// Actions
newProject: async () => Promise<boolean>
openProject: async () => Promise<boolean>
saveProject: async () => Promise<boolean>
closeProject: () => void
```

**Implementation**:
- Call window.projectAPI.newProject() - creates directory + initial JSON
- Call window.projectAPI.openProject() - loads existing JSON
- Call window.projectAPI.saveProject() - saves current state

---

### Step 2: Welcome Screen (Entry Point)

**File**: `src/renderer/src/components/WelcomeScreen.tsx` (NEW)

**UI**:
```
┌──────────────────────────────┐
│  Panoramic Game Creator      │
│                               │
│  [New Project]                │
│  [Open Project]               │
│                               │
│  Recent Projects:             │
│  - MyGame.pgc                 │
│  - Adventure.pgc              │
└──────────────────────────────┘
```

**Logic**:
```typescript
const handleNewProject = async () => {
  const success = await projectStore.newProject()
  if (success) {
    // App automatically transitions to editor
  }
}

const handleOpenProject = async () => {
  const success = await projectStore.openProject()
  if (success) {
    // App automatically transitions to editor
  }
}
```

---

### Step 3: App Entry Logic

**File**: `src/renderer/src/App.tsx`

**Update**:
```typescript
function App() {
  const projectPath = useProjectStore(state => state.projectPath)

  // No project open - show welcome screen
  if (!projectPath) {
    return <WelcomeScreen />
  }

  // Project open - show editor
  return <AppLayout />
}
```

---

### Step 4: Toolbar Updates

**File**: `src/renderer/src/components/layout/Toolbar.tsx`

**Add**:
- Project name display
- Save button (Cmd/Ctrl+S)
- Dirty indicator (*)
- New Project button (with unsaved changes check)
- Open Project button (with unsaved changes check)

**UI**:
```
┌─────────────────────────────────────────────┐
│ [New] [Open] [Save*]  MyProject.pgc  [View] │
└─────────────────────────────────────────────┘
          ↑ Shows * when unsaved changes
```

---

### Step 5: Dirty Flag Tracking

**File**: `src/renderer/src/stores/editorStore.ts`

**Add**:
```typescript
isDirty: boolean
setDirty: (dirty: boolean) => void
```

**Trigger dirty=true on**:
- Add node
- Delete node
- Edit node name
- Draw hotspot
- Edit hotspot
- Delete hotspot
- Change settings

**Clear dirty on**:
- Save project

---

### Step 6: Node Management (With Project Context)

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

### Step 7: Node List Panel Updates

**File**: `src/renderer/src/components/layout/NodeListPanel.tsx`

**Add**:
- "Add Node" button → Calls projectStore.addNode()
- Display thumbnails (resolve relative path to absolute)
- Delete button with confirmation

**Thumbnail loading**:
```typescript
const thumbnailPath = join(projectStore.projectPath, node.panorama.thumbnailPath)
<img src={thumbnailPath} alt={node.name} />
```

---

### Step 8: Properties Panel Cleanup

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

After each step, manually test:

- [ ] App starts with WelcomeScreen
- [ ] Click "New Project" → Creates .pgc directory with structure
- [ ] project.json created with empty nodes array
- [ ] App transitions to editor
- [ ] Toolbar shows project name
- [ ] Click "Add Node" → File picker opens
- [ ] Select image → Validates, copies to assets/panoramas/, generates thumbnail
- [ ] Node appears in list with thumbnail
- [ ] Click node → Loads in panorama viewer
- [ ] Draw hotspot → Works (already implemented)
- [ ] Dirty indicator (*) appears
- [ ] Click "Save" → project.json updated with nodes + hotspots
- [ ] Dirty indicator clears
- [ ] Close and reopen → All data persists

---

## Key Principles

1. **projectPath must exist** before any file operations
2. **Always use relative paths** in project.json
3. **Resolve to absolute** at runtime for file access
4. **Mark dirty on any change** so user doesn't lose work
5. **Test manually** after each step

---

## After This Is Solid

Then we can:
- Add node graph visualization (Phase 6)
- Polish hotspot workflow
- Export game player (Phase 8)

But first: **Get the project lifecycle working end-to-end.**
