/**
 * Graph validation and error detection
 * Phase 6: Node Graph Visualization
 */

import type { Node } from '@/types'

/**
 * Validation result type
 */
export interface GraphValidationResult {
  valid: boolean
  errors: GraphValidationError[]
  warnings: GraphValidationWarning[]
}

/**
 * Validation error types (discriminated union)
 */
export type GraphValidationError =
  | { type: 'MISSING_START_NODE' }
  | { type: 'BROKEN_HOTSPOT_REFERENCE'; nodeId: string; hotspotId: string; targetNodeId: string }
  | { type: 'SELF_REFERENCING_HOTSPOT'; nodeId: string; hotspotId: string }

export type GraphValidationWarning =
  | { type: 'ORPHANED_NODE'; nodeId: string; nodeName: string }
  | { type: 'NO_OUTGOING_CONNECTIONS'; nodeId: string; nodeName: string }
  | { type: 'MISSING_THUMBNAIL'; nodeId: string; nodeName: string }

/**
 * Validate graph integrity
 * Returns type-safe validation result
 */
export function validateGraph(nodes: Node[], startNodeId: string | null): GraphValidationResult {
  const errors: GraphValidationError[] = []
  const warnings: GraphValidationWarning[] = []

  // Build node ID set for quick lookup
  const nodeIds = new Set(nodes.map((n) => n.id))

  // Build incoming connection map
  const incomingConnections = new Map<string, number>()

  // Validate start node
  if (!startNodeId || !nodeIds.has(startNodeId)) {
    errors.push({ type: 'MISSING_START_NODE' })
  }

  // Validate each node
  for (const node of nodes) {
    // Check thumbnail
    if (!node.panorama.thumbnailPath) {
      warnings.push({
        type: 'MISSING_THUMBNAIL',
        nodeId: node.id,
        nodeName: node.name
      })
    }

    // Validate hotspots
    let hasOutgoing = false
    for (const hotspot of node.hotspots) {
      if (!hotspot.enabled || !hotspot.targetNodeId) continue

      hasOutgoing = true

      // Check for self-reference
      if (hotspot.targetNodeId === node.id) {
        errors.push({
          type: 'SELF_REFERENCING_HOTSPOT',
          nodeId: node.id,
          hotspotId: hotspot.id
        })
        continue
      }

      // Check for broken reference
      if (!nodeIds.has(hotspot.targetNodeId)) {
        errors.push({
          type: 'BROKEN_HOTSPOT_REFERENCE',
          nodeId: node.id,
          hotspotId: hotspot.id,
          targetNodeId: hotspot.targetNodeId
        })
        continue
      }

      // Count incoming connection
      incomingConnections.set(
        hotspot.targetNodeId,
        (incomingConnections.get(hotspot.targetNodeId) || 0) + 1
      )
    }

    // Warn if no outgoing connections
    if (!hasOutgoing && node.id !== startNodeId) {
      warnings.push({
        type: 'NO_OUTGOING_CONNECTIONS',
        nodeId: node.id,
        nodeName: node.name
      })
    }
  }

  // Check for orphaned nodes
  for (const node of nodes) {
    if (node.id === startNodeId) continue // Start node is never orphaned

    if (!incomingConnections.has(node.id)) {
      warnings.push({
        type: 'ORPHANED_NODE',
        nodeId: node.id,
        nodeName: node.name
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Type guard for validation errors
 */
export function isBrokenReference(
  error: GraphValidationError
): error is Extract<GraphValidationError, { type: 'BROKEN_HOTSPOT_REFERENCE' }> {
  return error.type === 'BROKEN_HOTSPOT_REFERENCE'
}

/**
 * Format error message for display
 */
export function formatValidationError(error: GraphValidationError, nodes: Node[]): string {
  switch (error.type) {
    case 'MISSING_START_NODE':
      return 'No start node defined. Set a start node in the properties panel.'

    case 'BROKEN_HOTSPOT_REFERENCE': {
      const node = nodes.find((n) => n.id === error.nodeId)
      return `Node "${node?.name || 'Unknown'}" has a hotspot linking to non-existent node (ID: ${error.targetNodeId})`
    }

    case 'SELF_REFERENCING_HOTSPOT': {
      const node = nodes.find((n) => n.id === error.nodeId)
      return `Node "${node?.name || 'Unknown'}" has a hotspot linking to itself`
    }
  }
}

/**
 * Format warning message for display
 */
export function formatValidationWarning(warning: GraphValidationWarning): string {
  switch (warning.type) {
    case 'ORPHANED_NODE':
      return `Node "${warning.nodeName}" has no incoming connections`

    case 'NO_OUTGOING_CONNECTIONS':
      return `Node "${warning.nodeName}" has no outgoing connections`

    case 'MISSING_THUMBNAIL':
      return `Node "${warning.nodeName}" is missing a thumbnail`
  }
}
