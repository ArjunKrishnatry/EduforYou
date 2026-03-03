"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Theme
  onThemeChange: (callback) => {
    electron.ipcRenderer.on("theme-changed", (_event, isDark) => callback(isDark));
  },
  // File operations
  selectFiles: () => {
    return electron.ipcRenderer.invoke("file:select");
  },
  parseFile: (filePath) => {
    return electron.ipcRenderer.invoke("file:parse", filePath);
  },
  parseMultipleFiles: (filePaths) => {
    return electron.ipcRenderer.invoke("file:parseMultiple", filePaths);
  },
  chunkText: (text, maxChunkSize) => {
    return electron.ipcRenderer.invoke("file:chunk", text, maxChunkSize);
  }
});
