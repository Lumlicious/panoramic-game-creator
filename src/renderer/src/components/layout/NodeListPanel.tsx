import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PlusIcon, Loader2Icon } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import { getThumbnailUrl, type PanoramaType } from '@/lib/imageImport'
import { showSuccess, showError } from '@/lib/toast'

/**
 * AddNodeDialog Component
 *
 * Modal dialog for creating a new node with panorama import.
 */
interface AddNodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNodeCreated: (nodeId: string) => void
}

function AddNodeDialog({ open, onOpenChange, onNodeCreated }: AddNodeDialogProps) {
  const [nodeName, setNodeName] = useState('')
  const [panoramaType, setPanoramaType] = useState<PanoramaType>('equirectangular')
  const [isCreating, setIsCreating] = useState(false)
  const createNodeWithPanorama = useProjectStore((state) => state.createNodeWithPanorama)
  const setDirty = useEditorStore((state) => state.setDirty)

  const handleCreate = async () => {
    if (!nodeName.trim()) {
      showError('Validation Error', 'Node name is required')
      return
    }

    setIsCreating(true)
    try {
      const node = await createNodeWithPanorama(nodeName.trim(), panoramaType)
      if (node) {
        setDirty(true)
        showSuccess('Node Created', `"${nodeName.trim()}" created successfully`)
        onNodeCreated(node.id)
        // Reset form
        setNodeName('')
        setPanoramaType('equirectangular')
        onOpenChange(false)
      } else {
        showError('Creation Cancelled', 'Node creation was cancelled or failed')
      }
    } catch (error) {
      showError('Creation Failed', error instanceof Error ? error.message : 'Failed to create node')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Node</DialogTitle>
          <DialogDescription>
            Create a new node by importing a panoramic image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Node Name Input */}
          <div className="space-y-2">
            <Label htmlFor="node-name">Node Name</Label>
            <Input
              id="node-name"
              placeholder="e.g., Living Room"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* Panorama Type Selection */}
          <div className="space-y-2">
            <Label>Panorama Type</Label>
            <RadioGroup
              value={panoramaType}
              onValueChange={(value) => setPanoramaType(value as PanoramaType)}
              disabled={isCreating}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equirectangular" id="equirect" />
                <Label htmlFor="equirect" className="font-normal cursor-pointer">
                  Equirectangular (Single 2:1 image)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cubic" id="cubic" />
                <Label htmlFor="cubic" className="font-normal cursor-pointer">
                  Cubic (6 square faces)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !nodeName.trim()}>
            {isCreating && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Creating...' : 'Create Node'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * NodeListPanel Component
 *
 * Left sidebar displaying the list of nodes in the project.
 * Allows adding new nodes and selecting existing ones.
 */
export function NodeListPanel() {
  const nodes = useProjectStore((state) => state.nodes)
  const projectPath = useProjectStore((state) => state.projectPath)
  const { selectedNodeId, setSelectedNodeId } = useEditorStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleNodeCreated = (nodeId: string) => {
    setSelectedNodeId(nodeId)
  }

  return (
    <>
      <aside className="w-64 border-r bg-background">
        {/* Panel Header */}
        <div className="flex h-12 items-center justify-between border-b px-4">
          <h2 className="text-sm font-semibold">Nodes</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Node List */}
        <ScrollArea className="h-[calc(100vh-3.5rem-3rem)]">
          <div className="p-4 space-y-2">
            {nodes.length === 0 ? (
              /* Placeholder - No nodes yet */
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No nodes yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click the + button to add your first node
                </p>
              </Card>
            ) : (
              /* Node list */
              nodes.map((node) => {
                // projectPath is guaranteed to exist if nodes exist
                const thumbnailUrl =
                  projectPath && node.panorama.thumbnailPath
                    ? getThumbnailUrl(projectPath, node.panorama.thumbnailPath)
                    : null

                return (
                  <Card
                    key={node.id}
                    className={`overflow-hidden cursor-pointer transition-colors hover:bg-accent ${
                      selectedNodeId === node.id ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    {/* Thumbnail */}
                    {thumbnailUrl && (
                      <div className="w-full h-20 bg-muted overflow-hidden">
                        <img
                          src={thumbnailUrl}
                          alt={node.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Node Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium truncate">{node.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {node.panorama.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {node.hotspots.length} hotspots
                      </p>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Add Node Dialog */}
      <AddNodeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onNodeCreated={handleNodeCreated}
      />
    </>
  )
}
