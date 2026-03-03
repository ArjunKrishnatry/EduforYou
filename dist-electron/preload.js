import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // Theme
  onThemeChange: (callback) => {
    ipcRenderer.on("theme-changed", (_event, isDark) => callback(isDark));
  }
  // Placeholder for future IPC methods
  // These will be added in later phases:
  // - File operations
  // - LLM analysis
  // - Data persistence
  // - Calendar sync
  // - Notifications
});
