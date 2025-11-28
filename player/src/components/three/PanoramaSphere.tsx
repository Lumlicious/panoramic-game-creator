/**
 * PanoramaSphere Component
 *
 * Renders 360° panoramic sphere with texture (read-only, no editing)
 * Simplified version of editor's PanoramaSphere
 *
 * Features:
 * - Equirectangular panorama support
 * - OrbitControls for camera rotation
 * - Texture loading and disposal
 */

import { useEffect, useState, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SPHERE_CONFIG } from '@/lib/config'

interface PanoramaSphereProps {
  /**
   * URL to panorama texture (relative or absolute)
   */
  textureUrl?: string

  /**
   * Callback when sphere is clicked (for debugging)
   */
  onClick?: (point: THREE.Vector3) => void
}

export function PanoramaSphere({ textureUrl, onClick }: PanoramaSphereProps) {
  const [loadedTexture, setLoadedTexture] = useState<THREE.Texture | null>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  // Load texture when URL changes
  useEffect(() => {
    if (!textureUrl) {
      setLoadedTexture((prev) => {
        prev?.dispose()
        return null
      })
      return
    }

    const loader = new THREE.TextureLoader()
    loader.load(
      textureUrl,
      (texture) => {
        // Configure texture
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter

        // Dispose old texture and set new one
        setLoadedTexture((prev) => {
          prev?.dispose()
          return texture
        })
      },
      undefined, // Progress callback - not needed
      (error) => {
        console.error('[PanoramaSphere] Error loading texture:', {
          url: textureUrl,
          error: error
        })
      }
    )
  }, [textureUrl])

  // Dispose texture on unmount
  useEffect(() => {
    return () => {
      loadedTexture?.dispose()
    }
  }, [loadedTexture])

  // Handle click on sphere
  const handleClick = (event: any) => {
    if (onClick && event.point) {
      onClick(event.point)
    }
  }

  return (
    <>
      {/* Panorama Sphere - Only render when texture is loaded */}
      {loadedTexture && (
        <mesh
          ref={meshRef}
          scale={[-1, 1, 1]} // Invert to view from inside
          onClick={handleClick}
        >
          <sphereGeometry
            args={[SPHERE_CONFIG.RADIUS, SPHERE_CONFIG.SEGMENTS, SPHERE_CONFIG.SEGMENTS]}
          />
          <meshBasicMaterial side={THREE.BackSide} map={loadedTexture} />
        </mesh>
      )}

      {/* OrbitControls for camera rotation */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={-0.5}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        target={[0, 0, 0]}
      />
    </>
  )
}
