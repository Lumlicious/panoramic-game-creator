import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TestCubicLoader } from '@/components/TestCubicLoader'

/**
 * PropertiesPanel Component
 *
 * Right sidebar displaying properties of the selected node.
 * Shows TestCubicLoader when no node selected for testing.
 * Full property editing will be implemented in Phase 5.
 */

export function PropertiesPanel() {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId)
  const getNode = useProjectStore((state) => state.getNode)

  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : undefined

  return (
    <aside className="w-64 border-l bg-background">
      {/* Panel Header */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">Properties</h2>
      </div>

      {/* Properties Content */}
      <ScrollArea className="h-[calc(100vh-3.5rem-3rem)]">
        <div className="p-4 space-y-4">
          {selectedNode ? (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Node Properties</h3>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>ID:</strong> {selectedNode.id}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>Name:</strong> {selectedNode.name}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>Type:</strong> {selectedNode.panorama.type}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Hotspots:</strong> {selectedNode.hotspots.length}
              </p>
              {/* TODO: Phase 5 - Add property editing forms */}
            </Card>
          ) : (
            <TestCubicLoader />
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
