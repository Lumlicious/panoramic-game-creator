/**
 * GameEngine Component
 *
 * Top-level game coordinator that manages:
 * - Game data loading
 * - Navigation between nodes
 * - Hotspot click handling
 * - Game state management
 */

import { useEffect, useMemo } from 'react'
import { PanoramaView } from './PanoramaView'
import { useGameStore } from '@/stores/gameStore'
import type { GameData, GameHotspot } from '@/types'

interface GameEngineProps {
  /**
   * Game data (loaded from game.json)
   */
  gameData: GameData

  /**
   * Optional initial node ID (defaults to startNodeId from settings)
   */
  initialNodeId?: string

  /**
   * Optional callback when navigation occurs
   */
  onNavigate?: (nodeId: string) => void
}

export function GameEngine({ gameData, initialNodeId, onNavigate }: GameEngineProps) {
  const currentNodeId = useGameStore((state) => state.currentNodeId)
  const isLoading = useGameStore((state) => state.isLoading)
  const navigate = useGameStore((state) => state.navigate)
  const setLoading = useGameStore((state) => state.setLoading)

  // Find current node from game data
  const currentNode = useMemo(() => {
    return gameData.nodes.find((node) => node.id === currentNodeId)
  }, [gameData.nodes, currentNodeId])

  // Initialize game with start node
  useEffect(() => {
    const startNodeId = initialNodeId || gameData.settings.startNodeId
    if (startNodeId && !currentNodeId) {
      navigate(startNodeId)
    }
  }, [initialNodeId, gameData.settings.startNodeId, currentNodeId, navigate])

  // Handle hotspot click navigation
  const handleHotspotClick = (hotspot: GameHotspot) => {
    if (!hotspot.targetNodeId) {
      console.warn('Hotspot has no target node:', hotspot.name)
      return
    }

    // Simulate loading delay for better UX
    setLoading(true)
    setTimeout(() => {
      navigate(hotspot.targetNodeId!)
      onNavigate?.(hotspot.targetNodeId!)
      setLoading(false)
    }, 300)
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <PanoramaView
        currentNode={currentNode}
        isLoading={isLoading}
        onHotspotClick={handleHotspotClick}
      />

      {/* Debug info (top-left overlay) */}
      {currentNode && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: 4,
            fontSize: 14,
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 100
          }}
        >
          <div>Node: {currentNode.name}</div>
          <div>Hotspots: {currentNode.hotspots.length}</div>
        </div>
      )}
    </div>
  )
}
