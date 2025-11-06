/**
 * Hotspot Geometry Utilities
 *
 * Functions for creating 3D hotspot meshes from spherical coordinates.
 * Uses earcut for polygon triangulation on tangent plane projection.
 */

import * as THREE from 'three'
import earcut from 'earcut'
import { SphericalPoint, HotspotStyle } from '@/types'
import { sphericalToCartesian } from './coordinates'
import { SPHERE_CONFIG } from './config'

/**
 * Create a 3D mesh for a hotspot polygon on the sphere surface
 *
 * Algorithm:
 * 1. Convert spherical coords to 3D cartesian
 * 2. Calculate centroid and normal (for tangent plane)
 * 3. Create tangent plane coordinate system (U, V axes)
 * 4. Project 3D points to 2D tangent plane
 * 5. Triangulate using earcut
 * 6. Map triangulated vertices back to 3D
 * 7. Create BufferGeometry with material
 *
 * @param sphericalPoints - Polygon vertices in spherical coordinates
 * @param style - Visual style for the hotspot
 * @returns THREE.Mesh of the hotspot
 */
export function createHotspotMesh(
  sphericalPoints: SphericalPoint[],
  style: HotspotStyle
): THREE.Mesh {
  // 1. Convert to 3D cartesian at hotspot radius (slightly inside sphere to prevent z-fighting)
  const cartesianPoints = sphericalPoints.map((p) =>
    sphericalToCartesian(p, SPHERE_CONFIG.HOTSPOT_RADIUS)
  )

  // 2. Calculate centroid (average position)
  const centroid = new THREE.Vector3()
  cartesianPoints.forEach((p) => centroid.add(p))
  centroid.divideScalar(cartesianPoints.length)

  // Normal vector points from origin to centroid (perpendicular to tangent plane)
  const normal = centroid.clone().normalize()

  // 3. Create tangent plane coordinate system
  // We need two perpendicular vectors (U and V) in the tangent plane
  const tangentU = new THREE.Vector3()
  const tangentV = new THREE.Vector3()

  // Choose arbitrary vector not parallel to normal
  const arbitrary =
    Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)

  // U is perpendicular to both normal and arbitrary
  tangentU.crossVectors(normal, arbitrary).normalize()
  // V is perpendicular to both normal and U
  tangentV.crossVectors(normal, tangentU).normalize()

  // 4. Project 3D points to 2D tangent plane
  const points2D: number[] = []
  cartesianPoints.forEach((point) => {
    // Get vector from centroid to point
    const localPoint = point.clone().sub(centroid)
    // Project onto tangent plane axes
    const u = localPoint.dot(tangentU)
    const v = localPoint.dot(tangentV)
    points2D.push(u, v)
  })

  // 5. Triangulate using earcut
  const triangles = earcut(points2D)

  // 6. Create geometry from triangulated mesh
  const vertices: number[] = []
  for (let i = 0; i < triangles.length; i++) {
    const idx = triangles[i]
    const point = cartesianPoints[idx]
    vertices.push(point.x, point.y, point.z)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()

  // 7. Create material
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(style.fillColor),
    transparent: true,
    opacity: style.opacity,
    side: THREE.DoubleSide,
    depthWrite: false // Prevent z-fighting
  })

  const mesh = new THREE.Mesh(geometry, material)

  return mesh
}

/**
 * Create an outline (stroke) for a hotspot polygon
 *
 * @param sphericalPoints - Polygon vertices in spherical coordinates
 * @param style - Visual style for the outline
 * @returns THREE.Line for the polygon outline
 */
export function createHotspotOutline(
  sphericalPoints: SphericalPoint[],
  style: HotspotStyle
): THREE.Line {
  const cartesianPoints = sphericalPoints.map((p) =>
    sphericalToCartesian(p, SPHERE_CONFIG.HOTSPOT_RADIUS)
  )

  // Close the loop by adding first point at the end
  const vertices: number[] = []
  ;[...cartesianPoints, cartesianPoints[0]].forEach((p) => {
    vertices.push(p.x, p.y, p.z)
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(style.strokeColor),
    linewidth: style.strokeWidth,
    transparent: true,
    opacity: style.opacity
  })

  return new THREE.Line(geometry, material)
}
