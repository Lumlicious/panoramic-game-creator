/**
 * Hotspot types for panoramic game creator
 */

/**
 * Spherical coordinates for a point on the panoramic sphere
 * - theta: Azimuthal angle (horizontal rotation) [-π, π]
 * - phi: Polar angle (vertical angle) [0, π]
 */
export interface SphericalPoint {
  theta: number // Azimuthal angle (horizontal rotation)
  phi: number // Polar angle (vertical angle)
}

/**
 * Visual styling for hotspot rendering
 */
export interface HotspotStyle {
  fillColor: string
  strokeColor: string
  strokeWidth: number
  opacity: number
  hoverFillColor?: string
}

/**
 * Hotspot polygon drawn on a panoramic node
 * Links to another node when clicked
 */
export interface Hotspot {
  id: string
  name: string
  targetNodeId: string
  polygon: SphericalPoint[] // Stored in spherical coordinates (resolution-independent)
  style: HotspotStyle
  enabled: boolean // Allow toggling hotspots on/off
  description?: string // For future tooltips
  transitionType?: 'instant' | 'fade' // Future feature
}
