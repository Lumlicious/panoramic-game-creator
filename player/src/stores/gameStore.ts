/**
 * Game state management using Zustand
 */

import { create } from 'zustand'
import type { GameState, InventoryItem } from '@/types'

export const useGameStore = create<GameState>((set) => ({
  // Navigation
  currentNodeId: '',
  previousNodeId: null,

  // Progress tracking
  visitedNodes: new Set(),

  // Loading state
  isLoading: false,

  // Future features
  inventory: [],
  gameVariables: {},

  // Actions
  navigate: (nodeId: string) =>
    set((state) => ({
      currentNodeId: nodeId,
      previousNodeId: state.currentNodeId,
      visitedNodes: new Set([...state.visitedNodes, nodeId])
    })),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  addToInventory: (item: InventoryItem) =>
    set((state) => ({
      inventory: [...state.inventory, item]
    })),

  setVariable: (key: string, value: unknown) =>
    set((state) => ({
      gameVariables: { ...state.gameVariables, [key]: value }
    })),

  reset: () =>
    set({
      currentNodeId: '',
      previousNodeId: null,
      visitedNodes: new Set(),
      isLoading: false,
      inventory: [],
      gameVariables: {}
    })
}))
