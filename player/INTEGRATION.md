# Player Integration Guide

How to integrate the player with the editor's export system (Phase 7 Step 5).

## Export Flow Overview

```
Editor → IPC Handler → Export Builder → Vite Build → Web Folder
```

## 1. Project → GameData Transformation

The editor's `project.json` needs to be transformed to player's `game.json`.

### Input: Editor Project Format

```json
{
  "id": "project-123",
  "name": "My Adventure",
  "version": "1.0.0",
  "startNodeId": "node-abc",
  "nodes": [
    {
      "id": "node-abc",
      "name": "Room 1",
      "panorama": {
        "type": "equirectangular",
        "filePath": "assets/panoramas/node-abc.jpg",
        "thumbnailPath": "assets/thumbnails/node-abc.jpg"
      },
      "hotspots": [
        {
          "id": "hotspot-1",
          "name": "Door",
          "targetNodeId": "node-def",
          "polygon": [...],
          "style": { ... },
          "enabled": true
        }
      ],
      "position": { "x": 100, "y": 200 }
    }
  ],
  "settings": { ... },
  "graphLayout": { ... }
}
```

### Output: Player Game Format

```json
{
  "version": "1.0.0",
  "settings": {
    "title": "My Adventure",
    "startNodeId": "node-abc"
  },
  "nodes": [
    {
      "id": "node-abc",
      "name": "Room 1",
      "panorama": {
        "type": "equirectangular",
        "url": "./assets/panoramas/node-abc.jpg"
      },
      "hotspots": [
        {
          "id": "hotspot-1",
          "name": "Door",
          "polygon": [...],
          "targetNodeId": "node-def",
          "interactionType": "navigate",
          "metadata": {}
        }
      ]
    }
  ]
}
```

### Transformation Function

```typescript
// In editor: electron/main/exportHandlers.ts

import type { Project } from '@/types'
import type { GameData, GameNode, GameHotspot } from '../../../player/src/types/game'

function transformProjectToGameData(
  project: Project,
  cdnBaseUrl?: string
): GameData {
  const nodes: GameNode[] = project.nodes.map(node => ({
    id: node.id,
    name: node.name,
    panorama: {
      type: node.panorama.type,
      url: buildAssetUrl(node.panorama.filePath!, cdnBaseUrl)
    },
    hotspots: node.hotspots
      .filter(h => h.enabled && h.targetNodeId) // Only enabled hotspots with targets
      .map(h => ({
        id: h.id,
        name: h.name,
        polygon: h.polygon,
        targetNodeId: h.targetNodeId!,
        interactionType: 'navigate' as const, // Default for MVP
        metadata: {}
      }))
  }))

  return {
    version: '1.0.0',
    settings: {
      title: project.name,
      startNodeId: project.startNodeId || nodes[0]?.id || ''
    },
    nodes
  }
}

function buildAssetUrl(relativePath: string, cdnBaseUrl?: string): string {
  const filename = path.basename(relativePath)

  if (cdnBaseUrl) {
    // CDN mode: https://cdn.example.com/panoramas/node-abc.jpg
    return `${cdnBaseUrl}/panoramas/${filename}`
  } else {
    // Local mode: ./assets/panoramas/node-abc.jpg
    return `./assets/panoramas/${filename}`
  }
}
```

## 2. Export Process Steps

### Step 1: Create Export Directory

```typescript
const exportPath = path.join(projectDir, 'export')
await fs.mkdir(exportPath, { recursive: true })
await fs.mkdir(path.join(exportPath, 'assets', 'panoramas'), { recursive: true })
await fs.mkdir(path.join(exportPath, 'assets', 'data'), { recursive: true })
```

### Step 2: Transform and Write game.json

```typescript
const gameData = transformProjectToGameData(projectData, cdnUrl)
await fs.writeFile(
  path.join(exportPath, 'assets', 'data', 'game.json'),
  JSON.stringify(gameData, null, 2),
  'utf-8'
)
```

### Step 3: Copy Panorama Assets

```typescript
for (const node of projectData.nodes) {
  const srcPath = path.join(projectDir, node.panorama.filePath!)
  const dstPath = path.join(exportPath, 'assets', 'panoramas', path.basename(node.panorama.filePath!))

  // Optional: Optimize images (resize, compress)
  await optimizeImage(srcPath, dstPath, {
    maxWidth: 4096,
    quality: 85
  })
}
```

### Step 4: Build Player with Vite

```typescript
// Copy player source to export directory
await fs.copy(
  path.join(__dirname, '../../../player'),
  path.join(exportPath, 'player-build'),
  {
    filter: (src) => !src.includes('node_modules') && !src.includes('.git')
  }
)

// Install dependencies and build
await execAsync('npm install', { cwd: path.join(exportPath, 'player-build') })
await execAsync('npm run build', { cwd: path.join(exportPath, 'player-build') })

// Move built files to root
await fs.move(
  path.join(exportPath, 'player-build', 'dist'),
  path.join(exportPath, 'dist'),
  { overwrite: true }
)

// Clean up build directory
await fs.remove(path.join(exportPath, 'player-build'))
```

### Step 5: Generate Deployment Files

```typescript
// Create _headers for CDN caching
const headers = `
/assets/panoramas/*
  Cache-Control: public, max-age=31536000, immutable

/assets/data/*
  Cache-Control: public, max-age=300

/assets/*.js
  Cache-Control: public, max-age=31536000, immutable
`
await fs.writeFile(path.join(exportPath, 'dist', '_headers'), headers)

// Create README with deployment instructions
const readme = generateDeploymentReadme(projectData.name, cdnUrl)
await fs.writeFile(path.join(exportPath, 'README.md'), readme)
```

## 3. Export Dialog UI

### ExportDialog Component

```typescript
// In editor: src/renderer/src/components/dialogs/ExportDialog.tsx

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const [useCDN, setUseCDN] = useState(false)
  const [cdnUrl, setCdnUrl] = useState('')
  const [optimizeImages, setOptimizeImages] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleExport = async () => {
    setIsExporting(true)

    const result = await window.electronAPI.exportProject({
      cdnUrl: useCDN ? cdnUrl : undefined,
      optimizeImages
    })

    if (result.success) {
      // Show success notification
      // Open export folder
      await window.electronAPI.openPath(result.exportPath)
    } else {
      // Show error
    }

    setIsExporting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Game</DialogTitle>
        </DialogHeader>

        {/* CDN Option */}
        <div>
          <Checkbox checked={useCDN} onCheckedChange={setUseCDN} />
          <Label>Use CDN for panoramas</Label>
          {useCDN && (
            <Input
              placeholder="https://cdn.example.com/my-game"
              value={cdnUrl}
              onChange={(e) => setCdnUrl(e.target.value)}
            />
          )}
        </div>

        {/* Optimization */}
        <div>
          <Checkbox checked={optimizeImages} onCheckedChange={setOptimizeImages} />
          <Label>Optimize images (resize to 4K, 85% quality)</Label>
        </div>

        {/* Progress */}
        {isExporting && (
          <Progress value={progress} />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## 4. IPC Handlers

### Export Handler

```typescript
// In editor: electron/main/exportHandlers.ts

import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs-extra'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ExportOptions {
  cdnUrl?: string
  optimizeImages?: boolean
}

ipcMain.handle('export-project', async (event, options: ExportOptions) => {
  try {
    // Get current project path
    const projectPath = getProjectPath() // From projectStore

    if (!projectPath) {
      return { success: false, error: 'No project open' }
    }

    // Choose export location
    const result = await dialog.showSaveDialog({
      title: 'Export Game',
      defaultPath: path.join(app.getPath('documents'), 'my-game'),
      buttonLabel: 'Export'
    })

    if (result.canceled) {
      return { success: false, error: 'Export canceled' }
    }

    const exportPath = result.filePath!

    // Load project data
    const projectData = await loadProjectJSON(projectPath)

    // Transform to game data
    const gameData = transformProjectToGameData(projectData, options.cdnUrl)

    // Create export structure
    await createExportStructure(exportPath)

    // Write game.json
    await writeGameData(exportPath, gameData)

    // Copy panoramas
    await copyPanoramas(projectPath, exportPath, projectData, options.optimizeImages)

    // Build player
    await buildPlayer(exportPath)

    // Generate deployment files
    await generateDeploymentFiles(exportPath, options.cdnUrl)

    return {
      success: true,
      exportPath: path.join(exportPath, 'dist')
    }
  } catch (error) {
    console.error('Export failed:', error)
    return { success: false, error: error.message }
  }
})
```

## 5. Testing the Export

### Manual Test

1. Open a project in editor
2. Click "Export Game" in menu
3. Choose export location
4. Wait for build to complete
5. Navigate to `export/dist/`
6. Open `index.html` in browser OR deploy to web host

### Automated Test

```typescript
// Test export transformation
const testProject: Project = { /* ... */ }
const gameData = transformProjectToGameData(testProject)

expect(gameData.version).toBe('1.0.0')
expect(gameData.nodes).toHaveLength(testProject.nodes.length)
expect(gameData.settings.startNodeId).toBe(testProject.startNodeId)
```

## 6. Deployment Options

### Option 1: Vercel

```bash
cd export/dist
npx vercel --prod
```

### Option 2: Netlify

```bash
cd export/dist
npx netlify deploy --prod --dir=.
```

### Option 3: GitHub Pages

```bash
cd export/dist
git init
git add .
git commit -m "Deploy game"
git remote add origin https://github.com/user/repo.git
git push -f origin main:gh-pages
```

### Option 4: Static Server

```bash
cd export/dist
python -m http.server 8000
# Visit http://localhost:8000
```

## 7. CDN Upload (Manual for MVP)

If CDN option enabled:

1. Export with CDN URL
2. Upload `export/assets/panoramas/*` to CDN
3. Deploy `export/dist/*` to web host
4. Panoramas load from CDN, app from web host

**Future**: Automate CDN upload (S3, Cloudflare R2, etc.)

## Next Phase Integration

**Phase 7 Step 5**: Implement this export infrastructure in editor

**Files to create**:
- `electron/main/exportHandlers.ts` - Main export logic
- `src/renderer/src/components/dialogs/ExportDialog.tsx` - UI
- `electron/preload/index.ts` - Add `exportProject` IPC method

**Estimated time**: 2-3 days

---

**Status**: Integration guide complete
**Ready for**: Phase 7 Step 5 implementation
