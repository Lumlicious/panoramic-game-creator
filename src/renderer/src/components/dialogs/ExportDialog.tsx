import { useState, useCallback, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  FolderIcon,
  PackageIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2,
  CopyIcon
} from 'lucide-react'
import { showSuccess, showError, showWarning } from '@/lib/toast'

/**
 * Export Dialog Component
 *
 * Allows users to export their project as a playable web game.
 *
 * Flow:
 * 1. User opens dialog
 * 2. User selects destination folder
 * 3. User clicks Export
 * 4. Shows progress spinner during export
 * 5. Shows success message with path OR error message
 */

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ExportState = 'idle' | 'exporting' | 'success' | 'error'

export function ExportDialog({ open, onOpenChange }: ExportDialogProps): JSX.Element {
  const { projectName, projectPath, nodes, startNodeId } = useProjectStore()

  const [exportDestination, setExportDestination] = useState<string>('')
  const [exportState, setExportState] = useState<ExportState>('idle')
  const [exportedPath, setExportedPath] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Reset state when dialog opens (handles both controlled and uncontrolled opening)
  useEffect(() => {
    if (open) {
      setExportDestination('')
      setExportState('idle')
      setExportedPath('')
      setErrorMessage('')
    }
  }, [open])

  // Handle dialog open/close changes from within the dialog
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen)
    },
    [onOpenChange]
  )

  // Choose export destination folder
  const handleChooseDestination = useCallback(async () => {
    try {
      const result = await window.exportAPI.chooseExportDestination()

      if (result.success && result.data) {
        setExportDestination(result.data)
      } else if (result.error) {
        showError('Selection Failed', result.error)
      }
    } catch (error) {
      showError('Selection Failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }, [])

  // Export project
  const handleExport = useCallback(async () => {
    if (!exportDestination || !projectPath) {
      return
    }

    // Validation: Check for no nodes
    if (nodes.length === 0) {
      setExportState('error')
      setErrorMessage('Cannot export an empty project. Please add at least one node.')
      return
    }

    // Warning: No start node (but allow export)
    if (!startNodeId) {
      showWarning(
        'No Start Node',
        'No start node is set. The player will start at an arbitrary node.'
      )
    }

    // Clear previous error state and start export
    setExportState('exporting')
    setErrorMessage('')

    try {
      // Get project data from store
      const projectData = {
        projectId: useProjectStore.getState().projectId || `proj-${Date.now()}`,
        projectName,
        version: useProjectStore.getState().version,
        nodes,
        startNodeId,
        settings: useProjectStore.getState().settings,
        graphLayout: useProjectStore.getState().graphLayout,
        metadata: {
          created: useProjectStore.getState().created || new Date().toISOString(),
          modified: useProjectStore.getState().modified || new Date().toISOString()
        }
      }

      const result = await window.exportAPI.exportProject({
        projectPath,
        exportPath: exportDestination,
        projectData
      })

      if (result.success && result.data) {
        setExportState('success')
        setExportedPath(result.data.exportPath)
        showSuccess('Export Successful', `Game exported to ${result.data.exportPath}`)
      } else {
        setExportState('error')
        const message = result.error || 'Export failed for unknown reason'
        setErrorMessage(message)
        showError('Export Failed', message)
      }
    } catch (error) {
      setExportState('error')
      const message = error instanceof Error ? error.message : 'Unknown error'
      setErrorMessage(message)
      showError('Export Failed', message)
    }
  }, [exportDestination, projectPath, nodes, startNodeId, projectName])

  // Close dialog
  const handleClose = useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  // Copy exported path to clipboard
  const handleCopyPath = useCallback(async () => {
    if (exportedPath) {
      try {
        await navigator.clipboard.writeText(exportedPath)
        showSuccess('Path Copied', 'Export path copied to clipboard')
      } catch (error) {
        console.error('Failed to copy path:', error)
        showError('Copy Failed', 'Could not copy path to clipboard.')
      }
    }
  }, [exportedPath])

  // Determine if export button should be disabled
  const isExportDisabled =
    !exportDestination || exportState === 'exporting' || exportState === 'success'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Export Game: {projectName}
          </DialogTitle>
          <DialogDescription>
            Export your project as a standalone web game that can be played in any browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Idle/Exporting State: Choose Destination */}
          {(exportState === 'idle' || exportState === 'exporting') && (
            <>
              {/* Destination Folder Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Destination</label>
                <div className="flex gap-2">
                  <div className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-sm">
                    {exportDestination || 'No destination selected'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChooseDestination}
                    disabled={exportState === 'exporting'}
                  >
                    <FolderIcon className="mr-2 h-4 w-4" />
                    Choose Folder
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A folder named &ldquo;{projectName}&rdquo; will be created at this location.
                </p>
              </div>

              {/* Export Progress */}
              {exportState === 'exporting' && (
                <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Exporting game...</p>
                    <p className="text-xs text-muted-foreground">
                      Building player, copying assets, and generating files
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Success State */}
          {exportState === 'success' && (
            <div className="space-y-3 rounded-md border border-green-500/50 bg-green-500/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Export Successful!
                  </p>
                  <p className="mt-1 text-xs text-green-800 dark:text-green-200">
                    Your game has been exported to:
                  </p>
                  <p className="mt-2 break-all rounded bg-green-950/20 px-2 py-1 font-mono text-xs text-green-900 dark:text-green-100">
                    {exportedPath}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyPath} className="w-full">
                <CopyIcon className="mr-2 h-4 w-4" />
                Copy Path
              </Button>
            </div>
          )}

          {/* Error State */}
          {exportState === 'error' && (
            <div className="space-y-2 rounded-md border border-red-500/50 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircleIcon className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Export Failed
                  </p>
                  <p className="mt-1 text-xs text-red-800 dark:text-red-200">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {exportState === 'success' || exportState === 'error' ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={exportState === 'exporting'}
              >
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExportDisabled}>
                {exportState === 'exporting' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <PackageIcon className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
