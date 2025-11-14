/**
 * IPC API Type Definitions
 *
 * Shared types between main and renderer processes.
 * Ensures type safety across the IPC bridge.
 */

/**
 * Standard IPC response format
 */
export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * File picker result
 */
export interface FilePickResult {
  filePath: string
  fileName: string
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  aspectRatio: number
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  valid: boolean
  error?: string
  metadata?: ImageMetadata
}

/**
 * Project settings
 */
export interface ProjectSettings {
  defaultFOV: number
  hotspotDefaultColor: string
  hotspotHoverColor: string
}

/**
 * Project data structure
 */
export interface ProjectData {
  projectId: string
  projectName: string
  version: string
  nodes: unknown[] // Typed as 'any' here, properly typed in renderer
  startNodeId: string | null
  settings: ProjectSettings
  graphLayout?: unknown // Graph layout data (optional for backward compatibility)
  metadata?: {
    created: string
    modified: string
    author?: string
  }
}

/**
 * New project result
 */
export interface NewProjectResult {
  projectPath: string
  projectName: string
}

/**
 * Open project result
 */
export interface OpenProjectResult {
  projectPath: string
  data: ProjectData
}

/**
 * File API exposed to renderer process
 */
export interface FileAPI {
  /**
   * Open file picker for single image
   */
  pickImage: () => Promise<IPCResponse<FilePickResult>>

  /**
   * Open file picker for multiple images (cubic panoramas)
   */
  pickImages: () => Promise<IPCResponse<FilePickResult[]>>

  /**
   * Validate equirectangular panorama image
   */
  validateEquirectangular: (filePath: string) => Promise<IPCResponse<ImageValidationResult>>

  /**
   * Validate cubic panorama face images (all 6 faces)
   */
  validateCubicFaces: (filePaths: string[]) => Promise<IPCResponse<ImageValidationResult[]>>

  /**
   * Copy file to project directory
   *
   * @param sourcePath - Source file path
   * @param projectPath - Project root directory
   * @param destRelativePath - Destination path relative to project root
   * @returns Relative path of copied file
   */
  copyToProject: (
    sourcePath: string,
    projectPath: string,
    destRelativePath: string
  ) => Promise<IPCResponse<string>>

  /**
   * Generate thumbnail for panorama
   *
   * @param sourcePath - Source image path
   * @param outputPath - Output thumbnail path (absolute)
   */
  generateThumbnail: (sourcePath: string, outputPath: string) => Promise<IPCResponse<void>>
}

/**
 * Project API exposed to renderer process
 */
export interface ProjectAPI {
  /**
   * Create new project
   * Opens dialog to choose location and name, creates .pgc directory structure
   */
  newProject: () => Promise<IPCResponse<NewProjectResult>>

  /**
   * Save project data to disk
   *
   * @param projectPath - Absolute path to .pgc directory
   * @param projectData - Complete project data to save
   */
  saveProject: (projectPath: string, projectData: ProjectData) => Promise<IPCResponse<void>>

  /**
   * Open existing project
   * Opens dialog to select .pgc directory, loads project.json
   */
  openProject: () => Promise<IPCResponse<OpenProjectResult>>
}
