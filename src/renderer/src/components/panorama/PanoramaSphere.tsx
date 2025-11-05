import { useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SPHERE_CONFIG, CAMERA_CONFIG } from '@/lib/config'
import type { PanoramaData } from '@/types'

/**
 * PanoramaSphere Component
 *
 * Renders 360° panoramic views supporting both:
 * - Equirectangular: Single image mapped to sphere with inverted normals
 * - Cubic: Six images (cube faces) mapped to box geometry
 *
 * Features:
 * - OrbitControls with proper constraints
 * - Automatic texture disposal on unmount
 * - Dynamic geometry switching based on panorama type
 */

interface PanoramaSphereProps {
  panorama?: PanoramaData
}

export function PanoramaSphere({ panorama }: PanoramaSphereProps) {
  const [loadedTexture, setLoadedTexture] = useState<THREE.Texture | THREE.Texture[] | null>(null)
  const [geometryType, setGeometryType] = useState<'sphere' | 'box' | null>(null)

  // Load texture when panorama changes
  useEffect(() => {
    // Clear previous texture when panorama changes
    setGeometryType(null)

    if (!panorama) {
      setLoadedTexture((prev) => {
        if (prev) {
          if (Array.isArray(prev)) {
            prev.forEach((t) => t.dispose())
          } else {
            prev.dispose()
          }
        }
        return null
      })
      return
    }

    // Handle Cubic Panoramas
    if (panorama.type === 'cubic' && panorama.faces) {
      const { front, back, left, right, top, bottom } = panorama.faces

      // For cubic skybox, we need 6 separate textures, one per face
      // BoxGeometry faces order: [+X, -X, +Y, -Y, +Z, -Z]
      // When viewing from inside, left and right are swapped
      const faceUrls = [left, right, top, bottom, front, back]

      const loader = new THREE.TextureLoader()
      const loadPromises = faceUrls.map((url) => {
        return new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(
            url,
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace
              texture.minFilter = THREE.LinearFilter
              texture.magFilter = THREE.LinearFilter

              // Flip texture horizontally to fix mirroring when viewed from inside
              texture.wrapS = THREE.RepeatWrapping
              texture.repeat.x = -1
              texture.offset.x = 1

              resolve(texture)
            },
            undefined,
            reject
          )
        })
      })

      Promise.all(loadPromises)
        .then((textures) => {
          // Store textures array - we'll use them to create materials
          setLoadedTexture((prev) => {
            if (prev) {
              // Dispose old textures if they exist
              if (Array.isArray(prev)) {
                prev.forEach((t) => t.dispose())
              } else {
                prev.dispose()
              }
            }
            // Store as array for cubic, or single texture for equirectangular
            return textures as any
          })
          setGeometryType('box')
        })
        .catch((error) => {
          console.error('Error loading cubic panorama:', error)
          setGeometryType(null)
        })
    }
    // Handle Equirectangular Panoramas
    else if (panorama.type === 'equirectangular' && panorama.filePath) {
      const loader = new THREE.TextureLoader()

      loader.load(
        panorama.filePath,
        (texture) => {
          // Configure texture
          texture.colorSpace = THREE.SRGBColorSpace
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter

          // Dispose old texture and set new one
          setLoadedTexture((prev) => {
            if (prev) {
              if (Array.isArray(prev)) {
                prev.forEach((t) => t.dispose())
              } else {
                prev.dispose()
              }
            }
            return texture
          })
          setGeometryType('sphere')
        },
        undefined,
        (error) => {
          console.error('Error loading equirectangular panorama:', error)
          setGeometryType(null)
        }
      )
    }
  }, [panorama])

  // Dispose texture on unmount
  useEffect(() => {
    return () => {
      if (loadedTexture) {
        if (Array.isArray(loadedTexture)) {
          loadedTexture.forEach((t) => t.dispose())
        } else {
          loadedTexture.dispose()
        }
      }
    }
  }, [loadedTexture])

  // Create materials for cubic panorama (memoize to avoid recreating on every render)
  const cubicMaterials = Array.isArray(loadedTexture)
    ? loadedTexture.map(
        (texture) =>
          new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
          })
      )
    : undefined

  // Cleanup materials on unmount or when textures change
  useEffect(() => {
    return () => {
      if (cubicMaterials) {
        cubicMaterials.forEach((mat) => mat.dispose())
      }
    }
  }, [cubicMaterials])

  return (
    <>
      {/* Panorama Mesh - Only render when texture is loaded */}
      {geometryType && loadedTexture && (
        <mesh
          scale={geometryType === 'sphere' ? [-1, 1, 1] : [1, 1, 1]}
          material={geometryType === 'box' ? cubicMaterials : undefined}
        >
          {/* Geometry switches based on panorama type */}
          {geometryType === 'sphere' && (
            <sphereGeometry
              args={[SPHERE_CONFIG.RADIUS, SPHERE_CONFIG.SEGMENTS, SPHERE_CONFIG.SEGMENTS]}
            />
          )}
          {geometryType === 'box' && <boxGeometry args={[1000, 1000, 1000]} />}

          {/* Material for sphere only (box uses material prop above) */}
          {geometryType === 'sphere' && !Array.isArray(loadedTexture) && (
            <meshBasicMaterial side={THREE.BackSide} map={loadedTexture} />
          )}
        </mesh>
      )}

      {/* OrbitControls */}
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

      {/* FOV Zoom Handler */}
      <FovZoomHandler />
    </>
  )
}

/**
 * FovZoomHandler Component
 *
 * Handles zoom by adjusting camera FOV instead of moving camera position.
 * Camera stays near origin for proper panorama viewing.
 */
function FovZoomHandler() {
  const { camera } = useThree()

  useFrame(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      // Constrain FOV to min/max range
      camera.fov = THREE.MathUtils.clamp(
        camera.fov,
        CAMERA_CONFIG.FOV_MIN,
        CAMERA_CONFIG.FOV_MAX
      )

      // Update projection matrix after FOV change
      camera.updateProjectionMatrix()

      // OrbitControls handles camera position, so we don't force it here
    }
  })

  return null
}
