/**
 * Type-safe selectors for graph data
 * Uses Zustand's shallow equality for performance
 * Phase 6: Node Graph Visualization
 */

import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import { useMemo } from 'react'
import type { Node } from '@/types'
import type { GraphNode, GraphEdge } from '@/types/graph'
import { projectToGraph } from './graphConverters'

/**
 * Select graph data for rendering
 * Memoized with shallow comparison to prevent unnecessary re-renders
 */
export function useGraphData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // Select only what we need from stores
  const nodes = useProjectStore((state) => state.nodes)
  const startNodeId = useProjectStore((state) => state.startNodeId)
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId)

  // Convert to graph format (memoized by dependencies)
  return useMemo(
    () => projectToGraph(nodes, selectedNodeId, startNodeId),
    [nodes, selectedNodeId, startNodeId]
  )
}

/**
 * Select orphaned nodes for warnings
 */
export function useOrphanedNodes(): Node[] {
  const nodes = useProjectStore((state) => state.nodes)
  const startNodeId = useProjectStore((state) => state.startNodeId)

  return useMemo(() => {
    const { nodes: graphNodes } = projectToGraph(nodes, null, startNodeId)

    return nodes.filter((node) => {
      const graphNode = graphNodes.find((gn) => gn.id === node.id)
      return graphNode?.data.isOrphaned || false
    })
  }, [nodes, startNodeId])
}

/**
 * Select graph statistics
 */
export interface GraphStats {
  totalNodes: number
  totalEdges: number
  orphanedNodes: number
  hasStartNode: boolean
}

export function useGraphStats(): GraphStats {
  const nodes = useProjectStore((state) => state.nodes)
  const startNodeId = useProjectStore((state) => state.startNodeId)

  return useMemo(() => {
    const { nodes: graphNodes, edges } = projectToGraph(nodes, null, startNodeId)

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      orphanedNodes: graphNodes.filter((n) => n.data.isOrphaned).length,
      hasStartNode: startNodeId !== null
    }
  }, [nodes, startNodeId])
}
