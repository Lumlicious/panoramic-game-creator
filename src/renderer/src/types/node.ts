/**
 * Node types for panoramic game creator
 */

import { Hotspot } from './hotspot'

/**
 * Panoramic image data
 * Currently supports equirectangular format only (MVP)
 * Cubic panoramas deferred to post-MVP
 */
export interface PanoramaData {
  type: 'equirectangular' | 'cubic'

  // For equirectangular
  filePath?: string // Relative path within project (e.g., "assets/panoramas/node-id.jpg")
  thumbnailPath?: string // Relative path to thumbnail (e.g., "assets/thumbnails/node-id.jpg")
  metadata?: {
    width: number
    height: number
    format: string
  }

  // For cubic (future)
  faces?: {
    front: string
    back: string
    left: string
    right: string
    top: string
    bottom: string
  }
}

/**
 * Node in the panoramic game world
 * Contains a panoramic image and hotspots linking to other nodes
 */
export interface Node {
  id: string
  name: string
  panorama: PanoramaData
  hotspots: Hotspot[]
  position: { x: number; y: number } // For graph layout
  metadata?: {
    description?: string
    tags?: string[]
  }
}
