import type { SphericalPoint } from '@/types'

/**
 * Validation utilities for hotspot creation and editing
 */

/**
 * Check if a polygon crosses the theta=±π seam on the sphere.
 *
 * The seam is the back of the sphere where theta wraps from +π to -π.
 * Crossing this seam causes rendering issues and is not allowed.
 *
 * A polygon crosses the seam if any edge spans a theta difference > π,
 * indicating it wraps around the back discontinuity.
 *
 * @param points - Polygon vertices in spherical coordinates
 * @returns true if polygon crosses seam, false otherwise
 */
export function crossesSeam(points: SphericalPoint[]): boolean {
  if (points.length < 2) return false

  for (let i = 0; i < points.length; i++) {
    const curr = points[i]
    const next = points[(i + 1) % points.length]

    const thetaDiff = Math.abs(curr.theta - next.theta)

    // If the difference is greater than π, the edge crosses the seam
    if (thetaDiff > Math.PI) {
      return true
    }
  }

  return false
}

/**
 * Validate polygon has minimum required points
 */
export function hasMinPoints(points: SphericalPoint[], min: number = 3): boolean {
  return points.length >= min
}

/**
 * Validate polygon doesn't exceed maximum points
 */
export function hasMaxPoints(points: SphericalPoint[], max: number = 20): boolean {
  return points.length <= max
}

/**
 * Comprehensive polygon validation
 *
 * @returns {valid: true} or {valid: false, error: string}
 */
export function validatePolygon(
  points: SphericalPoint[]
): { valid: true } | { valid: false; error: string } {
  // Check minimum points
  if (!hasMinPoints(points, 3)) {
    return { valid: false, error: 'Polygon must have at least 3 points' }
  }

  // Check maximum points
  if (!hasMaxPoints(points, 20)) {
    return { valid: false, error: 'Polygon cannot have more than 20 points' }
  }

  // Check seam crossing
  if (crossesSeam(points)) {
    return {
      valid: false,
      error: 'Polygon cannot cross the back seam (theta=±π). Try drawing on the front hemisphere.'
    }
  }

  return { valid: true }
}
