import { useEditorStore } from '@/stores/editorStore'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileIcon, FolderOpenIcon, SaveIcon, PlusIcon, PenToolIcon } from 'lucide-react'

/**
 * Toolbar Component
 *
 * Top toolbar with:
 * - File operations (New, Open, Save)
 * - View mode toggle (Editor / Graph)
 */

export function Toolbar() {
  const { viewMode, setViewMode, isDirty, drawingMode, setDrawingMode } = useEditorStore()

  const handleNew = () => {
    // TODO: Phase 7 - New project logic
    console.log('New project')
  }

  const handleOpen = () => {
    // TODO: Phase 7 - Open project logic
    console.log('Open project')
  }

  const handleSave = () => {
    // TODO: Phase 7 - Save project logic
    console.log('Save project')
  }

  const handleToggleDrawing = () => {
    if (drawingMode === 'drawing') {
      setDrawingMode('select')
    } else {
      setDrawingMode('drawing')
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Left Section - File Operations */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleNew}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New
        </Button>
        <Button variant="ghost" size="sm" onClick={handleOpen}>
          <FolderOpenIcon className="mr-2 h-4 w-4" />
          Open
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSave} disabled={!isDirty}>
          <SaveIcon className="mr-2 h-4 w-4" />
          Save
        </Button>

        {/* Separator */}
        <div className="mx-2 h-6 w-px bg-border" />

        {/* Drawing Mode Toggle */}
        <Button
          variant={drawingMode === 'drawing' ? 'default' : 'ghost'}
          size="sm"
          onClick={handleToggleDrawing}
        >
          <PenToolIcon className="mr-2 h-4 w-4" />
          {drawingMode === 'drawing' ? 'Drawing...' : 'Draw Hotspot'}
        </Button>

        {/* Dirty indicator */}
        {isDirty && (
          <span className="ml-2 text-xs text-muted-foreground">• Unsaved changes</span>
        )}
      </div>

      {/* Center Section - View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'editor' | 'graph')}>
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Right Section - Project Info (placeholder) */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          <FileIcon className="inline h-4 w-4" /> Untitled Project
        </span>
      </div>
    </header>
  )
}
