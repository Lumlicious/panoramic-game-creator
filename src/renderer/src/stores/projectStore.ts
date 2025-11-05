import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Node, PanoramaData } from '@/types'

/**
 * Project Store
 *
 * Manages project data that IS persisted to disk.
 * This includes nodes, hotspots, and project settings.
 */

interface ProjectState {
  // Project metadata
  projectId: string | null
  projectName: string
  projectPath: string | null

  // Node data
  nodes: Node[]
  startNodeId: string | null

  // Node operations
  addNode: (name: string, panorama: PanoramaData) => Node
  updateNode: (id: string, updates: Partial<Node>) => void
  removeNode: (id: string) => void
  getNode: (id: string) => Node | undefined
  setStartNode: (id: string) => void

  // Project operations
  reset: () => void
}

const initialState = {
  projectId: null,
  projectName: 'Untitled Project',
  projectPath: null,
  nodes: [],
  startNodeId: null
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  addNode: (name, panorama) => {
    const newNode: Node = {
      id: uuidv4(),
      name,
      panorama,
      hotspots: [],
      position: { x: 0, y: 0 }, // For graph layout
      metadata: {}
    }

    set((state) => ({
      nodes: [...state.nodes, newNode]
    }))

    return newNode
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      )
    }))
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      startNodeId: state.startNodeId === id ? null : state.startNodeId
    }))
  },

  getNode: (id) => {
    return get().nodes.find((node) => node.id === id)
  },

  setStartNode: (id) => {
    set({ startNodeId: id })
  },

  reset: () => set(initialState)
}))
