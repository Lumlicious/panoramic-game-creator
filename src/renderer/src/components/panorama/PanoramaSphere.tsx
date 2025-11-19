import { useEffect, useState, useRef } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SPHERE_CONFIG, CAMERA_CONFIG } from '@/lib/config'
import { cartesianToSpherical } from '@/lib/coordinates'
import { validatePolygon } from '@/lib/validation'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { HotspotDrawing } from './HotspotDrawing'
import { HotspotMesh } from './HotspotMesh'
import { VertexMarkers } from './VertexMarkers'
import type { PanoramaData, SphericalPoint } from '@/types'

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
  nodeId?: string // Current node ID for creating hotspots
}

export function PanoramaSphere({ panorama, nodeId }: PanoramaSphereProps) {
  const [loadedTexture, setLoadedTexture] = useState<THREE.Texture | THREE.Texture[] | null>(null)
  const [geometryType, setGeometryType] = useState<'sphere' | 'box' | null>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const controlsRef = useRef<any>(null)

  // Get drawing mode from editor store
  const drawingMode = useEditorStore((state) => state.drawingMode)
  const setDrawingMode = useEditorStore((state) => state.setDrawingMode)
  const selectedHotspotId = useEditorStore((state) => state.selectedHotspotId)
  const setSelectedHotspotId = useEditorStore((state) => state.setSelectedHotspotId)
  const setDirty = useEditorStore((state) => state.setDirty)

  // Get project store functions
  const addHotspot = useProjectStore((state) => state.addHotspot)
  const removeHotspot = useProjectStore((state) => state.removeHotspot)
  const updateHotspot = useProjectStore((state) => state.updateHotspot)

  // Subscribe to the current node so component re-renders when it changes
  const currentNode = useProjectStore((state) =>
    nodeId ? state.nodes.find((n) => n.id === nodeId) : undefined
  )
  const hotspots = currentNode?.hotspots || []

  // Get selected hotspot for editing
  const selectedHotspot = hotspots.find((h) => h.id === selectedHotspotId)

  // Debug: Log when selectedHotspot polygon changes
  useEffect(() => {
    if (selectedHotspot) {
      console.log('selectedHotspot polygon updated:', selectedHotspot.polygon)
    }
  }, [selectedHotspot?.polygon])

  // Track points being drawn (temporary state during drawing)
  const [drawingPoints, setDrawingPoints] = useState<SphericalPoint[]>([])

  // Track hovered hotspot
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null)

  // Handle vertex update during editing
  const handleVertexUpdate = (vertexIndex: number, newPoint: SphericalPoint) => {
    console.log('handleVertexUpdate called:', vertexIndex, newPoint)
    if (!selectedHotspot || !nodeId) {
      console.log('No selectedHotspot or nodeId')
      return
    }

    const newPolygon = [...selectedHotspot.polygon]
    newPolygon[vertexIndex] = newPoint

    // Validate the updated polygon
    const validation = validatePolygon(newPolygon)
    console.log('Validation result:', validation)
    if (!validation.valid) {
      console.warn('Vertex update would create invalid polygon:', validation.error)
      // Don't apply the update if it would make the polygon invalid
      return
    }

    console.log('Calling updateHotspot')
    updateHotspot(nodeId, selectedHotspot.id, { polygon: newPolygon })
    setDirty(true)
  }

  // Keyboard shortcuts for drawing
  useKeyboardShortcuts({
    onEnter: () => {
      if (drawingMode === 'drawing' && drawingPoints.length >= 3 && nodeId) {
        console.log('Finishing polygon with', drawingPoints.length, 'points')
        console.log('Points:', drawingPoints)

        // Validate polygon before creating hotspot
        const validation = validatePolygon(drawingPoints)
        if (!validation.valid) {
          console.error('Polygon validation failed:', validation.error)
          // TODO: Show toast notification with error
          return
        }

        // Create hotspot in projectStore
        const hotspot = addHotspot(nodeId, drawingPoints)
        if (hotspot) {
          console.log('Created hotspot:', hotspot.id)
          setDirty(true)
        }

        setDrawingPoints([])
        setDrawingMode('select')
      } else if (drawingMode === 'drawing' && drawingPoints.length < 3) {
        console.log('Need at least 3 points to finish polygon')
      }
    },
    onEscape: () => {
      if (drawingMode === 'drawing') {
        console.log('Canceling drawing mode')
        setDrawingPoints([])
        setDrawingMode('select')
      }
    },
    onDelete: () => {
      if (selectedHotspotId && nodeId) {
        console.log('Deleting hotspot:', selectedHotspotId)
        removeHotspot(nodeId, selectedHotspotId)
        setSelectedHotspotId(null)
      }
    }
  })

  // Handle click on sphere
  const handleSphereClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    // Get the 3D intersection point
    const point = event.point

    // Convert to spherical coordinates
    const spherical = cartesianToSpherical(point)

    // If in drawing mode, add point to polygon
    if (drawingMode === 'drawing') {
      setDrawingPoints((prev) => {
        const newPoints = [...prev, spherical]
        console.log(`Point ${newPoints.length} added:`, {
          theta: spherical.theta.toFixed(4),
          phi: spherical.phi.toFixed(4)
        })
        return newPoints
      })
    } else {
      // Otherwise just log for testing
      console.log('Sphere clicked at:')
      console.log('  Cartesian:', { x: point.x.toFixed(2), y: point.y.toFixed(2), z: point.z.toFixed(2) })
      console.log('  Spherical:', {
        theta: spherical.theta.toFixed(4),
        phi: spherical.phi.toFixed(4),
        thetaDeg: (spherical.theta * 180 / Math.PI).toFixed(2) + '°',
        phiDeg: (spherical.phi * 180 / Math.PI).toFixed(2) + '°'
      })
    }
  }

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
          ref={meshRef}
          scale={geometryType === 'sphere' ? [-1, 1, 1] : [1, 1, 1]}
          material={geometryType === 'box' ? cubicMaterials : undefined}
          onClick={handleSphereClick}
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

      {/* Render existing hotspots */}
      {hotspots.map((hotspot) => (
        <HotspotMesh
          key={hotspot.id}
          hotspot={hotspot}
          isSelected={selectedHotspotId === hotspot.id}
          isHovered={hoveredHotspotId === hotspot.id}
          onClick={() => {
            console.log('Hotspot clicked:', hotspot.id)
            setSelectedHotspotId(hotspot.id)
          }}
          onPointerEnter={() => {
            setHoveredHotspotId(hotspot.id)
          }}
          onPointerLeave={() => {
            setHoveredHotspotId(null)
          }}
        />
      ))}

      {/* Drawing overlay - show point markers and lines */}
      <HotspotDrawing points={drawingPoints} />

      {/* Vertex markers for editing selected hotspot */}
      {selectedHotspot && (
        <VertexMarkers
          points={selectedHotspot.polygon}
          onUpdateVertex={handleVertexUpdate}
          sphereMesh={meshRef.current || undefined}
          onDragStart={() => {
            if (controlsRef.current) {
              controlsRef.current.enabled = false
            }
          }}
          onDragEnd={() => {
            if (controlsRef.current) {
              controlsRef.current.enabled = true
            }
          }}
        />
      )}

      {/* OrbitControls */}
      <OrbitControls
        ref={controlsRef}
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
