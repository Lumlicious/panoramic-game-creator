/**
 * PanoramaView Component
 *
 * Three.js canvas container for panorama rendering
 * Displays the current node's panorama and hotspots
 */

import { useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { PanoramaSphere } from './three/PanoramaSphere'
import { HotspotLayer } from './three/HotspotLayer'
import { CAMERA_CONFIG } from '@/lib/config'
import type { GameNode, GameHotspot } from '@/types'
import { useGameStore } from '@/stores/gameStore'
import * as THREE from 'three'

interface PanoramaViewProps {
  /**
   * Current node to display
   */
  currentNode?: GameNode

  /**
   * Loading state
   */
  isLoading?: boolean

  /**
   * Callback when hotspot is clicked
   */
  onHotspotClick?: (
    hotspot: GameHotspot,
    cameraPosition: THREE.Vector3,
    clickPoint: THREE.Vector3
  ) => void
}

export function PanoramaView({ currentNode, isLoading, onHotspotClick }: PanoramaViewProps) {
  // Keep camera initial config stable to avoid unintended resets on re-render
  const cameraConfig = useMemo(
    () => ({
      position: [0, 0, 0.1] as [number, number, number],
      fov: CAMERA_CONFIG.FOV,
      near: CAMERA_CONFIG.NEAR,
      far: CAMERA_CONFIG.FAR
    }),
    []
  )

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Loading overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 40,
                height: 40,
                margin: '0 auto 16px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <p>Loading panorama...</p>
          </div>
        </div>
      )}

      {/* Three.js Canvas */}
      <Canvas
        camera={cameraConfig}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]} // Limit pixel ratio for better performance on high-DPI screens
      >
        {/* Ambient light */}
        <ambientLight intensity={1} />

        {/* Panorama sphere with texture */}
        {currentNode && (
          <PanoramaSphere
            type={currentNode.panorama.type}
            textureUrl={currentNode.panorama.url}
            cubicFaces={currentNode.panorama.faces}
          />
        )}

        {/* Hotspots layer */}
        {currentNode && (
          <HotspotLayer hotspots={currentNode.hotspots} onHotspotClick={onHotspotClick} />
        )}

        {/* Controls + camera restore logic (must live inside Canvas) */}
        <PlayerControls currentNodeId={currentNode?.id ?? null} />
      </Canvas>

      {/* No panorama placeholder */}
      {!currentNode && !isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <p>No panorama loaded</p>
        </div>
      )}

      {/* CSS for loading spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function PlayerControls({ currentNodeId }: { currentNodeId: string | null }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const camera = useThree((s) => s.camera)

  const pending = useGameStore((s) => s.pendingCameraRestore)
  const clear = useGameStore((s) => s.clearCameraRestore)
  const setCameraPosition = useGameStore((s) => s.setCameraPosition)

  // After navigation, restore the camera position so the heading is preserved.
  useEffect(() => {
    if (!pending || !currentNodeId) return
    if (pending.nodeId !== currentNodeId) return

    camera.position.set(pending.position[0], pending.position[1], pending.position[2])
    camera.lookAt(0, 0, 0)
    controlsRef.current?.update?.()
    clear()
  }, [pending, currentNodeId, camera, clear])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableZoom={false}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.1}
      rotateSpeed={-0.4}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
      target={[0, 0, 0]}
      onChange={() => {
        // Track current camera position so hotspot clicks can queue the latest pose.
        setCameraPosition([camera.position.x, camera.position.y, camera.position.z])
      }}
    />
  )
}
