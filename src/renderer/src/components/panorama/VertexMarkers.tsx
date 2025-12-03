import { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { ThreeEvent, useThree } from '@react-three/fiber'
import { SphericalPoint } from '@/types'
import { sphericalToCartesian, cartesianToSpherical } from '@/lib/coordinates'
import { SPHERE_CONFIG } from '@/lib/config'

/**
 * VertexMarkers Component
 *
 * Renders draggable vertex markers for editing a selected hotspot.
 * Vertices can be dragged on the sphere surface to reshape the polygon.
 */

interface VertexMarkersProps {
  points: SphericalPoint[]
  onUpdateVertex: (index: number, newPoint: SphericalPoint) => void
  sphereMesh?: THREE.Mesh
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function VertexMarkers({
  points,
  onUpdateVertex,
  sphereMesh,
  onDragStart,
  onDragEnd
}: VertexMarkersProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const { camera, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())

  // Convert spherical points to 3D cartesian for rendering
  const cartesianPoints = points.map(
    (p) => sphericalToCartesian(p, SPHERE_CONFIG.HOTSPOT_RADIUS + 1) // Slightly outside to be visible
  )

  // Handle pointer move on canvas (attached via useEffect)
  const handleCanvasPointerMove = useCallback(
    (event: PointerEvent) => {
      console.log(
        'handleCanvasPointerMove called, draggingIndex:',
        draggingIndex,
        'sphereMesh:',
        !!sphereMesh
      )

      if (draggingIndex === null || !sphereMesh) return

      // Stop event from reaching OrbitControls
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      // Get normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Raycast to find intersection with sphere
      raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera)

      const intersects = raycaster.current.intersectObject(sphereMesh)
      console.log('Raycasting, intersects:', intersects.length)
      if (intersects.length > 0) {
        const newPosition = intersects[0].point
        const newSpherical = cartesianToSpherical(newPosition)
        console.log('Updating vertex', draggingIndex, 'to', newSpherical)
        onUpdateVertex(draggingIndex, newSpherical)
      }
    },
    [draggingIndex, sphereMesh, camera, gl.domElement, onUpdateVertex]
  )

  // Handle pointer up on canvas (attached via useEffect)
  const handleCanvasPointerUp = useCallback(
    (event: PointerEvent) => {
      if (draggingIndex === null) return

      // Stop event from reaching OrbitControls
      event.stopPropagation()
      event.stopImmediatePropagation()

      setDraggingIndex(null)
      onDragEnd?.()
    },
    [draggingIndex, onDragEnd]
  )

  // Attach canvas-level pointer listeners when dragging
  useEffect(() => {
    console.log('useEffect - draggingIndex changed to:', draggingIndex)
    if (draggingIndex === null) return

    const canvas = gl.domElement
    console.log('Attaching canvas listeners for dragging vertex', draggingIndex)

    // Use capture phase to intercept events before OrbitControls
    canvas.addEventListener('pointermove', handleCanvasPointerMove, { capture: true })
    canvas.addEventListener('pointerup', handleCanvasPointerUp, { capture: true })

    return () => {
      console.log('Removing canvas listeners')
      canvas.removeEventListener('pointermove', handleCanvasPointerMove, { capture: true })
      canvas.removeEventListener('pointerup', handleCanvasPointerUp, { capture: true })
    }
  }, [draggingIndex, handleCanvasPointerMove, handleCanvasPointerUp, gl.domElement])

  const handlePointerDown = (index: number, event: ThreeEvent<PointerEvent>) => {
    console.log('handlePointerDown - vertex', index)
    event.stopPropagation()
    // Stop DOM event from reaching OrbitControls
    event.nativeEvent?.stopImmediatePropagation()

    console.log('Setting draggingIndex to', index)
    setDraggingIndex(index)
    onDragStart?.()
  }

  return (
    <group>
      {cartesianPoints.map((point, index) => (
        <mesh
          key={index}
          position={[point.x, point.y, point.z]}
          onPointerDown={(e) => handlePointerDown(index, e)}
        >
          <sphereGeometry args={[4, 16, 16]} />
          <meshBasicMaterial
            color={draggingIndex === index ? '#ffff00' : '#ff0000'}
            opacity={0.9}
            transparent
            depthTest={false}
          />
        </mesh>
      ))}
    </group>
  )
}
