/**
 * Game Data Transformer
 *
 * Transforms editor's Project format to player's GameData format.
 * Validates data integrity before transformation.
 */

import type { GameData, GameNode, GameHotspot, CubicFaces } from '../../../player/src/types/game'

/**
 * Editor types (minimal definitions needed for transformation)
 */
interface EditorNode {
  id: string
  name: string
  panorama: {
    type: 'equirectangular' | 'cubic'
    filePath?: string
    faces?: Record<string, string>
  }
  hotspots: Array<{
    id: string
    name: string
    targetNodeId: string
    polygon: Array<{ theta: number; phi: number }>
    enabled: boolean
  }>
}

interface EditorProject {
  projectId: string
  projectName: string
  version: string
  startNodeId: string | null
  nodes: EditorNode[]
}

/**
 * Validation error with user-friendly message
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Transform editor project to game data
 *
 * @param project - Editor project data
 * @returns GameData - Ready for player consumption
 * @throws ValidationError - If project data is invalid
 */
export function transformProjectToGameData(project: EditorProject): GameData {
  // Step 1: Validate project
  validateProject(project)

  // Step 2: Transform nodes
  const gameNodes: GameNode[] = project.nodes.map((node) => transformNode(node))

  // Step 3: Build game data
  const gameData: GameData = {
    version: '1.0.0',
    settings: {
      title: project.projectName,
      startNodeId: project.startNodeId! // Already validated in step 1
    },
    nodes: gameNodes
  }

  return gameData
}

/**
 * Validate project data
 */
function validateProject(project: EditorProject): void {
  // Check for nodes
  if (!project.nodes || project.nodes.length === 0) {
    throw new ValidationError('Project has no nodes. Add at least one node before exporting.')
  }

  // Check for start node
  if (!project.startNodeId) {
    throw new ValidationError('No start node set. Set a start node before exporting.')
  }

  // Verify start node exists
  const startNode = project.nodes.find((n) => n.id === project.startNodeId)
  if (!startNode) {
    throw new ValidationError(
      `Start node "${project.startNodeId}" not found in project nodes.`
    )
  }

  // Validate all nodes have panoramas
  for (const node of project.nodes) {
    if (node.panorama.type === 'equirectangular') {
      if (!node.panorama.filePath) {
        throw new ValidationError(`Node "${node.name}" has no panorama image assigned.`)
      }
    } else if (node.panorama.type === 'cubic') {
      if (!node.panorama.faces || Object.keys(node.panorama.faces).length !== 6) {
        throw new ValidationError(`Node "${node.name}" has incomplete cubic panorama faces.`)
      }
    }

    // Validate enabled hotspots have valid targets
    const enabledHotspots = node.hotspots.filter((h) => h.enabled)
    for (const hotspot of enabledHotspots) {
      if (!hotspot.targetNodeId) {
        throw new ValidationError(
          `Hotspot "${hotspot.name}" in node "${node.name}" has no target assigned.`
        )
      }

      const targetNode = project.nodes.find((n) => n.id === hotspot.targetNodeId)
      if (!targetNode) {
        throw new ValidationError(
          `Hotspot "${hotspot.name}" in node "${node.name}" references missing target node.`
        )
      }
    }
  }
}

/**
 * Transform editor node to game node
 */
function transformNode(node: EditorNode): GameNode {
  // Transform hotspots (only enabled ones)
  const gameHotspots: GameHotspot[] = node.hotspots
    .filter((h) => h.enabled)
    .map((hotspot) => transformHotspot(hotspot))

  // Build panorama data based on type
  if (node.panorama.type === 'equirectangular') {
    // Extract filename from path (e.g., "assets/panoramas/node-123.jpg" → "node-123.jpg")
    const filename = node.panorama.filePath!.split('/').pop()!
    return {
      id: node.id,
      name: node.name,
      panorama: {
        type: 'equirectangular',
        url: `./assets/panoramas/${filename}`
      },
      hotspots: gameHotspots
    }
  } else {
    // Cubic panorama - generate face URLs
    // Files are named: {nodeId}_front.jpg, {nodeId}_back.jpg, etc.
    const faces: CubicFaces = {
      front: `./assets/panoramas/${node.id}_front.jpg`,
      back: `./assets/panoramas/${node.id}_back.jpg`,
      left: `./assets/panoramas/${node.id}_left.jpg`,
      right: `./assets/panoramas/${node.id}_right.jpg`,
      top: `./assets/panoramas/${node.id}_top.jpg`,
      bottom: `./assets/panoramas/${node.id}_bottom.jpg`
    }

    return {
      id: node.id,
      name: node.name,
      panorama: {
        type: 'cubic',
        faces
      },
      hotspots: gameHotspots
    }
  }
}

/**
 * Transform editor hotspot to game hotspot
 */
function transformHotspot(hotspot: EditorNode['hotspots'][0]): GameHotspot {
  return {
    id: hotspot.id,
    name: hotspot.name,
    polygon: hotspot.polygon, // Already in correct format (SphericalPoint[])
    targetNodeId: hotspot.targetNodeId,
    interactionType: 'navigate' // Default for MVP
  }
}
