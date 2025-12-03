/**
 * PanoramaSphere Component
 *
 * Renders 360° panoramic imagery (read-only, no editing)
 * Simplified version of editor's PanoramaSphere
 *
 * Features:
 * - Equirectangular panorama support (sphere geometry)
 * - Cubic panorama support (box geometry with 6 face textures)
 * - OrbitControls for camera rotation
 * - Texture loading and disposal
 */

import { useEffect, useState, useRef, useMemo } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SPHERE_CONFIG } from '@/lib/config'
import type { CubicFaces } from '@/types/game'

interface PanoramaSphereProps {
  /**
   * Panorama type
   */
  type: 'equirectangular' | 'cubic'

  /**
   * URL to panorama texture (for equirectangular)
   */
  textureUrl?: string

  /**
   * Face URLs for cubic panorama
   */
  cubicFaces?: CubicFaces

  /**
   * Callback when sphere is clicked (for debugging)
   */
  onClick?: (point: THREE.Vector3) => void
}

export function PanoramaSphere({ type, textureUrl, cubicFaces, onClick }: PanoramaSphereProps) {
  const [loadedTexture, setLoadedTexture] = useState<THREE.Texture | null>(null)
  const [cubicTextures, setCubicTextures] = useState<THREE.Texture[] | null>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  // Load equirectangular texture
  useEffect(() => {
    if (type !== 'equirectangular' || !textureUrl) {
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
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter

        setLoadedTexture((prev) => {
          prev?.dispose()
          return texture
        })
      },
      undefined,
      (error) => {
        console.error('[PanoramaSphere] Error loading equirectangular texture:', {
          url: textureUrl,
          error: error
        })
      }
    )
  }, [type, textureUrl])

  // Load cubic textures (6 faces)
  useEffect(() => {
    if (type !== 'cubic' || !cubicFaces) {
      setCubicTextures((prev) => {
        prev?.forEach((t) => t.dispose())
        return null
      })
      return
    }

    const loader = new THREE.TextureLoader()

    // Match editor's face order: [left, right, top, bottom, front, back]
    // BoxGeometry faces order: [+X, -X, +Y, -Y, +Z, -Z]
    // When viewing from inside, left and right are swapped
    const faceUrls = [
      cubicFaces.left, // +X
      cubicFaces.right, // -X
      cubicFaces.top, // +Y
      cubicFaces.bottom, // -Y
      cubicFaces.front, // +Z
      cubicFaces.back // -Z
    ]

    // Track loading state
    const textures: THREE.Texture[] = []
    let loadedCount = 0
    let hasError = false
    let isCancelled = false // Track if effect was cleaned up

    // Helper to dispose all loaded textures
    const disposeAllTextures = () => {
      textures.forEach((t) => t?.dispose())
      textures.length = 0
    }

    faceUrls.forEach((url, index) => {
      loader.load(
        url,
        (texture) => {
          // If effect was cleaned up or already errored, dispose immediately
          if (isCancelled || hasError) {
            texture.dispose()
            return
          }

          texture.colorSpace = THREE.SRGBColorSpace
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter

          // Flip texture horizontally to fix mirroring when viewed from inside
          // Apply same transformation to ALL faces (matching editor behavior)
          texture.wrapS = THREE.RepeatWrapping
          texture.repeat.x = -1
          texture.offset.x = 1

          textures[index] = texture
          loadedCount++

          if (loadedCount === 6) {
            setCubicTextures((prev) => {
              prev?.forEach((t) => t.dispose())
              return textures
            })
          }
        },
        undefined,
        (error) => {
          // On first error, dispose any already-loaded textures
          if (!hasError) {
            hasError = true
            disposeAllTextures()
            console.error('[PanoramaSphere] Error loading cubic face:', {
              url,
              index,
              error
            })
          }
        }
      )
    })

    // Cleanup: dispose textures if effect re-runs before loading completes
    return () => {
      isCancelled = true
      // Only dispose if textures weren't transferred to state
      // (setCubicTextures would have already been called if loadedCount === 6)
      if (loadedCount < 6) {
        disposeAllTextures()
      }
    }
  }, [type, cubicFaces])

  // Dispose textures on unmount
  useEffect(() => {
    return () => {
      loadedTexture?.dispose()
      cubicTextures?.forEach((t) => t.dispose())
    }
  }, [loadedTexture, cubicTextures])

  // Handle click on mesh
  const handleClick = (event: any) => {
    if (onClick && event.point) {
      onClick(event.point)
    }
  }

  // Render equirectangular panorama (sphere)
  if (type === 'equirectangular' && loadedTexture) {
    return (
      <>
        <mesh ref={meshRef} scale={[-1, 1, 1]} onClick={handleClick}>
          <sphereGeometry
            args={[SPHERE_CONFIG.RADIUS, SPHERE_CONFIG.SEGMENTS, SPHERE_CONFIG.SEGMENTS]}
          />
          <meshBasicMaterial side={THREE.BackSide} map={loadedTexture} />
        </mesh>
        <PanoramaControls />
      </>
    )
  }

  // Create materials for cubic panorama (memoized to avoid recreating on every render)
  const cubicMaterials = useMemo(() => {
    if (type !== 'cubic' || !cubicTextures || cubicTextures.length !== 6) {
      return null
    }
    return cubicTextures.map(
      (texture) => new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
    )
  }, [type, cubicTextures])

  // Cleanup cubic materials when they change or on unmount
  useEffect(() => {
    return () => {
      cubicMaterials?.forEach((mat) => mat.dispose())
    }
  }, [cubicMaterials])

  // Render cubic panorama (box with 6 materials)
  // Uses material prop directly on mesh - R3F properly handles material arrays
  if (type === 'cubic' && cubicMaterials) {
    return (
      <>
        <mesh ref={meshRef} material={cubicMaterials} onClick={handleClick}>
          <boxGeometry
            args={[SPHERE_CONFIG.RADIUS * 2, SPHERE_CONFIG.RADIUS * 2, SPHERE_CONFIG.RADIUS * 2]}
          />
        </mesh>
        <PanoramaControls />
      </>
    )
  }

  // Still loading - just render controls
  return <PanoramaControls />
}

/**
 * Shared OrbitControls component
 * Optimized for performance with smoother damping
 */
function PanoramaControls() {
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom={false}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.1} // Higher = more responsive (was 0.05)
      rotateSpeed={-0.4} // Slightly slower for smoother feel
      minPolarAngle={0.1} // Prevent looking straight up (reduces jitter)
      maxPolarAngle={Math.PI - 0.1} // Prevent looking straight down
      target={[0, 0, 0]}
    />
  )
}
