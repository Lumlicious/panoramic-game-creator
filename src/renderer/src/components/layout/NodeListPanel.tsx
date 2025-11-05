import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlusIcon } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'

/**
 * NodeListPanel Component
 *
 * Left sidebar displaying the list of nodes in the project.
 * Shows test nodes created by TestCubicLoader.
 * Full node management will be implemented in Phase 5.
 */

export function NodeListPanel() {
  const nodes = useProjectStore((state) => state.nodes)
  const { selectedNodeId, setSelectedNodeId } = useEditorStore()

  const handleAddNode = () => {
    // TODO: Phase 5 - Add node dialog/modal
    console.log('Add node (not yet implemented)')
  }

  return (
    <aside className="w-64 border-r bg-background">
      {/* Panel Header */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">Nodes</h2>
        <Button variant="ghost" size="sm" onClick={handleAddNode}>
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
                Use the test loader in the properties panel to create a test node
              </p>
            </Card>
          ) : (
            /* Node list */
            nodes.map((node) => (
              <Card
                key={node.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                  selectedNodeId === node.id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <h3 className="text-sm font-medium truncate">{node.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {node.panorama.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {node.hotspots.length} hotspots
                </p>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
