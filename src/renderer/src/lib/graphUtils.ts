/**
 * Graph utility functions with full type safety
 * Phase 6: Node Graph Visualization
 */

import type { Node } from '@/types'
import type { GraphNode } from '@/types/graph'

/**
 * Calculate initial positions for new nodes
 * Uses simple grid layout
 */
export function calculateInitialNodePosition(existingNodes: Node[]): { x: number; y: number } {
  const GRID_SPACING = 300
  const COLS = 5

  const index = existingNodes.length
  const row = Math.floor(index / COLS)
  const col = index % COLS

  return {
    x: col * GRID_SPACING,
    y: row * GRID_SPACING
  }
}

/**
 * Detect cycles in the graph
 * Returns array of node IDs involved in cycles
 */
export function detectCycles(nodes: Node[]): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    path.push(nodeId)

    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return

    for (const hotspot of node.hotspots) {
      if (!hotspot.enabled || !hotspot.targetNodeId) continue

      const targetId = hotspot.targetNodeId

      if (!visited.has(targetId)) {
        dfs(targetId, [...path])
      } else if (recursionStack.has(targetId)) {
        // Cycle detected
        const cycleStart = path.indexOf(targetId)
        cycles.push(path.slice(cycleStart))
      }
    }

    recursionStack.delete(nodeId)
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, [])
    }
  }

  return cycles
}

/**
 * Find shortest path between two nodes
 * Returns array of node IDs or null if no path exists
 */
export function findShortestPath(nodes: Node[], startId: string, endId: string): string[] | null {
  if (startId === endId) return [startId]

  const queue: Array<{ nodeId: string; path: string[] }> = [{ nodeId: startId, path: [startId] }]
  const visited = new Set<string>([startId])

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!

    const node = nodes.find((n) => n.id === nodeId)
    if (!node) continue

    for (const hotspot of node.hotspots) {
      if (!hotspot.enabled || !hotspot.targetNodeId) continue

      const targetId = hotspot.targetNodeId

      if (targetId === endId) {
        return [...path, targetId]
      }

      if (!visited.has(targetId)) {
        visited.add(targetId)
        queue.push({ nodeId: targetId, path: [...path, targetId] })
      }
    }
  }

  return null // No path found
}

/**
 * Calculate graph bounds for fit view
 */
export function calculateGraphBounds(nodes: GraphNode[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x)
    maxX = Math.max(maxX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxY = Math.max(maxY, node.position.y)
  }

  return { minX, maxX, minY, maxY }
}

/**
 * Check if a node is reachable from the start node
 */
export function isReachableFromStart(
  nodes: Node[],
  targetNodeId: string,
  startNodeId: string | null
): boolean {
  if (!startNodeId) return false
  if (targetNodeId === startNodeId) return true

  return findShortestPath(nodes, startNodeId, targetNodeId) !== null
}

/**
 * Get all nodes that are directly connected to a given node
 */
export function getConnectedNodes(
  nodes: Node[],
  nodeId: string
): { incoming: string[]; outgoing: string[] } {
  const incoming: string[] = []
  const outgoing: string[] = []

  // Find outgoing connections
  const node = nodes.find((n) => n.id === nodeId)
  if (node) {
    for (const hotspot of node.hotspots) {
      if (hotspot.enabled && hotspot.targetNodeId) {
        outgoing.push(hotspot.targetNodeId)
      }
    }
  }

  // Find incoming connections
  for (const n of nodes) {
    for (const hotspot of n.hotspots) {
      if (hotspot.enabled && hotspot.targetNodeId === nodeId) {
        incoming.push(n.id)
      }
    }
  }

  return { incoming, outgoing }
}
