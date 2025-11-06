import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Node, PanoramaData, Hotspot, SphericalPoint, HotspotStyle } from '@/types'

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

  // Hotspot operations
  addHotspot: (nodeId: string, polygon: SphericalPoint[], name?: string) => Hotspot | null
  removeHotspot: (nodeId: string, hotspotId: string) => void
  updateHotspot: (nodeId: string, hotspotId: string, updates: Partial<Hotspot>) => void

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

  // Hotspot operations
  addHotspot: (nodeId, polygon, name) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) {
      console.error('Node not found:', nodeId)
      return null
    }

    // Create default style
    const defaultStyle: HotspotStyle = {
      fillColor: '#00ff00',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      opacity: 0.3,
      hoverFillColor: '#00ffff'
    }

    const newHotspot: Hotspot = {
      id: uuidv4(),
      name: name || `Hotspot ${node.hotspots.length + 1}`,
      targetNodeId: '', // Will be set later via properties panel
      polygon,
      style: defaultStyle
    }

    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, hotspots: [...n.hotspots, newHotspot] } : n
      )
    }))

    return newHotspot
  },

  removeHotspot: (nodeId, hotspotId) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, hotspots: n.hotspots.filter((h) => h.id !== hotspotId) }
          : n
      )
    }))
  },

  updateHotspot: (nodeId, hotspotId, updates) => {
    console.log('projectStore.updateHotspot called:', { nodeId, hotspotId, updates })
    set((state) => {
      const updatedNodes = state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              hotspots: n.hotspots.map((h) => {
                if (h.id === hotspotId) {
                  const updated = { ...h, ...updates }
                  console.log('Hotspot updated from:', h.polygon, 'to:', updated.polygon)
                  return updated
                }
                return h
              })
            }
          : n
      )
      console.log('Store state updated')
      return { nodes: updatedNodes }
    })
  },

  reset: () => set(initialState)
}))
