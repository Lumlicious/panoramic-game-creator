/**
 * File Operations IPC Handlers
 *
 * Handles file system operations for the renderer process:
 * - File picker dialogs
 * - Image validation
 * - File copying
 * - Thumbnail generation
 */

import { ipcMain, dialog } from 'electron'
import { copyFile, mkdir, stat } from 'fs/promises'
import { join, basename } from 'path'
import {
  validateEquirectangularImage,
  validateCubicFace,
  generateThumbnail,
  type ImageMetadata
} from '../utils/imageValidation'

/**
 * Standard IPC response format
 */
interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * File picker result
 */
interface FilePickResult {
  filePath: string
  fileName: string
}

/**
 * Image validation result with metadata
 */
interface ImageValidationResult {
  valid: boolean
  error?: string
  metadata?: ImageMetadata
}

/**
 * Register all file-related IPC handlers
 */
export function registerFileHandlers(): void {
  // Pick single image file
  ipcMain.handle('file:pickImage', handlePickImage)

  // Pick multiple image files (for cubic panoramas)
  ipcMain.handle('file:pickImages', handlePickImages)

  // Validate equirectangular image
  ipcMain.handle('file:validateEquirectangular', handleValidateEquirectangular)

  // Validate cubic face images
  ipcMain.handle('file:validateCubicFaces', handleValidateCubicFaces)

  // Copy file to project directory
  ipcMain.handle('file:copyToProject', handleCopyToProject)

  // Generate thumbnail
  ipcMain.handle('file:generateThumbnail', handleGenerateThumbnail)
}

/**
 * Open native file picker for single image
 */
async function handlePickImage(): Promise<IPCResponse<FilePickResult>> {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select Panorama Image',
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'No file selected' }
    }

    const filePath = result.filePaths[0]

    return {
      success: true,
      data: {
        filePath,
        fileName: basename(filePath)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open file picker'
    }
  }
}

/**
 * Open native file picker for multiple images (cubic panoramas)
 */
async function handlePickImages(): Promise<IPCResponse<FilePickResult[]>> {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select Cubic Panorama Faces (6 images)',
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'No files selected' }
    }

    const files = result.filePaths.map((filePath) => ({
      filePath,
      fileName: basename(filePath)
    }))

    return {
      success: true,
      data: files
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open file picker'
    }
  }
}

/**
 * Validate equirectangular panorama image
 */
async function handleValidateEquirectangular(
  _event: Electron.IpcMainInvokeEvent,
  filePath: string
): Promise<IPCResponse<ImageValidationResult>> {
  try {
    // Get file size
    const stats = await stat(filePath)
    const fileSize = stats.size

    // Validate
    const result = await validateEquirectangularImage(filePath, fileSize)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }
  }
}

/**
 * Validate cubic panorama face images (all 6 faces)
 */
async function handleValidateCubicFaces(
  _event: Electron.IpcMainInvokeEvent,
  filePaths: string[]
): Promise<IPCResponse<ImageValidationResult[]>> {
  try {
    // Check that we have exactly 6 files
    if (filePaths.length !== 6) {
      return {
        success: false,
        error: `Expected 6 faces, got ${filePaths.length}`
      }
    }

    // Validate each face
    const results: ImageValidationResult[] = []

    for (const filePath of filePaths) {
      const stats = await stat(filePath)
      const result = await validateCubicFace(filePath, stats.size)
      results.push(result)
    }

    // Check if all are valid
    const allValid = results.every((r) => r.valid)

    if (!allValid) {
      const errors = results
        .map((r, i) => (r.valid ? null : `Face ${i + 1}: ${r.error}`))
        .filter(Boolean)
        .join('; ')

      return {
        success: false,
        error: errors
      }
    }

    return {
      success: true,
      data: results
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }
  }
}

/**
 * Copy file to project directory
 *
 * @param sourcePath - Source file path
 * @param projectPath - Project root directory
 * @param destRelativePath - Destination path relative to project root
 */
async function handleCopyToProject(
  _event: Electron.IpcMainInvokeEvent,
  sourcePath: string,
  projectPath: string,
  destRelativePath: string
): Promise<IPCResponse<string>> {
  try {
    const destAbsolutePath = join(projectPath, destRelativePath)

    // Create directory if it doesn't exist
    const destDir = join(destAbsolutePath, '..')
    await mkdir(destDir, { recursive: true })

    // Copy file
    await copyFile(sourcePath, destAbsolutePath)

    return {
      success: true,
      data: destRelativePath
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy file'
    }
  }
}

/**
 * Generate thumbnail for panorama
 *
 * @param sourcePath - Source image path
 * @param outputPath - Output thumbnail path (absolute)
 */
async function handleGenerateThumbnail(
  _event: Electron.IpcMainInvokeEvent,
  sourcePath: string,
  outputPath: string
): Promise<IPCResponse<void>> {
  try {
    // Create directory if it doesn't exist
    const outputDir = join(outputPath, '..')
    await mkdir(outputDir, { recursive: true })

    // Generate thumbnail
    await generateThumbnail(sourcePath, outputPath)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate thumbnail'
    }
  }
}
