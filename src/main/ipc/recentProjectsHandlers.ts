/**
 * Recent Projects IPC Handlers
 *
 * Manages persistent storage and retrieval of recently opened projects
 * using electron-store for cross-session persistence.
 */

import { ipcMain } from 'electron'
import { stat } from 'fs/promises'
import { basename } from 'path'
import Store from 'electron-store'

/**
 * Recent project entry
 */
export interface RecentProject {
  path: string
  name: string
  lastOpened: string
}

/**
 * Store schema
 */
interface StoreSchema {
  recentProjects: RecentProject[]
}

/**
 * Standard IPC response format
 */
interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Maximum number of recent projects to track
const MAX_RECENT_PROJECTS = 10

// Initialize electron-store with schema
const store = new Store<StoreSchema>({
  name: 'panoramic-game-creator',
  defaults: {
    recentProjects: []
  }
})

/**
 * Register all recent projects IPC handlers
 */
export function registerRecentProjectsHandlers(): void {
  // Get recent projects list
  ipcMain.handle('recentProjects:get', handleGetRecentProjects)

  // Add/update a recent project
  ipcMain.handle('recentProjects:add', handleAddRecentProject)

  // Remove a recent project
  ipcMain.handle('recentProjects:remove', handleRemoveRecentProject)

  // Clear all recent projects
  ipcMain.handle('recentProjects:clear', handleClearRecentProjects)
}

/**
 * Get list of recent projects
 * Validates that projects still exist on disk
 */
async function handleGetRecentProjects(): Promise<IPCResponse<RecentProject[]>> {
  try {
    const projects = store.get('recentProjects', [])

    // Filter out projects that no longer exist
    const validProjects: RecentProject[] = []
    const invalidPaths: string[] = []

    for (const project of projects) {
      try {
        await stat(project.path)
        validProjects.push(project)
      } catch {
        // Project no longer exists
        invalidPaths.push(project.path)
      }
    }

    // If any projects were removed, update the store
    if (invalidPaths.length > 0) {
      store.set('recentProjects', validProjects)
    }

    return {
      success: true,
      data: validProjects
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recent projects'
    }
  }
}

/**
 * Add or update a project in the recent list
 * Moves it to the top if already exists
 */
async function handleAddRecentProject(
  _event: Electron.IpcMainInvokeEvent,
  projectPath: string,
  projectName?: string
): Promise<IPCResponse<void>> {
  try {
    // Validate the project exists
    try {
      await stat(projectPath)
    } catch {
      return { success: false, error: 'Project path does not exist' }
    }

    // Get current list
    const projects = store.get('recentProjects', [])

    // Remove if already exists (we'll add it to the top)
    const filtered = projects.filter((p) => p.path !== projectPath)

    // Create new entry
    const newEntry: RecentProject = {
      path: projectPath,
      name: projectName || basename(projectPath, '.pgc'),
      lastOpened: new Date().toISOString()
    }

    // Add to top, limit to max
    const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_PROJECTS)

    // Save
    store.set('recentProjects', updated)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add recent project'
    }
  }
}

/**
 * Remove a specific project from recent list
 */
async function handleRemoveRecentProject(
  _event: Electron.IpcMainInvokeEvent,
  projectPath: string
): Promise<IPCResponse<void>> {
  try {
    const projects = store.get('recentProjects', [])
    const filtered = projects.filter((p) => p.path !== projectPath)
    store.set('recentProjects', filtered)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove recent project'
    }
  }
}

/**
 * Clear all recent projects
 */
async function handleClearRecentProjects(): Promise<IPCResponse<void>> {
  try {
    store.set('recentProjects', [])
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear recent projects'
    }
  }
}

/**
 * Utility function to add a project to recents
 * Can be called from other handlers (e.g., projectHandlers)
 */
export async function addToRecentProjects(
  projectPath: string,
  projectName?: string
): Promise<void> {
  try {
    const projects = store.get('recentProjects', [])
    const filtered = projects.filter((p) => p.path !== projectPath)

    const newEntry: RecentProject = {
      path: projectPath,
      name: projectName || basename(projectPath, '.pgc'),
      lastOpened: new Date().toISOString()
    }

    const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_PROJECTS)
    store.set('recentProjects', updated)
  } catch (error) {
    console.error('Failed to add to recent projects:', error)
  }
}
