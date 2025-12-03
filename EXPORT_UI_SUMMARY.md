# Export UI Implementation Summary

## Phase 7 Step 5: Frontend Export Infrastructure

### Files Created

1. **`src/renderer/src/components/dialogs/ExportDialog.tsx`**
   - Complete export dialog component with full state management
   - 260 lines of TypeScript React code

### Files Modified

1. **`src/renderer/src/components/layout/Toolbar.tsx`**
   - Added Export button next to Save button
   - Added ExportDialog state management
   - Disabled when no project or no nodes

2. **`src/preload/index.ts`**
   - Added `exportAPI` to IPC bridge
   - Exposes `chooseExportDestination()` and `exportProject()` to renderer

## Component Architecture

### ExportDialog Component

**Props:**
- `open: boolean` - Controls dialog visibility
- `onOpenChange: (open: boolean) => void` - Callback for state changes

**State Management:**
- `exportDestination: string` - Selected export folder path
- `exportState: 'idle' | 'exporting' | 'success' | 'error'` - Current export state
- `exportedPath: string` - Final exported game path
- `errorMessage: string` - Error details if export fails

**User Flow:**

```
1. User clicks "Export" button in toolbar
   ↓
2. ExportDialog opens (idle state)
   ↓
3. User clicks "Choose Folder" → Folder picker dialog
   ↓
4. Selected path displayed → Export button enabled
   ↓
5. User clicks "Export" → State changes to 'exporting'
   ↓
6a. SUCCESS: State → 'success', shows path and "Copy Path" button
6b. ERROR: State → 'error', shows error message and details
   ↓
7. User clicks "Close" → Dialog closes and resets
```

## UI States

### Idle State (Initial)
- Shows destination folder picker
- Export button disabled until destination selected
- Cancel and Export buttons visible

### Exporting State (In Progress)
- Shows progress spinner with status text
- Destination picker disabled
- Export button shows "Exporting..." with spinner

### Success State
- Green success banner with checkmark icon
- Displays exported path in monospace font
- "Copy Path" button to copy path to clipboard
- Only "Close" button visible

### Error State
- Red error banner with alert icon
- Displays error message from backend
- Only "Close" button visible

## Validation & Error Handling

### Pre-Export Validation
1. **No project loaded** → Export button disabled in toolbar
2. **No nodes in project** → Export button disabled in toolbar
3. **No destination selected** → Export button disabled in dialog
4. **No start node set** → Warning toast (allows export to continue)

### Error Cases Handled
- User cancels folder selection (no error shown)
- Export backend fails (shows error message in dialog)
- Permission errors (shown via backend error message)
- Build failures (shown via backend error message)

## Visual Design

### Styling Patterns
- Consistent with existing dialogs (AlertDialog, etc.)
- Uses shadcn/ui components (Dialog, Button, icons from lucide-react)
- Tailwind CSS for layout and spacing
- Dark mode support via CSS variables

### Accessibility
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels on all interactive elements
- Screen reader friendly state messages
- Focus management in dialog

### Icons Used
- `PackageIcon` - Export button and dialog title
- `FolderIcon` - Choose folder button
- `Loader2` - Export progress spinner (animated)
- `CheckCircle2Icon` - Success state
- `AlertCircleIcon` - Error state
- `CopyIcon` - Copy path button

## Integration Points

### Zustand Store
Reads from `useProjectStore`:
- `projectName` - Shown in dialog title
- `projectPath` - Required for export (source of assets)
- `nodes` - Used for validation (must have at least 1 node)
- `startNodeId` - Optional (warning if not set)
- All project data fields for export payload

### IPC API
Uses `window.exportAPI`:
- `chooseExportDestination()` - Opens folder picker, returns path
- `exportProject(options)` - Exports project, returns result

**Export Options Structure:**
```typescript
{
  projectPath: string      // Source .pgc directory
  exportPath: string       // Destination folder
  projectData: ProjectData // Complete project JSON
}
```

**Export Result Structure:**
```typescript
{
  exportPath: string // Full path to exported folder
  gameUrl: string    // Path to index.html (future use)
}
```

### Toast Notifications
- Success: "Export Successful" with path
- Error: "Export Failed" with error message
- Warning: "No Start Node" (allows continue)
- Info: "Path Copied" after copy action

## TypeScript Compilation

**Status:** ✅ All files compile successfully

**Type Safety:**
- All IPC API calls properly typed
- Store selectors type-checked
- Component props strictly typed
- Event handlers type-safe

## Key UX Decisions

### 1. Two-Step Process
**Decision:** Separate "Choose Folder" and "Export" actions
**Rationale:** Clear separation allows users to verify destination before exporting

### 2. State Persistence in Dialog
**Decision:** Reset state when dialog opens (not when it closes)
**Rationale:** Prevents stale state if user re-opens dialog after error

### 3. Copy Path vs. Open Folder
**Decision:** Provide "Copy Path" button instead of "Open Folder"
**Rationale:** Simpler implementation for MVP, avoids platform-specific shell APIs

### 4. Warning vs. Error for No Start Node
**Decision:** Show warning toast but allow export to proceed
**Rationale:** Valid use case - user may want to set start node in exported game.json manually

### 5. Export Button Placement
**Decision:** Place Export button next to Save in toolbar
**Rationale:** Export is a primary workflow action, deserves prominent placement

### 6. Disabled vs. Hidden
**Decision:** Show Export button as disabled when invalid, not hidden
**Rationale:** Discoverable even when disabled, prevents confusion

## Component Patterns Used

### 1. Controlled Dialog Pattern
```tsx
const [open, setOpen] = useState(false)
<Dialog open={open} onOpenChange={setOpen}>
```

### 2. State Machine Pattern
```tsx
type ExportState = 'idle' | 'exporting' | 'success' | 'error'
```

### 3. Async Action Handler Pattern
```tsx
const handleExport = useCallback(async () => {
  setExportState('exporting')
  try {
    const result = await window.exportAPI.exportProject(...)
    if (result.success) {
      setExportState('success')
    } else {
      setExportState('error')
    }
  } catch (error) {
    setExportState('error')
  }
}, [dependencies])
```

### 4. Conditional Rendering Pattern
```tsx
{exportState === 'idle' && <IdleStateUI />}
{exportState === 'exporting' && <ProgressUI />}
{exportState === 'success' && <SuccessUI />}
{exportState === 'error' && <ErrorUI />}
```

## Next Steps (Backend Integration)

The frontend is ready and waiting for:

1. **IPC Handler Implementation** (electron/main/)
   - `export:chooseDestination` - Opens folder picker dialog
   - `export:project` - Builds player, copies assets, writes files

2. **Vite Build Integration** (player/)
   - Build standalone player bundle
   - Copy to export destination
   - Generate index.html with embedded game data

3. **Asset Copy Pipeline**
   - Copy panorama images from .pgc/assets/panoramas/
   - Copy thumbnails (optional for player)
   - Maintain relative paths in game.json

4. **Error Handling**
   - Permission errors → user-friendly messages
   - Build errors → actionable feedback
   - Destination exists → confirm overwrite

## Testing Checklist

Once backend is implemented, test:

- [ ] Export with no project open (button disabled)
- [ ] Export with empty project (button disabled)
- [ ] Export with no start node (warning, but succeeds)
- [ ] Export to new folder (creates folder)
- [ ] Export to existing folder (backend should handle overwrite)
- [ ] Cancel folder selection (dialog stays open)
- [ ] Cancel during export (if supported by backend)
- [ ] Export success → copy path → verify clipboard
- [ ] Export error → verify error message displayed
- [ ] Close dialog after success (resets state)
- [ ] Close dialog after error (resets state)
- [ ] Re-open dialog (state is reset)

## File Paths

**Created:**
- `/Users/lumlicious/Projects/apps/panoramic-game-creator/src/renderer/src/components/dialogs/ExportDialog.tsx`

**Modified:**
- `/Users/lumlicious/Projects/apps/panoramic-game-creator/src/renderer/src/components/layout/Toolbar.tsx`
- `/Users/lumlicious/Projects/apps/panoramic-game-creator/src/preload/index.ts`

**Type Definitions (already existed):**
- `/Users/lumlicious/Projects/apps/panoramic-game-creator/src/shared/types/ipc.ts`
- `/Users/lumlicious/Projects/apps/panoramic-game-creator/src/preload/index.d.ts`

---

**Status:** ✅ Frontend export UI complete and type-safe
**Next:** Backend export infrastructure (IPC handlers + Vite build)
