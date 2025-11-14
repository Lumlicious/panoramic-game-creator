import { useMemo } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { Toolbar } from './Toolbar'
import { NodeListPanel } from './NodeListPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { PanoramaViewer } from '@/components/panorama/PanoramaViewer'
import { GraphView } from '@/components/graph/GraphView'
import { getPanoramaUrl } from '@/lib/imageImport'
import type { PanoramaData } from '@/types'

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
  const projectPath = useProjectStore((state) => state.projectPath)

  // Get selected node's panorama data
  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : undefined

  // Resolve panorama paths to absolute URLs for Three.js
  const panorama = useMemo<PanoramaData | undefined>(() => {
    if (!selectedNode?.panorama || !projectPath) return undefined

    const { panorama: nodePanorama } = selectedNode

    // Resolve equirectangular panorama path
    if (nodePanorama.type === 'equirectangular' && nodePanorama.filePath) {
      return {
        ...nodePanorama,
        filePath: getPanoramaUrl(projectPath, nodePanorama.filePath)
      }
    }

    // Resolve cubic panorama paths
    if (nodePanorama.type === 'cubic' && nodePanorama.faces) {
      return {
        ...nodePanorama,
        faces: {
          front: getPanoramaUrl(projectPath, nodePanorama.faces.front),
          back: getPanoramaUrl(projectPath, nodePanorama.faces.back),
          left: getPanoramaUrl(projectPath, nodePanorama.faces.left),
          right: getPanoramaUrl(projectPath, nodePanorama.faces.right),
          top: getPanoramaUrl(projectPath, nodePanorama.faces.top),
          bottom: getPanoramaUrl(projectPath, nodePanorama.faces.bottom)
        }
      }
    }

    return nodePanorama
  }, [selectedNode, projectPath])

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
            // Node Graph View
            <GraphView />
          )}
        </main>

        {/* Right Sidebar - Properties */}
        <PropertiesPanel />
      </div>
    </div>
  )
}
