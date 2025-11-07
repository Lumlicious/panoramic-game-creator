/**
 * Image Import Test Component
 *
 * Temporary test UI for verifying the complete panorama import workflow.
 * This component demonstrates the full flow:
 * 1. Create project directory
 * 2. Import panorama via file picker
 * 3. Validate, copy, generate thumbnail
 * 4. Update project store
 */

import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { Button } from '@/components/ui/button'
import type { PanoramaType } from '@/lib/imageImport'

export function ImportTest() {
  const [status, setStatus] = useState<string>('Ready')
  const [error, setError] = useState<string | null>(null)
  const [panoramaType, setPanoramaType] = useState<PanoramaType>('equirectangular')

  const {
    createNodeWithPanorama,
    newProject,
    openProject,
    saveProject,
    nodes,
    projectPath,
    projectName
  } = useProjectStore()

  const handleNewProject = async () => {
    setStatus('Creating new project...')
    setError(null)

    try {
      const success = await newProject()
      if (success) {
        setStatus('✅ Project created successfully!')
      } else {
        setStatus('Project creation cancelled or failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setStatus('❌ Failed to create project')
      setError(errorMessage)
    }
  }

  const handleOpenProject = async () => {
    setStatus('Opening project...')
    setError(null)

    try {
      const success = await openProject()
      if (success) {
        setStatus('✅ Project opened successfully!')
      } else {
        setStatus('Project open cancelled or failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setStatus('❌ Failed to open project')
      setError(errorMessage)
    }
  }

  const handleSaveProject = async () => {
    setStatus('Saving project...')
    setError(null)

    try {
      const success = await saveProject()
      if (success) {
        setStatus('✅ Project saved successfully!')
      } else {
        setStatus('Failed to save project')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setStatus('❌ Failed to save project')
      setError(errorMessage)
    }
  }

  const handleTestImport = async () => {
    setStatus('Starting import...')
    setError(null)

    try {
      // Check if project is open
      if (!projectPath) {
        setStatus('❌ No project open! Create or open a project first.')
        setError('Please create a new project or open an existing one before importing panoramas')
        return
      }

      setStatus(`Opening file picker for ${panoramaType} panorama...`)

      // Call the complete import workflow with selected type
      const newNode = await createNodeWithPanorama('Test Node', panoramaType)

      if (!newNode) {
        setStatus('Import cancelled by user')
        return
      }

      setStatus(`✅ Success! ${panoramaType} node created: ${newNode.name}`)
      console.log('Imported node:', newNode)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setStatus('❌ Import failed')
      setError(errorMessage)
      console.error('Import error:', err)
    }
  }

  return (
    <div className="p-4 border border-gray-300 rounded-md max-w-2xl">
      <h2 className="text-lg font-bold mb-4">Project & Import Test</h2>

      {/* Project Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-sm font-semibold mb-1">Current Project:</p>
        <p className="text-xs text-gray-600 mb-1">
          Name: <span className="font-medium">{projectName || 'No project open'}</span>
        </p>
        <p className="text-xs text-gray-600 mb-1">
          Path: <code className="bg-gray-100 px-1">{projectPath || 'Not set'}</code>
        </p>
        <p className="text-xs text-gray-600">Nodes: {nodes.length}</p>
      </div>

      {/* Project Lifecycle Buttons */}
      <div className="mb-4">
        <p className="text-sm font-semibold mb-2">Project Operations:</p>
        <div className="flex gap-2">
          <Button onClick={handleNewProject} size="sm">
            New Project
          </Button>
          <Button onClick={handleOpenProject} size="sm" variant="secondary">
            Open Project
          </Button>
          <Button onClick={handleSaveProject} size="sm" variant="secondary" disabled={!projectPath}>
            Save Project
          </Button>
        </div>
      </div>

      {/* Panorama Import Section */}
      <div className="mb-4 pb-4 border-t pt-4">
        <p className="text-sm font-semibold mb-3">Import Panorama:</p>
        <p className="text-sm font-semibold mb-2">Panorama Type:</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="panoramaType"
              value="equirectangular"
              checked={panoramaType === 'equirectangular'}
              onChange={(e) => setPanoramaType(e.target.value as PanoramaType)}
              className="cursor-pointer"
            />
            <span className="text-sm">Equirectangular (1 image)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="panoramaType"
              value="cubic"
              checked={panoramaType === 'cubic'}
              onChange={(e) => setPanoramaType(e.target.value as PanoramaType)}
              className="cursor-pointer"
            />
            <span className="text-sm">Cubic (6 faces)</span>
          </label>
        </div>
      </div>

      <Button onClick={handleTestImport} className="mb-4" disabled={!projectPath}>
        Import {panoramaType === 'equirectangular' ? 'Equirectangular' : 'Cubic'} Panorama
      </Button>

      <div className="text-sm">
        <p className="font-semibold">Status:</p>
        <p className={error ? 'text-red-600' : 'text-gray-700'}>{status}</p>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <p className="font-semibold text-red-800">Error:</p>
            <p className="text-red-700 text-xs">{error}</p>
          </div>
        )}
      </div>

      {nodes.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="font-semibold text-sm mb-2">Imported Nodes:</p>
          <ul className="text-xs space-y-2">
            {nodes.map((node) => (
              <li key={node.id} className="bg-gray-50 p-2 rounded">
                <p className="font-semibold">{node.name}</p>
                <p className="text-gray-600">ID: {node.id.slice(0, 8)}...</p>
                <p className="text-gray-600">Type: {node.panorama.type}</p>
                {node.panorama.type === 'equirectangular' ? (
                  <p className="text-gray-600">Path: {node.panorama.filePath}</p>
                ) : (
                  <div className="text-gray-600">
                    <p>Faces:</p>
                    <ul className="ml-2 text-[10px]">
                      <li>Front: {node.panorama.faces?.front}</li>
                      <li>Back: {node.panorama.faces?.back}</li>
                      <li>Left: {node.panorama.faces?.left}</li>
                      <li>Right: {node.panorama.faces?.right}</li>
                      <li>Top: {node.panorama.faces?.top}</li>
                      <li>Bottom: {node.panorama.faces?.bottom}</li>
                    </ul>
                  </div>
                )}
                <p className="text-gray-600">Thumb: {node.panorama.thumbnailPath}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
