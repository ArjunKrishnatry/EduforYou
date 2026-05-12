import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // Theme
  onThemeChange: (callback) => {
    ipcRenderer.on("theme-changed", (_event, isDark) => callback(isDark));
  },
  // File operations
  selectFiles: () => {
    return ipcRenderer.invoke("file:select");
  },
  parseFile: (filePath) => {
    return ipcRenderer.invoke("file:parse", filePath);
  },
  parseMultipleFiles: (filePaths) => {
    return ipcRenderer.invoke("file:parseMultiple", filePaths);
  },
  chunkText: (text, maxChunkSize) => {
    return ipcRenderer.invoke("file:chunk", text, maxChunkSize);
  },
  // LLM operations
  saveApiKey: (apiKey) => {
    return ipcRenderer.invoke("llm:saveApiKey", apiKey);
  },
  hasApiKey: () => {
    return ipcRenderer.invoke("llm:hasApiKey");
  },
  deleteApiKey: () => {
    return ipcRenderer.invoke("llm:deleteApiKey");
  },
  testConnection: () => {
    return ipcRenderer.invoke("llm:testConnection");
  },
  analyzeSyllabus: (text, options) => {
    return ipcRenderer.invoke("llm:analyze", text, options);
  },
  // Store operations
  getCourses: () => {
    return ipcRenderer.invoke("store:getCourses");
  },
  getCoursesBySemester: (semesterId) => {
    return ipcRenderer.invoke("store:getCoursesBySemester", semesterId);
  },
  getCourse: (id) => {
    return ipcRenderer.invoke("store:getCourse", id);
  },
  createCourse: (courseData) => {
    return ipcRenderer.invoke("store:createCourse", courseData);
  },
  updateCourse: (id, updates) => {
    return ipcRenderer.invoke("store:updateCourse", id, updates);
  },
  deleteCourse: (id) => {
    return ipcRenderer.invoke("store:deleteCourse", id);
  },
  updateAssignment: (courseId, assignmentId, updates) => {
    return ipcRenderer.invoke("store:updateAssignment", courseId, assignmentId, updates);
  },
  addAssignment: (courseId, assignment) => {
    return ipcRenderer.invoke("store:addAssignment", courseId, assignment);
  },
  deleteAssignment: (courseId, assignmentId) => {
    return ipcRenderer.invoke("store:deleteAssignment", courseId, assignmentId);
  },
  exportJSON: () => {
    return ipcRenderer.invoke("store:exportJSON");
  },
  exportCSV: () => {
    return ipcRenderer.invoke("store:exportCSV");
  },
  getExportData: () => {
    return ipcRenderer.invoke("store:getExportData");
  },
  savePDF: (pdfData) => {
    return ipcRenderer.invoke("store:savePDF", pdfData);
  }
});
e:exportCSV");
  },
  getExportData: () => {
    return electron.ipcRenderer.invoke("store:getExportData");
  },
  savePDF: (pdfData) => {
    return electron.ipcRenderer.invoke("store:savePDF", pdfData);
  }
});
