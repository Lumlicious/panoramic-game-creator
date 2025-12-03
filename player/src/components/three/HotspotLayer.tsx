/**
 * HotspotLayer Component
 *
 * Renders all hotspots for the current node and handles click navigation
 */

import type { GameHotspot } from '@/types'
import { HotspotMesh } from './HotspotMesh'

interface HotspotLayerProps {
  /**
   * Array of hotspots to render
   */
  hotspots: GameHotspot[]

  /**
   * Callback when a hotspot is clicked
   */
  onHotspotClick?: (hotspot: GameHotspot) => void
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
