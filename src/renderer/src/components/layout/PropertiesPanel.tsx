import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

/**
 * PropertiesPanel Component
 *
 * Right sidebar displaying properties of the selected node or hotspot.
 * Allows editing node names, setting start nodes, managing hotspot targets, etc.
 * Phase 5.5 Implementation.
 */

export function PropertiesPanel() {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId)
  const selectedHotspotId = useEditorStore((state) => state.selectedHotspotId)
  const setSelectedHotspotId = useEditorStore((state) => state.setSelectedHotspotId)
  const setDirty = useEditorStore((state) => state.setDirty)

  const getNode = useProjectStore((state) => state.getNode)
  const nodes = useProjectStore((state) => state.nodes)
  const updateNode = useProjectStore((state) => state.updateNode)
  const updateHotspot = useProjectStore((state) => state.updateHotspot)
  const removeHotspot = useProjectStore((state) => state.removeHotspot)
  const startNodeId = useProjectStore((state) => state.startNodeId)
  const setStartNode = useProjectStore((state) => state.setStartNode)

  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : undefined
  const selectedHotspot = selectedNode?.hotspots.find((h) => h.id === selectedHotspotId)

  // Local state for form inputs
  const [nodeName, setNodeName] = useState('')
  const [hotspotName, setHotspotName] = useState('')

  // Sync local state with store when selection changes
  useEffect(() => {
    if (selectedNode) {
      setNodeName(selectedNode.name)
    }
  }, [selectedNode])

  useEffect(() => {
    if (selectedHotspot) {
      setHotspotName(selectedHotspot.name)
    }
  }, [selectedHotspot])

  const handleNodeNameUpdate = () => {
    if (selectedNodeId && nodeName.trim()) {
      updateNode(selectedNodeId, { name: nodeName.trim() })
      setDirty(true)
    }
  }

  const handleStartNodeToggle = (checked: boolean) => {
    if (selectedNodeId) {
      if (checked) {
        setStartNode(selectedNodeId)
      } else {
        // Note: There's no unsetStartNode method, so we'll need to handle this
        // For now, just set to empty string to clear
        setStartNode('')
      }
      setDirty(true)
    }
  }

  const handleHotspotNameUpdate = () => {
    if (selectedNodeId && selectedHotspotId && hotspotName.trim()) {
      updateHotspot(selectedNodeId, selectedHotspotId, { name: hotspotName.trim() })
      setDirty(true)
    }
  }

  const handleHotspotTargetChange = (targetNodeId: string) => {
    if (selectedNodeId && selectedHotspotId) {
      updateHotspot(selectedNodeId, selectedHotspotId, { targetNodeId })
      setDirty(true)
    }
  }

  const handleDeleteHotspot = () => {
    if (selectedNodeId && selectedHotspotId) {
      removeHotspot(selectedNodeId, selectedHotspotId)
      setSelectedHotspotId(null)
      setDirty(true)
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
          {selectedHotspot ? (
            /* Hotspot Properties Card */
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Hotspot Properties</h3>

              {/* Hotspot Name */}
              <div className="space-y-2 mb-3">
                <label className="text-xs text-muted-foreground">Name</label>
                <div className="flex gap-2">
                  <Input
                    value={hotspotName}
                    onChange={(e) => setHotspotName(e.target.value)}
                    onBlur={handleHotspotNameUpdate}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleHotspotNameUpdate()
                      }
                    }}
                    className="h-8 text-xs"
                    placeholder="Hotspot name"
                  />
                </div>
              </div>

              {/* Target Node Selection */}
              <div className="space-y-2 mb-3">
                <label className="text-xs text-muted-foreground">Links To</label>
                <Select
                  value={selectedHotspot.targetNodeId || 'none'}
                  onValueChange={(value) => {
                    handleHotspotTargetChange(value === 'none' ? '' : value)
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select target node" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      No target
                    </SelectItem>
                    {nodes
                      .filter((n) => n.id !== selectedNodeId) // Don't allow self-linking
                      .map((node) => (
                        <SelectItem key={node.id} value={node.id} className="text-xs">
                          {node.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Polygon Info */}
              <div className="space-y-1 mb-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Vertices:</strong> {selectedHotspot.polygon.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Enabled:</strong> {selectedHotspot.enabled ? 'Yes' : 'No'}
                </p>
              </div>

              {/* Delete Button */}
              <Button
                onClick={handleDeleteHotspot}
                size="sm"
                variant="destructive"
                className="w-full h-8 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete Hotspot
              </Button>
            </Card>
          ) : selectedNode ? (
            /* Node Properties Card */
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Node Properties</h3>

              {/* Node Name */}
              <div className="space-y-2 mb-3">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  onBlur={handleNodeNameUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNodeNameUpdate()
                    }
                  }}
                  className="h-8 text-xs"
                  placeholder="Node name"
                />
              </div>

              {/* Start Node Checkbox */}
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="start-node"
                  checked={startNodeId === selectedNodeId}
                  onCheckedChange={handleStartNodeToggle}
                />
                <label
                  htmlFor="start-node"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Set as Start Node
                </label>
              </div>

              {/* Panorama Type */}
              <div className="space-y-1 mb-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Type:</strong> {selectedNode.panorama.type}
                </p>
              </div>

              {/* Hotspots List */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">
                  Hotspots ({selectedNode.hotspots.length})
                </label>
                {selectedNode.hotspots.length > 0 ? (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedNode.hotspots.map((hotspot) => {
                      const targetNode = hotspot.targetNodeId
                        ? getNode(hotspot.targetNodeId)
                        : null

                      return (
                        <button
                          key={hotspot.id}
                          onClick={() => setSelectedHotspotId(hotspot.id)}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs border transition-colors ${
                            selectedHotspotId === hotspot.id
                              ? 'bg-primary/10 border-primary'
                              : 'bg-muted/50 border-transparent hover:bg-muted'
                          }`}
                        >
                          <div className="font-medium">{hotspot.name}</div>
                          <div className="text-muted-foreground text-[10px]">
                            → {targetNode ? targetNode.name : 'No target'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No hotspots yet</p>
                )}
              </div>
            </Card>
          ) : (
            /* No Selection State */
            <Card className="p-4">
              <p className="text-xs text-muted-foreground text-center">
                Select a node or hotspot to edit properties
              </p>
            </Card>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
