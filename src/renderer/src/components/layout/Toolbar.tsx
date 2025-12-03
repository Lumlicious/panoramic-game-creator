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
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  FileIcon,
  FolderOpenIcon,
  SaveIcon,
  PlusIcon,
  PenToolIcon,
  PackageIcon,
  HomeIcon
} from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast'
import { ExportDialog } from '@/components/dialogs/ExportDialog'

/**
 * Toolbar Component
 *
 * Top toolbar with:
 * - File operations (New, Open, Save)
 * - View mode toggle (Editor / Graph)
 */

export function Toolbar(): JSX.Element {
  const { viewMode, setViewMode, isDirty, setDirty, drawingMode, setDrawingMode } = useEditorStore()

  // Project store integration
  const { projectName, projectPath, nodes, newProject, openProject, saveProject, closeProject } =
    useProjectStore()

  // Unsaved changes dialog state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'new' | 'open' | 'home' | null>(null)

  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false)

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
        showSuccess('Project Created', 'New project created successfully')
      } else {
        showError('Creation Failed', 'Failed to create new project')
      }
    } catch (error) {
      showError('Creation Failed', error instanceof Error ? error.message : 'Unknown error')
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
        showSuccess('Project Opened', 'Project loaded successfully')
      } else {
        showError('Open Failed', 'Failed to open project')
      }
    } catch (error) {
      showError('Open Failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }, [isDirty, openProject, setDirty])

  const handleHome = useCallback(() => {
    // Check for unsaved changes
    if (isDirty) {
      setPendingAction('home')
      setShowUnsavedDialog(true)
      return
    }

    // Proceed with closing project
    closeProject()
    setDirty(false)
  }, [isDirty, closeProject, setDirty])

  const handleSave = useCallback(async () => {
    try {
      const success = await saveProject()
      if (success) {
        setDirty(false)
        showSuccess('Project Saved', 'All changes saved successfully')
      } else {
        showError('Save Failed', 'Failed to save project')
      }
    } catch (error) {
      showError('Save Failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }, [saveProject, setDirty])

  // Execute pending action after handling unsaved changes
  const executePendingAction = useCallback(async () => {
    if (pendingAction === 'new') {
      try {
        const success = await newProject()
        if (success) {
          setDirty(false)
          showSuccess('Project Created', 'New project created successfully')
        } else {
          showError('Creation Failed', 'Failed to create new project')
        }
      } catch (error) {
        showError('Creation Failed', error instanceof Error ? error.message : 'Unknown error')
      }
    } else if (pendingAction === 'open') {
      try {
        const success = await openProject()
        if (success) {
          setDirty(false)
          showSuccess('Project Opened', 'Project loaded successfully')
        } else {
          showError('Open Failed', 'Failed to open project')
        }
      } catch (error) {
        showError('Open Failed', error instanceof Error ? error.message : 'Unknown error')
      }
    } else if (pendingAction === 'home') {
      closeProject()
      setDirty(false)
    }

    // Reset dialog state
    setShowUnsavedDialog(false)
    setPendingAction(null)
  }, [pendingAction, newProject, openProject, closeProject, setDirty])

  // Handle "Save" in unsaved changes dialog
  const handleSaveAndContinue = useCallback(async () => {
    try {
      const success = await saveProject()
      if (success) {
        setDirty(false)
        showSuccess('Project Saved', 'All changes saved successfully')
        await executePendingAction()
      } else {
        // Save failed, close dialog but don't continue
        showError('Save Failed', 'Failed to save project')
        setShowUnsavedDialog(false)
        setPendingAction(null)
      }
    } catch (error) {
      showError('Save Failed', error instanceof Error ? error.message : 'Unknown error')
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
    const handleKeyDown = (event: KeyboardEvent): void => {
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

  const handleToggleDrawing = (): void => {
    if (drawingMode === 'drawing') {
      setDrawingMode('select')
    } else {
      setDrawingMode('drawing')
    }
  }

  // Handle export dialog
  const handleExport = useCallback(() => {
    setShowExportDialog(true)
  }, [])

  // Determine if export should be disabled
  const isExportDisabled = !projectPath || nodes.length === 0

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        {/* Left Section - File Operations */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleHome} title="Return to welcome screen">
            <HomeIcon className="h-4 w-4" />
          </Button>

          {/* Separator */}
          <div className="mx-2 h-6 w-px bg-border" />

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
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={isExportDisabled}>
            <PackageIcon className="mr-2 h-4 w-4" />
            Export
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
          {isDirty && <span className="ml-2 text-xs text-muted-foreground">• Unsaved changes</span>}
        </div>

        {/* Center Section - View Mode Toggle */}
        <Tabs value={viewMode} onValueChange={(value): void => setViewMode(value as 'editor' | 'graph')}>
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="graph">Graph</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right Section - Project Info */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            <FileIcon className="inline h-4 w-4" /> {projectName}
            {isDirty ? ' *' : ''}
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

      {/* Export Dialog */}
      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
    </>
  )
}
