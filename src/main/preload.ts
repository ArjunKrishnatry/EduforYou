import { contextBridge, ipcRenderer } from 'electron'

// Types for file operations
interface ParseResult {
  success: boolean
  fileName?: string
  text?: string
  pages?: number
  charCount?: number
  error?: string
}

interface MultiParseResult {
  success: boolean
  files?: string[]
  text?: string
  charCount?: number
  error?: string
}

interface ChunkResult {
  chunks: string[]
  count: number
}

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Theme
  onThemeChange: (callback: (isDark: boolean) => void) => {
    ipcRenderer.on('theme-changed', (_event, isDark) => callback(isDark))
  },

  // File operations
  selectFiles: (): Promise<string[] | null> => {
    return ipcRenderer.invoke('file:select')
  },

  parseFile: (filePath: string): Promise<ParseResult> => {
    return ipcRenderer.invoke('file:parse', filePath)
  },

  parseMultipleFiles: (filePaths: string[]): Promise<MultiParseResult> => {
    return ipcRenderer.invoke('file:parseMultiple', filePaths)
  },

  chunkText: (text: string, maxChunkSize?: number): Promise<ChunkResult> => {
    return ipcRenderer.invoke('file:chunk', text, maxChunkSize)
  },
})

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      // Theme
      onThemeChange: (callback: (isDark: boolean) => void) => void

      // File operations
      selectFiles: () => Promise<string[] | null>
      parseFile: (filePath: string) => Promise<ParseResult>
      parseMultipleFiles: (filePaths: string[]) => Promise<MultiParseResult>
      chunkText: (text: string, maxChunkSize?: number) => Promise<ChunkResult>
    }
  }
}
