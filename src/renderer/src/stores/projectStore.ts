import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  Node,
  PanoramaData,
  Hotspot,
  SphericalPoint,
  HotspotStyle,
  ProjectSettings
} from '@/types'
import {
  importPanoramaForNode,
  replacePanoramaForNode,
  type PanoramaType
} from '@/lib/imageImport'

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
  version: string
  created: string | null
  modified: string | null
  settings: ProjectSettings

  // Node data
  nodes: Node[]
  startNodeId: string | null

  // Node operations
  addNode: (name: string, panorama: PanoramaData) => Node
  updateNode: (id: string, updates: Partial<Node>) => void
  removeNode: (id: string) => void
  getNode: (id: string) => Node | undefined
  setStartNode: (id: string) => void

  // Panorama import operations
  createNodeWithPanorama: (name: string, type: PanoramaType) => Promise<Node | null>
  assignPanoramaToNode: (nodeId: string, type: PanoramaType) => Promise<boolean>

  // Hotspot operations
  addHotspot: (nodeId: string, polygon: SphericalPoint[], name?: string) => Hotspot | null
  removeHotspot: (nodeId: string, hotspotId: string) => void
  updateHotspot: (nodeId: string, hotspotId: string, updates: Partial<Hotspot>) => void

  // Project lifecycle operations
  newProject: () => Promise<boolean>
  openProject: () => Promise<boolean>
  saveProject: () => Promise<boolean>
  closeProject: () => void
  reset: () => void
}

// Default project settings as per PROJECT_DATA_STRUCTURE.md
const DEFAULT_SETTINGS: ProjectSettings = {
  defaultFOV: 75,
  hotspotDefaultColor: '#3b82f6', // Blue 500
  hotspotHoverColor: '#60a5fa' // Blue 400
}

const initialState = {
  projectId: null,
  projectName: 'Untitled Project',
  projectPath: null,
  version: '1.0.0',
  created: null,
  modified: null,
  settings: DEFAULT_SETTINGS,
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

  // Panorama import operations
  createNodeWithPanorama: async (name, type) => {
    const { projectPath } = get()

    // Check if project exists
    if (!projectPath) {
      console.error('No project open. Cannot import panorama.')
      return null
    }

    // Create node first (to get ID)
    const nodeId = uuidv4()

    try {
      // Run import workflow
      const imported = await importPanoramaForNode(projectPath, nodeId, type)

      if (!imported) {
        // User cancelled
        return null
      }

      // Create PanoramaData based on imported type
      let panoramaData: PanoramaData

      if (imported.type === 'equirectangular') {
        panoramaData = {
          type: 'equirectangular',
          filePath: imported.panoramaPath,
          thumbnailPath: imported.thumbnailPath,
          metadata: {
            width: imported.metadata.width,
            height: imported.metadata.height,
            format: imported.metadata.format
          }
        }
      } else {
        // Cubic panorama
        panoramaData = {
          type: 'cubic',
          faces: imported.faces,
          thumbnailPath: imported.thumbnailPath,
          metadata: {
            width: imported.metadata.width,
            height: imported.metadata.height,
            format: imported.metadata.format
          }
        }
      }

      // Create node with imported panorama
      const newNode: Node = {
        id: nodeId,
        name,
        panorama: panoramaData,
        hotspots: [],
        position: { x: 0, y: 0 },
        metadata: {}
      }

      set((state) => ({
        nodes: [...state.nodes, newNode]
      }))

      return newNode
    } catch (error) {
      console.error('Failed to import panorama:', error)
      throw error
    }
  },

  assignPanoramaToNode: async (nodeId, type) => {
    const { projectPath, getNode } = get()

    if (!projectPath) {
      console.error('No project open. Cannot assign panorama.')
      return false
    }

    const node = getNode(nodeId)
    if (!node) {
      console.error('Node not found:', nodeId)
      return false
    }

    try {
      // Run import workflow (replaces existing panorama)
      const imported = await replacePanoramaForNode(projectPath, nodeId, type)

      if (!imported) {
        // User cancelled
        return false
      }

      // Create PanoramaData based on imported type
      let panoramaData: PanoramaData

      if (imported.type === 'equirectangular') {
        panoramaData = {
          type: 'equirectangular',
          filePath: imported.panoramaPath,
          thumbnailPath: imported.thumbnailPath,
          metadata: {
            width: imported.metadata.width,
            height: imported.metadata.height,
            format: imported.metadata.format
          }
        }
      } else {
        // Cubic panorama
        panoramaData = {
          type: 'cubic',
          faces: imported.faces,
          thumbnailPath: imported.thumbnailPath,
          metadata: {
            width: imported.metadata.width,
            height: imported.metadata.height,
            format: imported.metadata.format
          }
        }
      }

      get().updateNode(nodeId, { panorama: panoramaData })

      return true
    } catch (error) {
      console.error('Failed to assign panorama:', error)
      throw error
    }
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
      style: defaultStyle,
      enabled: true
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

  // Project lifecycle operations
  newProject: async () => {
    try {
      const result = await window.projectAPI.newProject()

      if (!result.success || !result.data) {
        console.error('Failed to create project:', result.error)
        return false
      }

      const { projectPath, projectName } = result.data
      const now = new Date().toISOString()

      // Reset store and set new project info
      set({
        ...initialState,
        projectId: `proj-${Date.now()}`,
        projectName,
        projectPath,
        version: '1.0.0',
        created: now,
        modified: now,
        settings: DEFAULT_SETTINGS,
        nodes: []
      })

      console.log('New project created:', projectPath)
      return true
    } catch (error) {
      console.error('Error creating project:', error)
      return false
    }
  },

  openProject: async () => {
    try {
      const result = await window.projectAPI.openProject()

      if (!result.success || !result.data) {
        console.error('Failed to open project:', result.error)
        return false
      }

      const { projectPath, data } = result.data

      // Load project data into store
      set({
        projectId: data.projectId,
        projectName: data.projectName,
        projectPath,
        version: data.version,
        created: data.metadata?.created || null,
        modified: data.metadata?.modified || null,
        settings: data.settings || DEFAULT_SETTINGS,
        nodes: data.nodes as Node[], // Type assertion from unknown[]
        startNodeId: data.startNodeId
      })

      console.log('Project opened:', projectPath)
      return true
    } catch (error) {
      console.error('Error opening project:', error)
      return false
    }
  },

  saveProject: async () => {
    const { projectPath, projectId, projectName, version, created, nodes, startNodeId, settings } =
      get()

    if (!projectPath) {
      console.error('No project open. Cannot save.')
      return false
    }

    try {
      const now = new Date().toISOString()

      // Serialize project data
      const projectData = {
        projectId: projectId || `proj-${Date.now()}`,
        projectName,
        version,
        nodes,
        startNodeId,
        settings,
        metadata: {
          created: created || now, // Preserve original created timestamp
          modified: now // Always update modified timestamp
        }
      }

      const result = await window.projectAPI.saveProject(projectPath, projectData)

      if (!result.success) {
        console.error('Failed to save project:', result.error)
        return false
      }

      // Update modified timestamp in store
      set({ modified: now })

      console.log('Project saved:', projectPath)
      return true
    } catch (error) {
      console.error('Error saving project:', error)
      return false
    }
  },

  closeProject: () => {
    console.log('Closing project')
    set(initialState)
  },

  reset: () => set(initialState)
}))
