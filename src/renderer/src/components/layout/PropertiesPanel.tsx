import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { TestCubicLoader } from '@/components/TestCubicLoader'
import { useState } from 'react'

/**
 * PropertiesPanel Component
 *
 * Right sidebar displaying properties of the selected node.
 * Shows TestCubicLoader when no node selected for testing.
 * Full property editing will be implemented in Phase 5.
 */

export function PropertiesPanel() {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId)
  const getNode = useProjectStore((state) => state.getNode)
  const [testResult, setTestResult] = useState<string>('')

  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : undefined

  // Test function for equirectangular validation
  const handleTestEquirectangular = async () => {
    try {
      const result = await window.fileAPI.pickImage()
      if (result.success && result.data) {
        setTestResult(`Selected: ${result.data.fileName}`)

        // Test validation
        const validation = await window.fileAPI.validateEquirectangular(result.data.filePath)
        if (validation.success && validation.data) {
          if (validation.data.valid) {
            setTestResult(prev => `${prev}\nValid equirectangular! ${validation.data?.metadata?.width}x${validation.data?.metadata?.height}`)
          } else {
            setTestResult(prev => `${prev}\nInvalid: ${validation.data?.error}`)
          }
        }
      } else {
        setTestResult('No file selected')
      }
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Test function for cubic validation
  const handleTestCubic = async () => {
    try {
      const result = await window.fileAPI.pickImages()
      if (result.success && result.data) {
        setTestResult(`Selected ${result.data.length} files:\n${result.data.map(f => f.fileName).join('\n')}`)

        // Test validation
        const validation = await window.fileAPI.validateCubicFaces(result.data.map(f => f.filePath))
        if (validation.success && validation.data) {
          const allValid = validation.data.every(v => v.valid)
          if (allValid) {
            const firstMeta = validation.data[0]?.metadata
            setTestResult(prev => `${prev}\n\nAll faces valid! ${firstMeta?.width}x${firstMeta?.height} each`)
          } else {
            const errors = validation.data
              .map((v, i) => v.valid ? null : `Face ${i + 1}: ${v.error}`)
              .filter(Boolean)
              .join('\n')
            setTestResult(prev => `${prev}\n\nInvalid:\n${errors}`)
          }
        }
      } else {
        setTestResult('No files selected')
      }
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <aside className="w-64 border-l bg-background">
      {/* Panel Header */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">Properties</h2>
      </div>

      {/* Properties Content */}
      <ScrollArea className="h-[calc(100vh-3.5rem-3rem)]">
        <div className="p-4 space-y-4">
          {/* IPC Test Section */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">IPC Test</h3>
            <div className="space-y-2">
              <Button onClick={handleTestEquirectangular} size="sm" className="w-full">
                Test Equirectangular
              </Button>
              <Button onClick={handleTestCubic} size="sm" className="w-full" variant="outline">
                Test Cubic (6 faces)
              </Button>
            </div>
            {testResult && (
              <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted p-2 rounded max-h-48 overflow-y-auto">
                {testResult}
              </pre>
            )}
          </Card>

          {selectedNode ? (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Node Properties</h3>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>ID:</strong> {selectedNode.id}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>Name:</strong> {selectedNode.name}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>Type:</strong> {selectedNode.panorama.type}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Hotspots:</strong> {selectedNode.hotspots.length}
              </p>
              {/* TODO: Phase 5 - Add property editing forms */}
            </Card>
          ) : (
            <TestCubicLoader />
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
