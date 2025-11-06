import { Canvas } from '@react-three/fiber'
import { PanoramaSphere } from './PanoramaSphere'
import { CAMERA_CONFIG } from '@/lib/config'
import type { PanoramaData } from '@/types'

/**
 * PanoramaViewer Component
 *
 * Main viewer for displaying 360° panoramic images using Three.js.
 * Uses React Three Fiber for declarative 3D rendering.
 *
 * Features:
 * - Supports both equirectangular and cubic panoramas
 * - OrbitControls for camera rotation and zoom
 * - Texture loading and disposal
 * - Responsive to window resize
 */

interface PanoramaViewerProps {
  /**
   * Panorama data (equirectangular or cubic)
   */
  panorama?: PanoramaData

  /**
   * Current node ID for hotspot management
   */
  nodeId?: string

  /**
   * Loading state indicator
   */
  isLoading?: boolean
}

export function PanoramaViewer({ panorama, nodeId, isLoading = false }: PanoramaViewerProps) {
  return (
    <div className="relative h-full w-full">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading panorama...</p>
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
        {/* Ambient light for proper visibility */}
        <ambientLight intensity={1} />

        {/* Panorama sphere/box with texture and hotspots */}
        <PanoramaSphere panorama={panorama} nodeId={nodeId} />
      </Canvas>

      {/* No panorama placeholder */}
      {!panorama && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No panorama loaded</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the test loader to load a cubic panorama
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
