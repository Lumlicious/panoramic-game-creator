/**
 * Project File Operations IPC Handlers
 *
 * Handles project lifecycle operations:
 * - New Project creation (dialog + directory structure)
 * - Save Project (write project.json)
 * - Open Project (load project.json)
 */

import { ipcMain, dialog } from 'electron'
import { mkdir, writeFile, readFile, stat } from 'fs/promises'
import { join, basename } from 'path'

/**
 * Standard IPC response format
 */
interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Project data structure (matches renderer types)
 */
interface ProjectData {
  projectId: string
  projectName: string
  version: string
  nodes: unknown[] // Will be typed properly in renderer
  startNodeId: string | null
  metadata?: {
    created: string
    modified: string
    author?: string
  }
}

/**
 * New project result
 */
interface NewProjectResult {
  projectPath: string
  projectName: string
}

/**
 * Register all project-related IPC handlers
 */
export function registerProjectHandlers(): void {
  // Create new project
  ipcMain.handle('project:new', handleNewProject)

  // Save project
  ipcMain.handle('project:save', handleSaveProject)

  // Open existing project
  ipcMain.handle('project:open', handleOpenProject)
}

/**
 * Create new project
 *
 * Workflow:
 * 1. Show dialog to choose location and name
 * 2. Create .pgc directory
 * 3. Initialize directory structure
 * 4. Create initial project.json
 * 5. Return project path
 */
async function handleNewProject(): Promise<IPCResponse<NewProjectResult>> {
  try {
    // Step 1: Show save dialog to choose location and name
    const result = await dialog.showSaveDialog({
      title: 'Create New Project',
      buttonLabel: 'Create',
      defaultPath: 'Untitled Project.pgc',
      properties: ['createDirectory', 'showOverwriteConfirmation'],
      filters: [{ name: 'Panoramic Game Creator Project', extensions: ['pgc'] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Project creation cancelled' }
    }

    const projectPath = result.filePath

    // Ensure it ends with .pgc
    if (!projectPath.endsWith('.pgc')) {
      return { success: false, error: 'Project must have .pgc extension' }
    }

    // Extract project name from path
    const projectName = basename(projectPath, '.pgc')

    // Step 2: Create .pgc directory
    await mkdir(projectPath, { recursive: true })

    // Step 3: Create subdirectories
    await mkdir(join(projectPath, 'assets', 'panoramas'), { recursive: true })
    await mkdir(join(projectPath, 'assets', 'thumbnails'), { recursive: true })
    await mkdir(join(projectPath, '.pgc-meta'), { recursive: true })

    // Step 4: Create version file
    await writeFile(join(projectPath, '.pgc-meta', 'version.txt'), '1.0.0', 'utf-8')

    // Step 5: Create initial project.json
    const initialProject: ProjectData = {
      projectId: generateId(),
      projectName,
      version: '1.0.0',
      nodes: [],
      startNodeId: null,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    }

    await writeFile(
      join(projectPath, 'project.json'),
      JSON.stringify(initialProject, null, 2),
      'utf-8'
    )

    return {
      success: true,
      data: {
        projectPath,
        projectName
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project'
    }
  }
}

/**
 * Save project data to project.json
 *
 * @param projectPath - Absolute path to .pgc directory
 * @param projectData - Complete project data to save
 */
async function handleSaveProject(
  _event: Electron.IpcMainInvokeEvent,
  projectPath: string,
  projectData: ProjectData
): Promise<IPCResponse<void>> {
  try {
    // Validate project path exists
    try {
      await stat(projectPath)
    } catch {
      return { success: false, error: 'Project directory not found' }
    }

    // Update modified timestamp
    const dataToSave: ProjectData = {
      ...projectData,
      metadata: {
        ...projectData.metadata,
        created: projectData.metadata?.created || new Date().toISOString(),
        modified: new Date().toISOString()
      }
    }

    // Write project.json
    const projectJsonPath = join(projectPath, 'project.json')
    await writeFile(projectJsonPath, JSON.stringify(dataToSave, null, 2), 'utf-8')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save project'
    }
  }
}

/**
 * Open existing project
 *
 * Workflow:
 * 1. Show dialog to select .pgc directory
 * 2. Validate directory structure
 * 3. Read project.json
 * 4. Return project data and path
 */
async function handleOpenProject(): Promise<IPCResponse<{ projectPath: string; data: ProjectData }>> {
  try {
    // Step 1: Show open dialog
    const result = await dialog.showOpenDialog({
      title: 'Open Project',
      buttonLabel: 'Open',
      properties: ['openDirectory'],
      filters: [{ name: 'Panoramic Game Creator Project', extensions: ['pgc'] }]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Project open cancelled' }
    }

    const projectPath = result.filePaths[0]

    // Step 2: Validate it's a .pgc directory
    if (!projectPath.endsWith('.pgc')) {
      return {
        success: false,
        error: 'Selected directory is not a .pgc project'
      }
    }

    // Step 3: Check if project.json exists
    const projectJsonPath = join(projectPath, 'project.json')
    let projectJsonContent: string

    try {
      projectJsonContent = await readFile(projectJsonPath, 'utf-8')
    } catch {
      return {
        success: false,
        error: 'project.json not found in selected directory'
      }
    }

    // Step 4: Parse and validate project.json
    let projectData: ProjectData
    try {
      projectData = JSON.parse(projectJsonContent) as ProjectData
    } catch {
      return {
        success: false,
        error: 'Invalid project.json file'
      }
    }

    // Basic validation
    if (!projectData.projectId || !projectData.projectName || !projectData.nodes) {
      return {
        success: false,
        error: 'Corrupted project file (missing required fields)'
      }
    }

    return {
      success: true,
      data: {
        projectPath,
        data: projectData
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open project'
    }
  }
}

/**
 * Simple ID generator (replace with uuid if needed)
 */
function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
