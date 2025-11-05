import { create } from 'zustand'

/**
 * Editor Store
 *
 * Manages ephemeral UI state that is NOT persisted to disk.
 * This includes current selections, view modes, and drawing states.
 */

export type ViewMode = 'editor' | 'graph'
export type DrawingMode = 'select' | 'drawing' | 'editing'

interface EditorState {
  // View state
  viewMode: ViewMode

  // Node selection
  selectedNodeId: string | null

  // Hotspot interaction
  selectedHotspotId: string | null

  // Drawing state
  drawingMode: DrawingMode

  // Dirty flag (unsaved changes)
  isDirty: boolean

  // Actions
  setViewMode: (mode: ViewMode) => void
  setSelectedNodeId: (nodeId: string | null) => void
  setSelectedHotspotId: (hotspotId: string | null) => void
  setDrawingMode: (mode: DrawingMode) => void
  setDirty: (dirty: boolean) => void
  reset: () => void
}

const initialState = {
  viewMode: 'editor' as ViewMode,
  selectedNodeId: null,
  selectedHotspotId: null,
  drawingMode: 'select' as DrawingMode,
  isDirty: false
}

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedNodeId: (nodeId) => set({
    selectedNodeId: nodeId,
    selectedHotspotId: null // Clear hotspot selection when changing nodes
  }),

  setSelectedHotspotId: (hotspotId) => set({
    selectedHotspotId: hotspotId
  }),

  setDrawingMode: (mode) => set({
    drawingMode: mode,
    selectedHotspotId: mode === 'drawing' ? null : undefined // Clear selection when starting to draw
  }),

  setDirty: (dirty) => set({ isDirty: dirty }),

  reset: () => set(initialState)
}))
