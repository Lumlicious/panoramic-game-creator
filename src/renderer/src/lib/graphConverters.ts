/**
 * Type-safe converters between project data and React Flow types
 * Phase 6: Node Graph Visualization
 */

import type { Node, Hotspot } from '@/types'
import type { GraphNode, GraphEdge, GraphNodeData, GraphEdgeData } from '@/types/graph'

/**
 * Convert project Node to React Flow GraphNode
 * Denormalizes data for efficient rendering
 */
export function nodeToGraphNode(
  node: Node,
  selectedNodeId: string | null,
  startNodeId: string | null,
  incomingConnectionCounts: Map<string, number>
): GraphNode {
  const isStartNode = node.id === startNodeId
  const incomingCount = incomingConnectionCounts.get(node.id) || 0
  const isOrphaned = incomingCount === 0 && !isStartNode

  // Count outgoing connections (enabled hotspots with valid targets)
  const outgoingConnections = node.hotspots.filter((h) => h.enabled && h.targetNodeId).length

  const data: GraphNodeData = {
    nodeId: node.id,
    name: node.name,
    thumbnailPath: node.panorama.thumbnailPath || null,
    isStartNode,
    isOrphaned,
    hasHotspots: node.hotspots.length > 0,
    hotspotCount: node.hotspots.length,
    outgoingConnections,
    incomingConnections: incomingCount,
    isSelected: node.id === selectedNodeId
  }

  return {
    id: node.id,
    type: 'customNode', // Custom node type for React Flow
    position: node.position,
    data,
    // React Flow built-in properties
    draggable: true,
    selectable: true,
    connectable: false // Connections are defined by hotspots, not user-created
  }
}

/**
 * Convert hotspot to React Flow GraphEdge
 */
export function hotspotToGraphEdge(
  hotspot: Hotspot,
  sourceNodeId: string,
  startNodeId: string | null
): GraphEdge | null {
  // Skip if no target or disabled
  if (!hotspot.targetNodeId || !hotspot.enabled) {
    return null
  }

  const isFromStartNode = sourceNodeId === startNodeId
  const isToStartNode = hotspot.targetNodeId === startNodeId

  const data: GraphEdgeData = {
    hotspotId: hotspot.id,
    hotspotName: hotspot.name,
    animated: isFromStartNode, // Animate edges from start node
    isFromStartNode,
    isToStartNode
  }

  return {
    id: `${sourceNodeId}-${hotspot.id}`, // Unique edge ID
    source: sourceNodeId,
    target: hotspot.targetNodeId,
    type: 'default', // Use bezier curves for smooth edges
    sourceHandle: 'source', // Connect from right handle
    targetHandle: 'target', // Connect to left handle
    data,
    animated: data.animated,
    // Style based on start node
    style: {
      stroke: isFromStartNode ? '#10b981' : '#64748b', // Green for start, gray otherwise
      strokeWidth: isFromStartNode ? 2 : 1
    },
    label: hotspot.name
  }
}

/**
 * Build incoming connection count map
 * Used to detect orphaned nodes
 */
export function buildIncomingConnectionMap(nodes: Node[]): Map<string, number> {
  const counts = new Map<string, number>()

  for (const node of nodes) {
    for (const hotspot of node.hotspots) {
      if (hotspot.enabled && hotspot.targetNodeId) {
        counts.set(hotspot.targetNodeId, (counts.get(hotspot.targetNodeId) || 0) + 1)
      }
    }
  }

  return counts
}

/**
 * Convert all project nodes to graph nodes and edges
 * Main conversion function used by GraphView component
 */
export function projectToGraph(
  nodes: Node[],
  selectedNodeId: string | null,
  startNodeId: string | null
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const incomingCounts = buildIncomingConnectionMap(nodes)

  const graphNodes: GraphNode[] = nodes.map((node) =>
    nodeToGraphNode(node, selectedNodeId, startNodeId, incomingCounts)
  )

  const graphEdges: GraphEdge[] = []
  for (const node of nodes) {
    for (const hotspot of node.hotspots) {
      const edge = hotspotToGraphEdge(hotspot, node.id, startNodeId)
      if (edge) {
        graphEdges.push(edge)
      }
    }
  }

  return { nodes: graphNodes, edges: graphEdges }
}
