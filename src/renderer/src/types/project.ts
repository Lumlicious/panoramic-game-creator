/**
 * Project types for panoramic game creator
 */

import { Node } from './node'

/**
 * Project settings and preferences
 */
export interface ProjectSettings {
  defaultFOV: number
  hotspotDefaultColor: string
  hotspotHoverColor: string
}

/**
 * Graph layout data for node visualization
 */
export interface GraphLayoutData {
  nodePositions: Record<string, { x: number; y: number }>
  zoom: number
  viewportX: number
  viewportY: number
}

/**
 * Main project data structure
 * Represents a complete panoramic game project
 */
export interface Project {
  id: string
  name: string
  version: string
  created: string
  modified: string
  startNodeId: string | null
  nodes: Node[]
  settings: ProjectSettings
  graphLayout?: GraphLayoutData // Node positions in graph view
  filePath?: string // Absolute path to .pgc directory (runtime only, not serialized)
}
