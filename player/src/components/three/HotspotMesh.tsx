/**
 * HotspotMesh Component
 *
 * Renders a single clickable hotspot on the panorama sphere
 */

import { useMemo } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { GameHotspot } from '@/types'
import { triangulateSphericalPolygon } from '@/lib/triangulation'

interface HotspotMeshProps {
  hotspot: GameHotspot
  onClick?: (hotspot: GameHotspot, cameraPosition: THREE.Vector3, clickPoint: THREE.Vector3) => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}

export function HotspotMesh({
  hotspot,
  onClick,
  onPointerEnter,
  onPointerLeave
}: HotspotMeshProps) {
  // Triangulate polygon geometry (memoized)
  const geometry = useMemo(() => {
    if (hotspot.polygon.length < 3) return null
    try {
      return triangulateSphericalPolygon(hotspot.polygon)
    } catch (error) {
      console.error('Failed to triangulate hotspot:', hotspot.id, error)
      return null
    }
  }, [hotspot.polygon])

  if (!geometry) return null

  // Handle click
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    const cameraPos = event.camera?.position?.clone?.()
    const clickPoint = event.point?.clone?.()
    onClick?.(
      hotspot,
      cameraPos ?? new THREE.Vector3(0, 0, 0.1),
      clickPoint ?? new THREE.Vector3(0, 0, 1)
    )
  }

  // Handle hover - cursor only, no visual change
  const handlePointerEnter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onPointerEnter?.()
    document.body.style.cursor = 'pointer'
  }

  const handlePointerLeave = () => {
    onPointerLeave?.()
    document.body.style.cursor = 'auto'
  }

  return (
    <mesh
      geometry={geometry}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}
