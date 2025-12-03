/**
 * Image Validation Utilities (Main Process)
 *
 * Validates panoramic images for both equirectangular and cubic formats.
 * Uses sharp library for image metadata extraction and validation.
 */

import sharp from 'sharp'
import { extname } from 'path'

// Validation constants
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Equirectangular constraints
const EQUIRECT_MIN_WIDTH = 2048
const EQUIRECT_MAX_WIDTH = 8192
const EQUIRECT_ASPECT_RATIO = 2.0
const EQUIRECT_ASPECT_TOLERANCE = 0.05 // ±5%

// Cubic constraints
const CUBIC_MIN_SIZE = 1024
const CUBIC_MAX_SIZE = 4096

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  aspectRatio: number
}

export interface ValidationResult {
  valid: boolean
  error?: string
  metadata?: ImageMetadata
}

/**
 * Validate image file format by extension
 */
function validateFormat(filePath: string): ValidationResult {
  const ext = extname(filePath).toLowerCase().slice(1) // Remove leading dot

  if (!ALLOWED_FORMATS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid format. Supported: ${ALLOWED_FORMATS.join(', ').toUpperCase()}`
    }
  }

  return { valid: true }
}

/**
 * Get image metadata using sharp
 */
async function getImageMetadata(filePath: string, fileSize: number): Promise<ImageMetadata> {
  const metadata = await sharp(filePath).metadata()

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error('Unable to read image metadata')
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: fileSize,
    aspectRatio: metadata.width / metadata.height
  }
}

/**
 * Validate equirectangular panorama image
 *
 * Requirements:
 * - Format: JPG, PNG, WebP
 * - Aspect ratio: ~2:1 (±5%)
 * - Resolution: 2048-8192px width
 * - File size: max 50MB
 */
export async function validateEquirectangularImage(
  filePath: string,
  fileSize: number
): Promise<ValidationResult> {
  // 1. Validate format
  const formatCheck = validateFormat(filePath)
  if (!formatCheck.valid) {
    return formatCheck
  }

  // 2. Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Max: 50MB`
    }
  }

  // 3. Get image metadata
  let metadata: ImageMetadata
  try {
    metadata = await getImageMetadata(filePath, fileSize)
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to read image'
    }
  }

  // 4. Validate aspect ratio (2:1 ±5%)
  const minAspect = EQUIRECT_ASPECT_RATIO * (1 - EQUIRECT_ASPECT_TOLERANCE)
  const maxAspect = EQUIRECT_ASPECT_RATIO * (1 + EQUIRECT_ASPECT_TOLERANCE)

  if (metadata.aspectRatio < minAspect || metadata.aspectRatio > maxAspect) {
    return {
      valid: false,
      error: `Invalid aspect ratio (${metadata.aspectRatio.toFixed(2)}:1). Expected ~2:1 for equirectangular`,
      metadata
    }
  }

  // 5. Validate resolution
  if (metadata.width < EQUIRECT_MIN_WIDTH) {
    return {
      valid: false,
      error: `Resolution too low (${metadata.width}px). Min: ${EQUIRECT_MIN_WIDTH}px`,
      metadata
    }
  }

  if (metadata.width > EQUIRECT_MAX_WIDTH) {
    return {
      valid: false,
      error: `Resolution too high (${metadata.width}px). Max: ${EQUIRECT_MAX_WIDTH}px`,
      metadata
    }
  }

  return {
    valid: true,
    metadata
  }
}

/**
 * Validate cubic panorama face image
 *
 * Requirements:
 * - Format: JPG, PNG, WebP
 * - Aspect ratio: 1:1 (square)
 * - Resolution: 1024-4096px per side
 * - File size: max 50MB
 */
export async function validateCubicFace(
  filePath: string,
  fileSize: number
): Promise<ValidationResult> {
  // 1. Validate format
  const formatCheck = validateFormat(filePath)
  if (!formatCheck.valid) {
    return formatCheck
  }

  // 2. Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Max: 50MB`
    }
  }

  // 3. Get image metadata
  let metadata: ImageMetadata
  try {
    metadata = await getImageMetadata(filePath, fileSize)
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to read image'
    }
  }

  // 4. Validate square aspect ratio
  if (metadata.width !== metadata.height) {
    return {
      valid: false,
      error: `Not square (${metadata.width}x${metadata.height}). Cubic faces must be square`,
      metadata
    }
  }

  // 5. Validate resolution
  if (metadata.width < CUBIC_MIN_SIZE) {
    return {
      valid: false,
      error: `Resolution too low (${metadata.width}px). Min: ${CUBIC_MIN_SIZE}px`,
      metadata
    }
  }

  if (metadata.width > CUBIC_MAX_SIZE) {
    return {
      valid: false,
      error: `Resolution too high (${metadata.width}px). Max: ${CUBIC_MAX_SIZE}px`,
      metadata
    }
  }

  return {
    valid: true,
    metadata
  }
}

/**
 * Generate thumbnail for panorama preview
 *
 * Creates a 200x100 JPEG thumbnail for use in the node list panel
 */
export async function generateThumbnail(sourcePath: string, outputPath: string): Promise<void> {
  await sharp(sourcePath)
    .resize(200, 100, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath)
}
