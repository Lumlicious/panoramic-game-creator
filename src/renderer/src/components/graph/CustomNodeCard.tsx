/**
 * Custom Node Card Component for React Flow
 * Phase 6: Node Graph Visualization
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { GraphNodeData } from '@/types/graph'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, AlertTriangle, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/stores/projectStore'
import { getThumbnailUrl } from '@/lib/imageImport'

/**
 * Custom node component for React Flow
 * Type-safe props using NodeProps<GraphNodeData>
 */
export const CustomNodeCard = memo(({ data, selected }: NodeProps<GraphNodeData>) => {
  const projectPath = useProjectStore((state) => state.projectPath)

  // Resolve thumbnail path to absolute URL using Electron's local:// protocol
  const thumbnailUrl =
    data.thumbnailPath && projectPath ? getThumbnailUrl(projectPath, data.thumbnailPath) : null

  return (
    <>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="!bg-blue-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="!bg-blue-500 !w-3 !h-3"
      />

      <Card
        className={cn(
          'min-w-[200px] max-w-[200px] overflow-hidden transition-all cursor-pointer',
          selected && 'ring-2 ring-blue-500 shadow-lg',
          data.isOrphaned && 'border-orange-500',
          data.isStartNode && 'border-green-500 border-2'
        )}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[2/1] overflow-hidden bg-slate-800">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={data.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500 text-xs">
              No Image
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-2 right-2 flex gap-1 flex-col items-end">
            {data.isStartNode && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <Star className="mr-1 h-3 w-3" />
                Start
              </Badge>
            )}
            {data.isOrphaned && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Orphaned
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <CardHeader className="p-3">
          <CardTitle className="font-semibold truncate text-sm">{data.name}</CardTitle>

          <CardDescription className="flex items-center gap-3 text-xs mt-1">
            <div className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              <span>{data.hotspotCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {data.outgoingConnections} out / {data.incomingConnections} in
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  )
})

CustomNodeCard.displayName = 'CustomNodeCard'
