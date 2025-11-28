/**
 * App Component
 *
 * Main application entry point
 * For testing: loads sample game data
 * In production: loads game.json from assets
 */

import { useState, useEffect } from 'react'
import { GameEngine } from './components/GameEngine'
import type { GameData } from './types'

// Sample game data for testing
const SAMPLE_GAME_DATA: GameData = {
  version: '1.0.0',
  settings: {
    title: 'Sample Panoramic Game',
    startNodeId: 'node-1'
  },
  nodes: [
    {
      id: 'node-1',
      name: 'Start Location',
      panorama: {
        type: 'equirectangular',
        url: '/assets/panoramas/node-1.jpg' // Vite serves public/ files from root
      },
      hotspots: [
        {
          id: 'hotspot-1',
          name: 'Go to Room 2',
          polygon: [
            { theta: 0.5, phi: 1.3 },
            { theta: 0.7, phi: 1.3 },
            { theta: 0.7, phi: 1.7 },
            { theta: 0.5, phi: 1.7 }
          ],
          targetNodeId: 'node-2',
          interactionType: 'navigate'
        }
      ]
    },
    {
      id: 'node-2',
      name: 'Second Location',
      panorama: {
        type: 'equirectangular',
        url: '/assets/panoramas/node-2.jpg' // Vite serves public/ files from root
      },
      hotspots: [
        {
          id: 'hotspot-2',
          name: 'Back to Start',
          polygon: [
            { theta: -0.5, phi: 1.3 },
            { theta: -0.3, phi: 1.3 },
            { theta: -0.3, phi: 1.7 },
            { theta: -0.5, phi: 1.7 }
          ],
          targetNodeId: 'node-1',
          interactionType: 'navigate'
        }
      ]
    }
  ]
}

export function App() {
  const [gameData, setGameData] = useState<GameData | null>(null)

  useEffect(() => {
    // Try to load game.json from assets
    fetch('/assets/data/game.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load game data')
        }
        return response.json()
      })
      .then((data: GameData) => {
        setGameData(data)
      })
      .catch((err) => {
        console.warn('Could not load game.json, falling back to sample data:', err)
        // Fallback to sample data for testing
        setGameData(SAMPLE_GAME_DATA)
      })
  }, [])

  if (!gameData) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
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
          <p>Loading game data...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return <GameEngine gameData={gameData} />
}
