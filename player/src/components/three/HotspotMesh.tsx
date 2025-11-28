/**
 * HotspotMesh Component
 *
 * Renders a single clickable hotspot on the panorama sphere
 */

import { useState, useMemo } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { GameHotspot } from '@/types'
import { triangulateSphericalPolygon } from '@/lib/triangulation'
import { HOTSPOT_STYLE } from '@/lib/config'

interface HotspotMeshProps {
  hotspot: GameHotspot
  onClick?: (hotspot: GameHotspot) => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}

export function HotspotMesh({
  hotspot,
  onClick,
  onPointerEnter,
  onPointerLeave
}: HotspotMeshProps) {
  const [isHovered, setIsHovered] = useState(false)

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
    onClick?.(hotspot)
  }

  // Handle hover
  const handlePointerEnter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsHovered(true)
    onPointerEnter?.()
    document.body.style.cursor = 'pointer'
  }

  const handlePointerLeave = () => {
    setIsHovered(false)
    onPointerLeave?.()
    document.body.style.cursor = 'auto'
  }

  // Dynamic opacity based on hover state
  const opacity = isHovered ? HOTSPOT_STYLE.hoverOpacity : HOTSPOT_STYLE.opacity

  return (
    <mesh
      geometry={geometry}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <meshBasicMaterial
        color={HOTSPOT_STYLE.fillColor}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
