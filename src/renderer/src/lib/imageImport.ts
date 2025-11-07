/**
 * Image Import Orchestration
 *
 * High-level API for importing panoramic images into a project.
 * Supports both equirectangular and cubic panoramas.
 * Handles the complete flow: pick → validate → copy → thumbnail → update store
 */

import { extname } from 'path-browserify'

/**
 * Panorama type selection
 */
export type PanoramaType = 'equirectangular' | 'cubic'

/**
 * Result of successful equirectangular panorama import
 */
export interface ImportedEquirectPanorama {
  type: 'equirectangular'
  nodeId: string
  panoramaPath: string // Relative path in project
  thumbnailPath: string // Relative path in project
  metadata: {
    width: number
    height: number
    format: string
    aspectRatio: number
  }
}

/**
 * Result of successful cubic panorama import
 */
export interface ImportedCubicPanorama {
  type: 'cubic'
  nodeId: string
  faces: {
    front: string
    back: string
    left: string
    right: string
    top: string
    bottom: string
  }
  thumbnailPath: string
  metadata: {
    width: number
    height: number
    format: string
  }
}

/**
 * Union type for all panorama import results
 */
export type ImportedPanorama = ImportedEquirectPanorama | ImportedCubicPanorama

/**
 * Import equirectangular panorama
 *
 * @param projectPath - Absolute path to project directory (.pgc folder)
 * @param nodeId - UUID of the node (determines filename)
 * @returns ImportedEquirectPanorama data or null if cancelled/failed
 */
async function importEquirectangularPanorama(
  projectPath: string,
  nodeId: string
): Promise<ImportedEquirectPanorama | null> {
  const fileAPI = window.fileAPI

  // Step 1: Open file picker
  const pickResult = await fileAPI.pickImage()
  if (!pickResult.success || !pickResult.data) {
    return null
  }

  const { filePath: sourcePath, fileName } = pickResult.data
  const sourceExt = extname(fileName)

  // Step 2: Validate as equirectangular panorama
  const validationResult = await fileAPI.validateEquirectangular(sourcePath)
  if (!validationResult.success || !validationResult.data) {
    throw new Error(validationResult.error || 'Validation failed')
  }

  const { valid, error, metadata } = validationResult.data
  if (!valid || !metadata) {
    throw new Error(error || 'Invalid equirectangular panorama')
  }

  // Step 3: Copy to project directory
  const panoramaRelPath = `assets/panoramas/${nodeId}${sourceExt}`
  const copyResult = await fileAPI.copyToProject(sourcePath, projectPath, panoramaRelPath)
  if (!copyResult.success || !copyResult.data) {
    throw new Error(copyResult.error || 'Failed to copy file to project')
  }

  // Step 4: Generate thumbnail
  const thumbnailRelPath = `assets/thumbnails/${nodeId}.jpg`
  const thumbnailAbsPath = `${projectPath}/${thumbnailRelPath}`

  const thumbResult = await fileAPI.generateThumbnail(sourcePath, thumbnailAbsPath)
  if (!thumbResult.success) {
    console.warn('Failed to generate thumbnail:', thumbResult.error)
  }

  // Step 5: Return imported data
  return {
    type: 'equirectangular',
    nodeId,
    panoramaPath: panoramaRelPath,
    thumbnailPath: thumbnailRelPath,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      aspectRatio: metadata.aspectRatio
    }
  }
}

/**
 * Import cubic panorama (6 faces)
 *
 * @param projectPath - Absolute path to project directory (.pgc folder)
 * @param nodeId - UUID of the node (determines filename)
 * @returns ImportedCubicPanorama data or null if cancelled/failed
 */
async function importCubicPanorama(
  projectPath: string,
  nodeId: string
): Promise<ImportedCubicPanorama | null> {
  const fileAPI = window.fileAPI

  // Step 1: Open file picker for 6 images
  const pickResult = await fileAPI.pickImages()
  if (!pickResult.success || !pickResult.data) {
    return null
  }

  const files = pickResult.data

  // Check that we have exactly 6 files
  if (files.length !== 6) {
    throw new Error(`Expected 6 face images, got ${files.length}. Please select exactly 6 images.`)
  }

  // Step 2: Validate all 6 faces
  const filePaths = files.map((f) => f.filePath)
  const validationResult = await fileAPI.validateCubicFaces(filePaths)
  if (!validationResult.success || !validationResult.data) {
    throw new Error(validationResult.error || 'Validation failed')
  }

  const validations = validationResult.data
  const firstValid = validations.find((v) => v.valid)
  if (!firstValid || !firstValid.metadata) {
    throw new Error('No valid cubic faces found')
  }

  // All faces should have same dimensions
  const faceSize = firstValid.metadata.width

  // Step 3: Copy all 6 faces to project directory
  // User must select files in order: front, back, left, right, top, bottom
  // Or we could show a dialog to let them assign each face
  const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'] as const
  const facePaths: Record<string, string> = {}

  for (let i = 0; i < 6; i++) {
    const faceName = faceNames[i]
    const file = files[i]
    const sourceExt = extname(file.fileName)
    const relPath = `assets/panoramas/${nodeId}_${faceName}${sourceExt}`

    const copyResult = await fileAPI.copyToProject(file.filePath, projectPath, relPath)
    if (!copyResult.success) {
      throw new Error(`Failed to copy ${faceName} face: ${copyResult.error}`)
    }

    facePaths[faceName] = relPath
  }

  // Step 4: Generate thumbnail from front face
  const thumbnailRelPath = `assets/thumbnails/${nodeId}.jpg`
  const thumbnailAbsPath = `${projectPath}/${thumbnailRelPath}`

  const thumbResult = await fileAPI.generateThumbnail(files[0].filePath, thumbnailAbsPath)
  if (!thumbResult.success) {
    console.warn('Failed to generate thumbnail:', thumbResult.error)
  }

  // Step 5: Return imported data
  return {
    type: 'cubic',
    nodeId,
    faces: {
      front: facePaths.front,
      back: facePaths.back,
      left: facePaths.left,
      right: facePaths.right,
      top: facePaths.top,
      bottom: facePaths.bottom
    },
    thumbnailPath: thumbnailRelPath,
    metadata: {
      width: faceSize,
      height: faceSize,
      format: firstValid.metadata.format
    }
  }
}

/**
 * Import panorama workflow for a new or existing node
 *
 * @param projectPath - Absolute path to project directory (.pgc folder)
 * @param nodeId - UUID of the node (determines filename)
 * @param type - Type of panorama to import
 * @returns ImportedPanorama data or null if cancelled/failed
 */
export async function importPanoramaForNode(
  projectPath: string,
  nodeId: string,
  type: PanoramaType
): Promise<ImportedPanorama | null> {
  if (type === 'equirectangular') {
    return importEquirectangularPanorama(projectPath, nodeId)
  } else {
    return importCubicPanorama(projectPath, nodeId)
  }
}

/**
 * Replace panorama for an existing node
 *
 * Same workflow as import, but updates existing node instead of creating new one.
 * Old panorama and thumbnail files remain (will be overwritten if same extension).
 */
export async function replacePanoramaForNode(
  projectPath: string,
  nodeId: string,
  type: PanoramaType
): Promise<ImportedPanorama | null> {
  return importPanoramaForNode(projectPath, nodeId, type)
}

/**
 * Generate file:// URL for loading textures in Three.js
 *
 * Converts relative project path to absolute file:// URL for texture loading.
 * Must be called at runtime to resolve against current project path.
 */
export function getPanoramaUrl(projectPath: string, relativePath: string): string {
  const absolutePath = `${projectPath}/${relativePath}`
  return `file://${absolutePath}`
}

/**
 * Get thumbnail URL for display in UI
 */
export function getThumbnailUrl(projectPath: string, relativePath: string): string {
  const absolutePath = `${projectPath}/${relativePath}`
  return `file://${absolutePath}`
}
