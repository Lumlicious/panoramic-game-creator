/**
 * Graph View Component - Main React Flow Container
 * Phase 6: Node Graph Visualization
 */

import { useCallback, useEffect, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
  useNodesState,
  useEdgesState
} from 'reactflow'
import 'reactflow/dist/style.css'

import type { GraphNode } from '@/types/graph'
import { useGraphData } from '@/lib/graphSelectors'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import { CustomNodeCard } from './CustomNodeCard'
import { throttle } from 'lodash-es'

// Define custom node types for React Flow
const nodeTypes = {
  customNode: CustomNodeCard
}

/**
 * Main Node Graph component using React Flow
 * Type-safe event handlers and state management
 */
function GraphViewInner(): JSX.Element {
  const { nodes: projectNodes, edges: projectEdges } = useGraphData()
  const updateNodePosition = useProjectStore((state) => state.updateNodePosition)
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId)
  const setViewMode = useEditorStore((state) => state.setViewMode)
  const shouldFitView = useEditorStore((state) => state.graphView.shouldFitView)
  const clearFitViewTrigger = useEditorStore((state) => state.clearFitViewTrigger)

  const { fitView } = useReactFlow()

  // Use React Flow's internal state management
  const [nodes, setNodes, onNodesChange] = useNodesState(projectNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(projectEdges)

  // Sync React Flow state with project store
  useEffect(() => {
    setNodes(projectNodes)
  }, [projectNodes, setNodes])

  useEffect(() => {
    setEdges(projectEdges)
  }, [projectEdges, setEdges])

  // Debug: Log what we're rendering
  console.log('GraphView rendering:', nodes.length, 'nodes', nodes.map(n => ({ id: n.id, pos: n.position })))

  /**
   * Throttled position update to avoid excessive store mutations
   */
  const debouncedUpdatePosition = useMemo(
    () =>
      throttle((nodeId: string, position: { x: number; y: number }) => {
        updateNodePosition(nodeId, position)
      }, 100),
    [updateNodePosition]
  )

  /**
   * Custom onNodesChange to handle both React Flow updates and persistence
   */
  const handleNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes to React Flow's internal state
      onNodesChange(changes)

      // Persist position changes to project store
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          // Only save when drag is complete (dragging = false)
          debouncedUpdatePosition(change.id, change.position)
        }
      }
    },
    [onNodesChange, debouncedUpdatePosition]
  )

  /**
   * Handle edge changes (apply to React Flow but don't persist)
   */
  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Apply changes to React Flow's internal state
      onEdgesChange(changes)
      // Note: Edges are derived from hotspots, so we don't persist changes
    },
    [onEdgesChange]
  )

  /**
   * Handle node selection - click to select + switch to editor
   */
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: GraphNode) => {
      setSelectedNodeId(node.id)
      setViewMode('editor')
    },
    [setSelectedNodeId, setViewMode]
  )

  /**
   * Prevent user from creating connections (handled by hotspots)
   */
  const onConnect = useCallback((_connection: Connection) => {
    // No-op: connections are managed through hotspots in Editor view
    console.warn('Direct connections not allowed - use hotspots in Editor view')
  }, [])

  /**
   * Fit view when triggered
   */
  useEffect(() => {
    if (shouldFitView) {
      fitView({ padding: 0.2, duration: 300 })
      clearFitViewTrigger()
    }
  }, [shouldFitView, fitView, clearFitViewTrigger])

  // Empty state message
  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">No nodes yet</p>
          <p className="text-sm">Create a node to start building your game</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={onNodeClick}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const graphNode = node as GraphNode
            if (graphNode.data.isStartNode) return '#10b981' // Green
            if (graphNode.data.isOrphaned) return '#f97316' // Orange
            if (graphNode.data.isSelected) return '#3b82f6' // Blue
            return '#64748b' // Gray
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  )
}

/**
 * Wrapper with ReactFlowProvider for context
 */
export function GraphView(): JSX.Element {
  return (
    <ReactFlowProvider>
      <GraphViewInner />
    </ReactFlowProvider>
  )
}
