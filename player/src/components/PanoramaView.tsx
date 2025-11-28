/**
 * PanoramaView Component
 *
 * Three.js canvas container for panorama rendering
 * Displays the current node's panorama and hotspots
 */

import { Canvas } from '@react-three/fiber'
import { PanoramaSphere } from './three/PanoramaSphere'
import { HotspotLayer } from './three/HotspotLayer'
import { CAMERA_CONFIG } from '@/lib/config'
import type { GameNode, GameHotspot } from '@/types'

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
  onHotspotClick?: (hotspot: GameHotspot) => void
}

export function PanoramaView({ currentNode, isLoading, onHotspotClick }: PanoramaViewProps) {
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
        camera={{
          position: [0, 0, 0.1],
          fov: CAMERA_CONFIG.FOV,
          near: CAMERA_CONFIG.NEAR,
          far: CAMERA_CONFIG.FAR
        }}
        gl={{
          antialias: true,
          alpha: false
        }}
      >
        {/* Ambient light */}
        <ambientLight intensity={1} />

        {/* Panorama sphere with texture */}
        <PanoramaSphere textureUrl={currentNode?.panorama.url} />

        {/* Hotspots layer */}
        {currentNode && (
          <HotspotLayer hotspots={currentNode.hotspots} onHotspotClick={onHotspotClick} />
        )}
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
