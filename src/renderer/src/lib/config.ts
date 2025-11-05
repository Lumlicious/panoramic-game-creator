/**
 * Configuration constants for panoramic game creator
 * All key technical specifications and limits
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
 * Performance limits
 */
export const PERFORMANCE_LIMITS = {
  // Project limits
  MAX_NODES: 500, // Hard limit
  RECOMMENDED_NODES: 100, // Soft warning

  // Per-node limits
  MAX_HOTSPOTS_PER_NODE: 50,
  RECOMMENDED_HOTSPOTS_PER_NODE: 20,

  // Hotspot limits
  MIN_POLYGON_POINTS: 3,
  MAX_POLYGON_POINTS: 20, // Prevent performance issues

  // Image limits
  MAX_TEXTURE_SIZE: 8192, // WebGL max texture size

  // Interaction
  HOVER_THROTTLE_MS: 16, // ~60fps
  RAYCAST_THROTTLE_MS: 16
} as const

/**
 * Image specifications
 */
export const IMAGE_SPECS = {
  FORMATS: ['jpg', 'jpeg', 'png', 'webp'] as const,

  // Equirectangular
  EQUIRECT: {
    ASPECT_RATIO: 2.0, // Width must be 2x height
    ASPECT_TOLERANCE: 0.05, // ±5% tolerance
    MIN_WIDTH: 2048,
    MAX_WIDTH: 8192,
    RECOMMENDED_WIDTH: 4096
  },

  // Cubic (future)
  CUBIC: {
    FACE_ASPECT_RATIO: 1.0,
    MIN_SIZE: 1024,
    MAX_SIZE: 4096
  },

  // General
  MAX_FILE_SIZE_MB: 50
} as const

/**
 * Default hotspot style
 */
export const DEFAULT_HOTSPOT_STYLE = {
  fillColor: '#ff0000',
  strokeColor: '#ff0000',
  strokeWidth: 2,
  opacity: 0.3,
  hoverFillColor: '#ff3333'
} as const

/**
 * Default project settings
 */
export const DEFAULT_PROJECT_SETTINGS = {
  defaultFOV: CAMERA_CONFIG.FOV,
  hotspotDefaultColor: DEFAULT_HOTSPOT_STYLE.fillColor,
  hotspotHoverColor: DEFAULT_HOTSPOT_STYLE.hoverFillColor
} as const

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  // File operations
  NEW_PROJECT: ['Ctrl+N', 'Cmd+N'] as const,
  OPEN_PROJECT: ['Ctrl+O', 'Cmd+O'] as const,
  SAVE_PROJECT: ['Ctrl+S', 'Cmd+S'] as const,
  SAVE_AS: ['Ctrl+Shift+S', 'Cmd+Shift+S'] as const,

  // Drawing/Editing (REQUIRED for Phase 4)
  DELETE: ['Delete', 'Backspace'] as const,
  ESCAPE: ['Escape'] as const,
  ENTER: ['Enter'] as const,

  // Navigation
  TAB: ['Tab'] as const,

  // Zoom
  ZOOM_IN: ['Ctrl+=', 'Cmd+='] as const,
  ZOOM_OUT: ['Ctrl+-', 'Cmd+-'] as const,
  ZOOM_RESET: ['Ctrl+0', 'Cmd+0'] as const
} as const

/**
 * Project file format version
 */
export const PROJECT_FORMAT_VERSION = '1.0.0' as const

/**
 * Thumbnail configuration
 */
export const THUMBNAIL_CONFIG = {
  WIDTH: 200,
  HEIGHT: 100,
  QUALITY: 80,
  FORMAT: 'jpg' as const
} as const
