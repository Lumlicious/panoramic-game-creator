/**
 * Coordinate conversion utilities
 * Handles conversion between spherical and cartesian coordinates
 */

import * as THREE from 'three'
import { SphericalPoint } from '../types'
import { SPHERE_CONFIG } from './config'

/**
 * Convert spherical coordinates to 3D cartesian coordinates
 * @param spherical - Spherical coordinates (theta, phi)
 * @param radius - Sphere radius (defaults to SPHERE_CONFIG.RADIUS)
 * @returns THREE.Vector3 in cartesian coordinates
 */
export function sphericalToCartesian(
  spherical: SphericalPoint,
  radius: number = SPHERE_CONFIG.RADIUS
): THREE.Vector3 {
  const { theta, phi } = spherical

  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta), // X
    radius * Math.cos(phi), // Y
    radius * Math.sin(phi) * Math.sin(theta) // Z
  )
}

/**
 * Convert 3D cartesian coordinates to spherical coordinates
 * @param position - THREE.Vector3 position
 * @returns SphericalPoint with theta and phi
 */
export function cartesianToSpherical(position: THREE.Vector3): SphericalPoint {
  const radius = position.length()

  return {
    theta: Math.atan2(position.z, position.x),
    phi: Math.acos(position.y / radius)
  }
}

/**
 * Normalize theta to [-π, π] range
 * @param theta - Azimuthal angle
 * @returns Normalized theta in [-π, π]
 */
export function normalizeTheta(theta: number): number {
  let normalized = theta % (2 * Math.PI)
  if (normalized > Math.PI) normalized -= 2 * Math.PI
  if (normalized < -Math.PI) normalized += 2 * Math.PI
  return normalized
}

/**
 * Clamp phi to [0, π] range
 * @param phi - Polar angle
 * @returns Clamped phi in [0, π]
 */
export function clampPhi(phi: number): number {
  return Math.max(0, Math.min(Math.PI, phi))
}

/**
 * Check if polygon crosses the seam at theta = ±π
 * @param points - Array of spherical points
 * @returns true if polygon crosses the seam
 */
export function crossesSeam(points: SphericalPoint[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const delta = Math.abs(points[i].theta - points[i + 1].theta)
    if (delta > Math.PI) return true
  }
  return false
}
