/**
 * Polygon triangulation utilities for hotspot rendering
 * Uses earcut algorithm for triangulation on sphere surface
 */

import * as THREE from 'three'
import earcut from 'earcut'
import type { SphericalPoint } from '@/types'
import { sphericalToCartesian } from './coordinates'
import { SPHERE_CONFIG } from './config'

/**
 * Triangulate a spherical polygon for rendering as a mesh
 *
 * Algorithm:
 * 1. Convert spherical points to 3D cartesian
 * 2. Project onto tangent plane at polygon centroid
 * 3. Triangulate in 2D using earcut
 * 4. Map triangulated vertices back to sphere surface
 *
 * @param polygon - Array of spherical points defining the polygon
 * @returns BufferGeometry ready for rendering
 */
export function triangulateSphericalPolygon(polygon: SphericalPoint[]): THREE.BufferGeometry {
  if (polygon.length < 3) {
    throw new Error('Polygon must have at least 3 points')
  }

  // Convert to 3D points on sphere surface
  const vertices3D = polygon.map((p) =>
    sphericalToCartesian(p, SPHERE_CONFIG.HOTSPOT_RADIUS)
  )

  // Calculate centroid for tangent plane
  const centroid = new THREE.Vector3()
  vertices3D.forEach((v) => centroid.add(v))
  centroid.divideScalar(vertices3D.length).normalize()

  // Create local coordinate system at centroid
  const normal = centroid.clone()
  const tangent = new THREE.Vector3(0, 1, 0).cross(normal).normalize()
  if (tangent.lengthSq() < 0.01) {
    // If normal is aligned with Y axis, use different tangent
    tangent.set(1, 0, 0).cross(normal).normalize()
  }
  const bitangent = normal.clone().cross(tangent).normalize()

  // Project vertices onto tangent plane (2D)
  const vertices2D: number[] = []
  vertices3D.forEach((v) => {
    const relative = v.clone().sub(centroid.clone().multiplyScalar(SPHERE_CONFIG.HOTSPOT_RADIUS))
    const u = relative.dot(tangent)
    const v2d = relative.dot(bitangent)
    vertices2D.push(u, v2d)
  })

  // Triangulate using earcut
  const indices = earcut(vertices2D)

  // Create geometry with original 3D vertices
  const geometry = new THREE.BufferGeometry()

  // Positions - use original sphere surface vertices
  const positions = new Float32Array(vertices3D.length * 3)
  vertices3D.forEach((v, i) => {
    positions[i * 3] = v.x
    positions[i * 3 + 1] = v.y
    positions[i * 3 + 2] = v.z
  })

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}
