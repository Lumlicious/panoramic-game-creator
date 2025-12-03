import { ElectronAPI } from '@electron-toolkit/preload'
import type { FileAPI, ProjectAPI, ExportAPI } from '../shared/types/ipc'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    fileAPI: FileAPI
    projectAPI: ProjectAPI
    exportAPI: ExportAPI
  }
}
