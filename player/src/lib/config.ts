/**
 * Configuration constants for game player
 * Subset of editor config needed for runtime
 *
 * Copied from editor (src/renderer/src/lib/config.ts)
 */

/**
 * Sphere configuration for panoramic rendering
 */
export const SPHERE_CONFIG = {
  RADIUS: 500, // Base sphere radius
  HOTSPOT_RADIUS: 499.5, // Hotspot geometry radius (0.1% smaller to prevent z-fighting)
  SEGMENTS: 64, // Sphere geometry segments (balance quality/performance)

  // Coordinate system
  THETA_RANGE: [-Math.PI, Math.PI] as const, // Azimuthal angle (horizontal)
  PHI_RANGE: [0, Math.PI] as const, // Polar angle (vertical)

  // Orientation
  THETA_ZERO: 'POSITIVE_X' as const, // theta=0 points to positive X axis (right)
  PHI_ZERO: 'POSITIVE_Y' as const, // phi=0 points to positive Y axis (top)
  COORDINATE_SYSTEM: 'RIGHT_HANDED' as const
} as const

/**
 * Camera configuration
 */
export const CAMERA_CONFIG = {
  FOV: 75, // Default field of view (degrees)
  FOV_MIN: 30, // Max zoom in
  FOV_MAX: 110, // Max zoom out
  NEAR: 0.1,
  FAR: 2000,

  // Initial orientation
  INITIAL_ROTATION: {
    theta: 0, // Look at positive X axis
    phi: Math.PI / 2 // Look at horizon
  }
} as const

/**
 * Hotspot visual style for player
 */
export const HOTSPOT_STYLE = {
  fillColor: '#ff0000',
  strokeColor: '#ff0000',
  opacity: 0.3,
  hoverOpacity: 0.5,
  clickOpacity: 0.7
} as const
