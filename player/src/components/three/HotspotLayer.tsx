/**
 * HotspotLayer Component
 *
 * Renders all hotspots for the current node and handles click navigation
 */

import type { GameHotspot } from '@/types'
import * as THREE from 'three'
import { HotspotMesh } from './HotspotMesh'

interface HotspotLayerProps {
  /**
   * Array of hotspots to render
   */
  hotspots: GameHotspot[]

  /**
   * Callback when a hotspot is clicked
   */
  onHotspotClick?: (
    hotspot: GameHotspot,
    cameraPosition: THREE.Vector3,
    clickPoint: THREE.Vector3
  ) => void
}

export function HotspotLayer({ hotspots, onHotspotClick }: HotspotLayerProps): JSX.Element {
  return (
    <>
      {hotspots.map((hotspot) => (
        <HotspotMesh key={hotspot.id} hotspot={hotspot} onClick={onHotspotClick} />
      ))}
    </>
  )
}
