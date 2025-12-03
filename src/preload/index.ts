import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  FileAPI,
  ProjectAPI,
  ExportAPI,
  RecentProjectsAPI,
  ProjectData,
  ExportOptions
} from '../shared/types/ipc'

// Custom APIs for renderer
const api = {}

// File API - exposes file operations to renderer
const fileAPI: FileAPI = {
  pickImage: () => ipcRenderer.invoke('file:pickImage'),
  pickImages: () => ipcRenderer.invoke('file:pickImages'),
  validateEquirectangular: (filePath: string) =>
    ipcRenderer.invoke('file:validateEquirectangular', filePath),
  validateCubicFaces: (filePaths: string[]) =>
    ipcRenderer.invoke('file:validateCubicFaces', filePaths),
  copyToProject: (sourcePath: string, projectPath: string, destRelativePath: string) =>
    ipcRenderer.invoke('file:copyToProject', sourcePath, projectPath, destRelativePath),
  generateThumbnail: (sourcePath: string, outputPath: string) =>
    ipcRenderer.invoke('file:generateThumbnail', sourcePath, outputPath)
}

// Project API - exposes project lifecycle operations to renderer
const projectAPI: ProjectAPI = {
  newProject: () => ipcRenderer.invoke('project:new'),
  saveProject: (projectPath: string, projectData: ProjectData) =>
    ipcRenderer.invoke('project:save', projectPath, projectData),
  openProject: () => ipcRenderer.invoke('project:open'),
  openProjectByPath: (projectPath: string) => ipcRenderer.invoke('project:openByPath', projectPath)
}

// Export API - exposes export operations to renderer
const exportAPI: ExportAPI = {
  chooseExportDestination: () => ipcRenderer.invoke('export:chooseDestination'),
  exportProject: (options: ExportOptions) => ipcRenderer.invoke('export:project', options)
}

// Recent Projects API - exposes recent projects storage to renderer
const recentProjectsAPI: RecentProjectsAPI = {
  getRecent: () => ipcRenderer.invoke('recentProjects:get'),
  addRecent: (projectPath: string, projectName?: string) =>
    ipcRenderer.invoke('recentProjects:add', projectPath, projectName),
  removeRecent: (projectPath: string) => ipcRenderer.invoke('recentProjects:remove', projectPath),
  clearRecent: () => ipcRenderer.invoke('recentProjects:clear')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('fileAPI', fileAPI)
    contextBridge.exposeInMainWorld('projectAPI', projectAPI)
    contextBridge.exposeInMainWorld('exportAPI', exportAPI)
    contextBridge.exposeInMainWorld('recentProjectsAPI', recentProjectsAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.fileAPI = fileAPI
  // @ts-ignore (define in dts)
  window.projectAPI = projectAPI
  // @ts-ignore (define in dts)
  window.exportAPI = exportAPI
  // @ts-ignore (define in dts)
  window.recentProjectsAPI = recentProjectsAPI
}
