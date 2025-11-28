/**
 * Game types for panoramic game player
 * Based on project types from editor, but simplified for runtime
 */

/**
 * Spherical coordinates for a point on the panoramic sphere
 * - theta: Azimuthal angle (horizontal rotation) [-π, π]
 * - phi: Polar angle (vertical angle) [0, π]
 */
export interface SphericalPoint {
  theta: number
  phi: number
}

/**
 * Game hotspot - clickable area on a panorama
 */
export interface GameHotspot {
  id: string
  name: string
  polygon: SphericalPoint[] // Vertices in spherical coordinates
  targetNodeId: string | null
  interactionType: 'navigate' | 'pickup' | 'trigger' // Extensibility for future
  metadata?: Record<string, unknown> // For custom interactions
}

/**
 * Game node - a single panorama scene
 */
export interface GameNode {
  id: string
  name: string
  panorama: {
    type: 'equirectangular' | 'cubic'
    url: string // Relative path OR CDN URL
  }
  hotspots: GameHotspot[]
}

/**
 * Game settings
 */
export interface GameSettings {
  title: string
  startNodeId: string
}

/**
 * Complete game data structure
 * This is what gets loaded from game.json
 */
export interface GameData {
  version: string
  settings: GameSettings
  nodes: GameNode[]
}

/**
 * Game state (managed by Zustand)
 */
export interface GameState {
  // Navigation
  currentNodeId: string
  previousNodeId: string | null

  // Progress tracking
  visitedNodes: Set<string>

  // Loading state
  isLoading: boolean

  // Future features
  inventory: InventoryItem[]
  gameVariables: Record<string, unknown>

  // Actions
  navigate: (nodeId: string) => void
  setLoading: (isLoading: boolean) => void
  addToInventory: (item: InventoryItem) => void
  setVariable: (key: string, value: unknown) => void
  reset: () => void
}

/**
 * Inventory item (future feature)
 */
export interface InventoryItem {
  id: string
  name: string
  description: string
  icon?: string
}
