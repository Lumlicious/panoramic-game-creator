import { useState, useCallback, useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FileIcon, FolderOpenIcon, SaveIcon, PlusIcon, PenToolIcon } from 'lucide-react'

/**
 * Toolbar Component
 *
 * Top toolbar with:
 * - File operations (New, Open, Save)
 * - View mode toggle (Editor / Graph)
 */

export function Toolbar() {
  const { viewMode, setViewMode, isDirty, setDirty, drawingMode, setDrawingMode } = useEditorStore()

  // Project store integration
  const { projectName, newProject, openProject, saveProject } = useProjectStore()

  // Unsaved changes dialog state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'new' | 'open' | null>(null)

  // File operation handlers
  const handleNew = useCallback(async () => {
    // Check for unsaved changes
    if (isDirty) {
      setPendingAction('new')
      setShowUnsavedDialog(true)
      return
    }

    // Proceed with new project
    try {
      const success = await newProject()
      if (success) {
        setDirty(false)
      }
    } catch (error) {
      console.error('Failed to create new project:', error)
    }
  }, [isDirty, newProject, setDirty])

  const handleOpen = useCallback(async () => {
    // Check for unsaved changes
    if (isDirty) {
      setPendingAction('open')
      setShowUnsavedDialog(true)
      return
    }

    // Proceed with open project
    try {
      const success = await openProject()
      if (success) {
        setDirty(false)
      }
    } catch (error) {
      console.error('Failed to open project:', error)
    }
  }, [isDirty, openProject, setDirty])

  const handleSave = useCallback(async () => {
    try {
      const success = await saveProject()
      if (success) {
        setDirty(false)
      }
    } catch (error) {
      console.error('Failed to save project:', error)
    }
  }, [saveProject, setDirty])

  // Execute pending action after handling unsaved changes
  const executePendingAction = useCallback(async () => {
    if (pendingAction === 'new') {
      try {
        const success = await newProject()
        if (success) {
          setDirty(false)
        }
      } catch (error) {
        console.error('Failed to create new project:', error)
      }
    } else if (pendingAction === 'open') {
      try {
        const success = await openProject()
        if (success) {
          setDirty(false)
        }
      } catch (error) {
        console.error('Failed to open project:', error)
      }
    }

    // Reset dialog state
    setShowUnsavedDialog(false)
    setPendingAction(null)
  }, [pendingAction, newProject, openProject, setDirty])

  // Handle "Save" in unsaved changes dialog
  const handleSaveAndContinue = useCallback(async () => {
    try {
      const success = await saveProject()
      if (success) {
        setDirty(false)
        await executePendingAction()
      } else {
        // Save failed, close dialog but don't continue
        setShowUnsavedDialog(false)
        setPendingAction(null)
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      setShowUnsavedDialog(false)
      setPendingAction(null)
    }
  }, [saveProject, setDirty, executePendingAction])

  // Handle "Don't Save" in unsaved changes dialog
  const handleDontSave = useCallback(() => {
    executePendingAction()
  }, [executePendingAction])

  // Handle "Cancel" in unsaved changes dialog
  const handleCancelUnsaved = useCallback(() => {
    setShowUnsavedDialog(false)
    setPendingAction(null)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detect platform for Cmd (Mac) vs Ctrl (Windows/Linux)
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const modKey = isMac ? event.metaKey : event.ctrlKey

      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Cmd/Ctrl+S - Save
      if (modKey && event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSave()
        return
      }

      // Cmd/Ctrl+N - New Project
      if (modKey && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        handleNew()
        return
      }

      // Cmd/Ctrl+O - Open Project
      if (modKey && event.key.toLowerCase() === 'o') {
        event.preventDefault()
        handleOpen()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleNew, handleOpen])

  const handleToggleDrawing = () => {
    if (drawingMode === 'drawing') {
      setDrawingMode('select')
    } else {
      setDrawingMode('drawing')
    }
  }

  return (
    <>
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

      {/* Right Section - Project Info */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          <FileIcon className="inline h-4 w-4" /> {projectName}{isDirty ? ' *' : ''}
        </span>
      </div>
    </header>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your project. Do you want to save them before
              continuing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUnsaved}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDontSave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Don't Save
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndContinue}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
