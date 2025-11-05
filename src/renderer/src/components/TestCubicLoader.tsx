import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import type { PanoramaData } from '@/types'

/**
 * TestCubicLoader Component
 *
 * Temporary UI for testing cubic panorama loading.
 * Provides 6 file inputs for each cube face and creates a test node.
 *
 * This is a temporary component for testing - will be replaced with
 * proper node management UI in Phase 5.
 */

export function TestCubicLoader() {
  const [faces, setFaces] = useState<Record<string, string>>({
    front: '',
    back: '',
    left: '',
    right: '',
    top: '',
    bottom: ''
  })

  const addNode = useProjectStore((state) => state.addNode)
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId)

  const handleFileSelect = (face: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create blob URL for the file
      const url = URL.createObjectURL(file)
      setFaces((prev) => ({
        ...prev,
        [face]: url
      }))
    }
  }

  const handleLoadPanorama = () => {
    // Check if all faces are loaded
    const allFacesLoaded = Object.values(faces).every((url) => url !== '')

    if (!allFacesLoaded) {
      alert('Please select all 6 cube faces before loading')
      return
    }

    // Create panorama data
    const panorama: PanoramaData = {
      type: 'cubic',
      faces: {
        front: faces.front,
        back: faces.back,
        left: faces.left,
        right: faces.right,
        top: faces.top,
        bottom: faces.bottom
      }
    }

    // Add node to project store
    const node = addNode('Test Cubic Panorama', panorama)

    // Select the new node
    setSelectedNodeId(node.id)

    // Clear faces for next load
    setFaces({
      front: '',
      back: '',
      left: '',
      right: '',
      top: '',
      bottom: ''
    })

    // Reset file inputs
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]')
    inputs.forEach((input) => (input.value = ''))
  }

  const faceLabels = [
    { key: 'front', label: 'Front (+Z)' },
    { key: 'back', label: 'Back (-Z)' },
    { key: 'left', label: 'Left (-X)' },
    { key: 'right', label: 'Right (+X)' },
    { key: 'top', label: 'Top (+Y)' },
    { key: 'bottom', label: 'Bottom (-Y)' }
  ]

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">Test Cubic Panorama Loader</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Load 6 images for cubic panorama testing
      </p>

      <div className="space-y-3">
        {faceLabels.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-medium">{label}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(key, e)}
              className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {faces[key] && (
              <p className="text-xs text-green-600">✓ Loaded</p>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleLoadPanorama} className="w-full mt-4" size="sm">
        Load Panorama
      </Button>

      <p className="text-xs text-muted-foreground mt-3">
        Note: This is a temporary test UI. Full node management coming in Phase 5.
      </p>
    </Card>
  )
}
