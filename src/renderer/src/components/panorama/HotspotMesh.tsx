import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { Hotspot } from '@/types'
import { createHotspotMesh, createHotspotOutline } from '@/lib/hotspotGeometry'

/**
 * HotspotMesh Component
 *
 * Renders a single hotspot as a 3D mesh with fill and outline.
 * Uses earcut triangulation to create geometry from polygon points.
 */

interface HotspotMeshProps {
  hotspot: Hotspot
  isSelected?: boolean
  isHovered?: boolean
  onClick?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}

export function HotspotMesh({
  hotspot,
  isSelected = false,
  isHovered = false,
  onClick,
  onPointerEnter,
  onPointerLeave
}: HotspotMeshProps) {
  // Create mesh geometry - memoized to prevent unnecessary recreation
  const mesh = useMemo(() => {
    return createHotspotMesh(hotspot.polygon, hotspot.style)
  }, [hotspot.polygon, hotspot.style])

  // Create outline - memoized
  const outline = useMemo(() => {
    return createHotspotOutline(hotspot.polygon, hotspot.style)
  }, [hotspot.polygon, hotspot.style])

  // Cleanup: dispose mesh geometry and material when component unmounts or mesh changes
  useEffect(() => {
    return () => {
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose())
        } else {
          mesh.material.dispose()
        }
      }
    }
  }, [mesh])

  // Cleanup: dispose outline geometry and material
  useEffect(() => {
    return () => {
      if (outline.geometry) outline.geometry.dispose()
      if (outline.material) {
        if (Array.isArray(outline.material)) {
          outline.material.forEach((mat) => mat.dispose())
        } else {
          outline.material.dispose()
        }
      }
    }
  }, [outline])

  // Adjust opacity based on hover/select state
  const fillOpacity = isHovered ? Math.min(hotspot.style.opacity * 1.5, 1.0) : hotspot.style.opacity

  // Update material opacity for hover
  if (mesh.material instanceof THREE.Material) {
    mesh.material.opacity = fillOpacity
  }

  return (
    <group>
      {/* Fill mesh */}
      <primitive
        object={mesh}
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      />

      {/* Outline */}
      <primitive object={outline} />

      {/* Selection highlight */}
      {isSelected && (
        <primitive object={outline.clone()}>
          <lineBasicMaterial color="#ffff00" linewidth={3} />
        </primitive>
      )}
    </group>
  )
}
