/**
 * Export IPC Handlers
 *
 * Handles game export operations:
 * - Choose export destination
 * - Transform project data
 * - Build player with Vite
 * - Copy assets and built files
 */

import { ipcMain, dialog } from 'electron'
import { mkdir, writeFile, copyFile, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { spawn } from 'child_process'
import { transformProjectToGameData, ValidationError } from '../transformers/gameDataTransformer'

/**
 * Standard IPC response format
 */
interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Export options
 */
interface ExportOptions {
  projectPath: string
  exportPath: string
  projectData: unknown // Will be validated in handler
}

/**
 * Export result
 */
interface ExportResult {
  exportPath: string
  gameUrl: string
}

/**
 * Register all export-related IPC handlers
 */
export function registerExportHandlers(): void {
  // Choose export destination
  ipcMain.handle('export:chooseDestination', handleChooseExportDestination)

  // Export project
  ipcMain.handle('export:project', handleExportProject)
}

/**
 * Show dialog to choose export destination
 */
async function handleChooseExportDestination(): Promise<IPCResponse<string>> {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Export Game',
      buttonLabel: 'Export',
      defaultPath: 'my-game',
      properties: ['createDirectory', 'showOverwriteConfirmation']
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export cancelled' }
    }

    return {
      success: true,
      data: result.filePath
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to choose export destination'
    }
  }
}

/**
 * Export project as playable web game
 *
 * Workflow:
 * 1. Validate and transform project data
 * 2. Create export directory structure
 * 3. Build player with Vite
 * 4. Copy built files to export directory
 * 5. Copy panorama assets
 * 6. Write game.json
 * 7. Return export path
 */
async function handleExportProject(
  _event: Electron.IpcMainInvokeEvent,
  options: ExportOptions
): Promise<IPCResponse<ExportResult>> {
  try {
    const { projectPath, exportPath, projectData } = options

    // Step 1: Transform project data to game data
    console.log('[Export] Step 1: Transforming project data...')
    const gameData = transformProjectToGameData(projectData as any)

    // Step 2: Create export directory structure
    console.log('[Export] Step 2: Creating export directories...')
    await mkdir(exportPath, { recursive: true })
    await mkdir(join(exportPath, 'assets', 'panoramas'), { recursive: true })
    await mkdir(join(exportPath, 'assets', 'data'), { recursive: true })

    // Step 3: Build player with Vite
    console.log('[Export] Step 3: Building player...')
    // __dirname is out/main/ in built code, so go up 2 levels to project root
    const playerPath = join(__dirname, '../../player')
    console.log('[Export] Player path:', playerPath)
    await buildPlayer(playerPath)

    // Step 4: Copy built player files to export directory
    console.log('[Export] Step 4: Copying player files...')
    const playerDistPath = join(playerPath, 'dist')

    // Copy index.html from player dist
    await copyFile(join(playerDistPath, 'index.html'), join(exportPath, 'index.html'))

    // Copy JavaScript bundles from player/dist/assets/*.js to export/assets/*.js
    const playerAssetsPath = join(playerDistPath, 'assets')
    const exportAssetsPath = join(exportPath, 'assets')
    const assetFiles = await readdir(playerAssetsPath)

    for (const file of assetFiles) {
      // Only copy built assets (.js, .css, and their source maps), not data/ or panoramas/ directories
      if (
        file.endsWith('.js') ||
        file.endsWith('.js.map') ||
        file.endsWith('.css') ||
        file.endsWith('.css.map')
      ) {
        await copyFile(join(playerAssetsPath, file), join(exportAssetsPath, file))
      }
    }

    // Step 5: Copy panorama assets from project
    console.log('[Export] Step 5: Copying panorama assets...')
    const projectPanoramasPath = join(projectPath, 'assets', 'panoramas')
    const exportPanoramasPath = join(exportPath, 'assets', 'panoramas')
    await copyDirectory(projectPanoramasPath, exportPanoramasPath)

    // Step 6: Write game.json
    console.log('[Export] Step 6: Writing game data...')
    const gameJsonPath = join(exportPath, 'assets', 'data', 'game.json')
    await writeFile(gameJsonPath, JSON.stringify(gameData, null, 2), 'utf-8')

    console.log('[Export] Export complete!')

    return {
      success: true,
      data: {
        exportPath,
        gameUrl: join(exportPath, 'index.html')
      }
    }
  } catch (error) {
    // Handle validation errors specially
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export project'
    }
  }
}

/**
 * Get Node.js executable path
 *
 * In Electron, process.execPath points to Electron binary, not Node.js.
 * We need to find the actual Node.js binary that can run scripts.
 *
 * Strategy:
 * 1. Try npm_node_execpath (set when Electron is launched via npm)
 * 2. Try npm_execpath and derive node from npm location
 * 3. Fallback to common locations
 */
function getNodePath(): string {
  const isWindows = process.platform === 'win32'

  // Strategy 1: npm sets npm_node_execpath when running scripts
  if (process.env.npm_node_execpath) {
    console.log('[Export] Found node via npm_node_execpath:', process.env.npm_node_execpath)
    return process.env.npm_node_execpath
  }

  // Strategy 2: Derive from npm location
  if (process.env.npm_execpath) {
    // npm_execpath is like /Users/user/.nvm/versions/node/v23.9.0/lib/node_modules/npm/bin/npm-cli.js
    // We need /Users/user/.nvm/versions/node/v23.9.0/bin/node
    const npmPath = process.env.npm_execpath
    const nodeDir = join(npmPath, '..', '..', '..', '..', 'bin')
    const nodePath = join(nodeDir, isWindows ? 'node.exe' : 'node')
    console.log('[Export] Derived node path from npm:', nodePath)
    return nodePath
  }

  // Strategy 3: Common nvm location (macOS/Linux)
  if (!isWindows && process.env.HOME) {
    const nvmNodePath = join(process.env.HOME, '.nvm/versions/node/v23.9.0/bin/node')
    console.log('[Export] Trying nvm default location:', nvmNodePath)
    return nvmNodePath
  }

  // Fallback: hope it's in PATH
  console.log('[Export] Falling back to node in PATH')
  return isWindows ? 'node.exe' : 'node'
}

/**
 * Run a Node.js script directly using the Node.js binary
 *
 * This bypasses npm and shell invocation entirely.
 */
function runNodeScript(
  scriptPath: string,
  args: string[],
  cwd: string,
  label: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const nodePath = getNodePath()

    console.log(`[${label}] Running: ${nodePath} ${scriptPath} ${args.join(' ')}`)
    console.log(`[${label}] CWD: ${cwd}`)

    const child = spawn(nodePath, [scriptPath, ...args], {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      const text = data.toString()
      stdout += text
      console.log(`[${label}]`, text.trim())
    })

    child.stderr?.on('data', (data) => {
      const text = data.toString()
      stderr += text
      // Vite outputs to stderr, so log but don't treat as error
      console.log(`[${label}]`, text.trim())
    })

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn node: ${error.message}`))
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`${label} exited with code ${code}\n${stderr}`))
      }
    })
  })
}

/**
 * Build player using Vite
 *
 * Runs vite.js directly using Node.js (bypasses npm/shell entirely)
 *
 * Prerequisites: player/node_modules must exist
 * (Run 'npm install' manually in player/ directory if needed)
 */
async function buildPlayer(playerPath: string): Promise<void> {
  try {
    // Verify node_modules exists
    const nodeModulesPath = join(playerPath, 'node_modules')
    try {
      await stat(nodeModulesPath)
      console.log('[Export] Player dependencies found')
    } catch {
      throw new Error(
        'Player dependencies not found. Please run "npm install" in the player/ directory first.'
      )
    }

    // Run Vite build directly using Node.js
    console.log('[Export] Running Vite build...')
    const viteScriptPath = join(playerPath, 'node_modules', 'vite', 'bin', 'vite.js')

    // Verify vite.js exists
    try {
      await stat(viteScriptPath)
    } catch {
      throw new Error(
        'Vite not found in player dependencies. Please run "npm install" in the player/ directory.'
      )
    }

    await runNodeScript(viteScriptPath, ['build'], playerPath, 'Vite Build')

    console.log('[Export] Player build complete!')
  } catch (error) {
    throw new Error(
      `Failed to build player: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Recursively copy directory contents
 *
 * @param srcDir - Source directory
 * @param destDir - Destination directory
 * @param skip - Directory names to skip (e.g., ['assets'] when copying player dist)
 */
async function copyDirectory(
  srcDir: string,
  destDir: string,
  skip: string[] = []
): Promise<void> {
  try {
    // Ensure destination exists
    await mkdir(destDir, { recursive: true })

    // Read source directory
    const entries = await readdir(srcDir, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = join(srcDir, entry.name)
      const destPath = join(destDir, entry.name)

      if (entry.isDirectory()) {
        // Skip if in skip list
        if (skip.includes(entry.name)) {
          continue
        }

        // Recursively copy directory
        await copyDirectory(srcPath, destPath, skip)
      } else {
        // Copy file
        await copyFile(srcPath, destPath)
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to copy directory: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
