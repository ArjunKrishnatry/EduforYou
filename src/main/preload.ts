import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Theme
  onThemeChange: (callback: (isDark: boolean) => void) => {
    ipcRenderer.on('theme-changed', (_event, isDark) => callback(isDark))
  },

  // Placeholder for future IPC methods
  // These will be added in later phases:
  // - File operations
  // - LLM analysis
  // - Data persistence
  // - Calendar sync
  // - Notifications
})

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      onThemeChange: (callback: (isDark: boolean) => void) => void
    }
  }
}
