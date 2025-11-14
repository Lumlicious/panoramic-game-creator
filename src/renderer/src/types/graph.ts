/**
 * Type definitions for Node Graph (React Flow integration)
 * Phase 6: Node Graph Visualization
 */

import type { Node as FlowNode, Edge as FlowEdge } from 'reactflow'

/**
 * Custom data attached to React Flow nodes
 * Extends the base Node type with graph-specific metadata
 */
export interface GraphNodeData {
  // Core node reference
  nodeId: string // Reference to Node.id in projectStore

  // Display data (denormalized for performance)
  name: string
  thumbnailPath: string | null

  // Visual state
  isStartNode: boolean
  isOrphaned: boolean // No incoming connections
  hasHotspots: boolean
  hotspotCount: number

  // Connection metadata
  outgoingConnections: number
  incomingConnections: number

  // Interaction state
  isSelected: boolean
}

/**
 * React Flow node with our custom data
 * Type-safe wrapper around ReactFlow's Node type
 */
export type GraphNode = FlowNode<GraphNodeData>

/**
 * Custom data attached to React Flow edges
 * Represents hotspot connections between nodes
 */
export interface GraphEdgeData {
  // Source hotspot reference
  hotspotId: string
  hotspotName: string

  // Visual styling
  animated?: boolean
  isFromStartNode?: boolean
  isToStartNode?: boolean
}

/**
 * React Flow edge with our custom data
 */
export type GraphEdge = FlowEdge<GraphEdgeData>

/**
 * Graph viewport state (persisted in project.json)
 */
export interface GraphViewport {
  x: number
  y: number
  zoom: number
}

/**
 * Complete graph state for persistence
 */
export interface GraphLayoutData {
  // Node positions (keyed by node ID)
  nodePositions: Record<string, { x: number; y: number }>

  // Viewport state
  viewport: GraphViewport

  // Layout metadata
  lastModified: string
  autoLayoutApplied?: string // Algorithm name if auto-layout was used
}
