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
  },
  // LLM operations
  saveApiKey: (apiKey) => {
    return electron.ipcRenderer.invoke("llm:saveApiKey", apiKey);
  },
  hasApiKey: () => {
    return electron.ipcRenderer.invoke("llm:hasApiKey");
  },
  deleteApiKey: () => {
    return electron.ipcRenderer.invoke("llm:deleteApiKey");
  },
  testConnection: () => {
    return electron.ipcRenderer.invoke("llm:testConnection");
  },
  analyzeSyllabus: (text, options) => {
    return electron.ipcRenderer.invoke("llm:analyze", text, options);
  }
});
