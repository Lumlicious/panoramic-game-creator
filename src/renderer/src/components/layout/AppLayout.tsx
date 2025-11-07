import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { Toolbar } from './Toolbar'
import { NodeListPanel } from './NodeListPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { PanoramaViewer } from '@/components/panorama/PanoramaViewer'
import { ImportTest } from '@/components/test/ImportTest'

/**
 * AppLayout Component
 *
 * Main application layout with:
 * - Top toolbar with action buttons
 * - Left sidebar for node list
 * - Center area for editor/graph view
 * - Right sidebar for properties
 */

export function AppLayout() {
  const viewMode = useEditorStore((state) => state.viewMode)
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId)
  const getNode = useProjectStore((state) => state.getNode)

  // Get selected node's panorama data
  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : undefined
  const panorama = selectedNode?.panorama

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Node List */}
        <NodeListPanel />

        {/* Center Area - Editor or Graph View */}
        <main className="flex flex-1 bg-muted/20">
          {viewMode === 'editor' ? (
            // Panorama Editor View
            <PanoramaViewer panorama={panorama} nodeId={selectedNodeId || undefined} />
          ) : (
            // Node Graph View (placeholder for Phase 6)
            <div className="flex flex-1 items-center justify-center flex-col gap-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-muted-foreground">Node Graph</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Visual graph of all nodes and connections
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Coming in Phase 6</p>
              </div>
              {/* Temporary test component */}
              <ImportTest />
            </div>
          )}
        </main>

        {/* Right Sidebar - Properties */}
        <PropertiesPanel />
      </div>
    </div>
  )
}
