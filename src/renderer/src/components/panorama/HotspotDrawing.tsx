import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { SphericalPoint } from '@/types'
import { sphericalToCartesian } from '@/lib/coordinates'
import { SPHERE_CONFIG } from '@/lib/config'

/**
 * HotspotDrawing Component
 *
 * Renders temporary visual feedback while drawing a hotspot polygon:
 * - Point markers (small spheres) at each clicked location
 * - Lines connecting the points
 */

interface HotspotDrawingProps {
  /**
   * Points being drawn (in spherical coordinates)
   */
  points: SphericalPoint[]
}

export function HotspotDrawing({ points }: HotspotDrawingProps) {
  if (points.length === 0) return null

  // Convert spherical points to 3D cartesian for rendering
  const cartesianPoints = points.map((p) =>
    sphericalToCartesian(p, SPHERE_CONFIG.HOTSPOT_RADIUS)
  )

  return (
    <group>
      {/* Render point markers */}
      {cartesianPoints.map((point, index) => (
        <mesh key={index} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[3, 16, 16]} />
          <meshBasicMaterial
            color="#00ff00"
            opacity={0.9}
            transparent
            depthTest={false}
          />
        </mesh>
      ))}

      {/* Render lines connecting points */}
      {points.length > 1 && <PointLines points={cartesianPoints} />}
    </group>
  )
}

/**
 * PointLines Component
 *
 * Renders lines connecting the drawn points
 */
function PointLines({ points }: { points: THREE.Vector3[] }) {
  // Create line geometry - memoized to prevent unnecessary recreation
  const geometry = useMemo(() => {
    const linePoints: THREE.Vector3[] = [...points]

    // Close the loop if we have 3+ points (show preview of polygon)
    if (points.length >= 3) {
      linePoints.push(points[0])
    }

    const positions = new Float32Array(linePoints.flatMap((p) => [p.x, p.y, p.z]))
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    return geometry
  }, [points])

  // Cleanup: dispose geometry when component unmounts or geometry changes
  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color="#00ff00"
        linewidth={2}
        opacity={0.8}
        transparent
        depthTest={false}
      />
    </line>
  )
}
