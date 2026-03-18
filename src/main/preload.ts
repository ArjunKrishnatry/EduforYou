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

// Types for LLM operations
interface AnalysisOptions {
  semesterStartDate?: string
  courseName?: string
}

interface AnalysisResult {
  success: boolean
  data?: any
  error?: string
}

interface ApiKeyResult {
  success: boolean
  error?: string
}

interface HasKeyResult {
  hasKey: boolean
}

interface ConnectionResult {
  success: boolean
  error?: string | null
}

// Types for store operations
interface Course {
  id: string
  name: string
  code?: string
  color: string
  semesterId: string
  instructor?: any
  assignments: any[]
  gradeWeights: any[]
  materials: any[]
  prepTips: any[]
  policies?: any
  rawSyllabusText?: string
  createdAt: string
  updatedAt: string
}

interface StoreResult<T = any> {
  success: boolean
  course?: T
  assignment?: T
  error?: string
  canceled?: boolean
  path?: string
}

interface PDFExportData {
  courses: Course[]
  generatedAt: string
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

  // LLM operations
  saveApiKey: (apiKey: string): Promise<ApiKeyResult> => {
    return ipcRenderer.invoke('llm:saveApiKey', apiKey)
  },

  hasApiKey: (): Promise<HasKeyResult> => {
    return ipcRenderer.invoke('llm:hasApiKey')
  },

  deleteApiKey: (): Promise<ApiKeyResult> => {
    return ipcRenderer.invoke('llm:deleteApiKey')
  },

  testConnection: (): Promise<ConnectionResult> => {
    return ipcRenderer.invoke('llm:testConnection')
  },

  analyzeSyllabus: (text: string, options: AnalysisOptions): Promise<AnalysisResult> => {
    return ipcRenderer.invoke('llm:analyze', text, options)
  },

  // Store operations
  getCourses: (): Promise<Course[]> => {
    return ipcRenderer.invoke('store:getCourses')
  },

  getCoursesBySemester: (semesterId: string): Promise<Course[]> => {
    return ipcRenderer.invoke('store:getCoursesBySemester', semesterId)
  },

  getCourse: (id: string): Promise<Course | null> => {
    return ipcRenderer.invoke('store:getCourse', id)
  },

  createCourse: (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreResult<Course>> => {
    return ipcRenderer.invoke('store:createCourse', courseData)
  },

  updateCourse: (id: string, updates: Partial<Course>): Promise<StoreResult<Course>> => {
    return ipcRenderer.invoke('store:updateCourse', id, updates)
  },

  deleteCourse: (id: string): Promise<StoreResult> => {
    return ipcRenderer.invoke('store:deleteCourse', id)
  },

  updateAssignment: (courseId: string, assignmentId: string, updates: any): Promise<StoreResult> => {
    return ipcRenderer.invoke('store:updateAssignment', courseId, assignmentId, updates)
  },

  addAssignment: (courseId: string, assignment: any): Promise<StoreResult> => {
    return ipcRenderer.invoke('store:addAssignment', courseId, assignment)
  },

  deleteAssignment: (courseId: string, assignmentId: string): Promise<StoreResult> => {
    return ipcRenderer.invoke('store:deleteAssignment', courseId, assignmentId)
  },

  exportJSON: (): Promise<StoreResult> => {
    return ipcRenderer.invoke('store:exportJSON')
  },

  exportCSV: (): Promise<StoreResult> => {
    return ipcRenderer.invoke('store:exportCSV')
  },

  getExportData: (): Promise<PDFExportData> => {
    return ipcRenderer.invoke('store:getExportData')
  },

  savePDF: (pdfData: ArrayBuffer): Promise<StoreResult> => {
    return ipcRenderer.invoke('store:savePDF', pdfData)
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

      // LLM operations
      saveApiKey: (apiKey: string) => Promise<ApiKeyResult>
      hasApiKey: () => Promise<HasKeyResult>
      deleteApiKey: () => Promise<ApiKeyResult>
      testConnection: () => Promise<ConnectionResult>
      analyzeSyllabus: (text: string, options: AnalysisOptions) => Promise<AnalysisResult>

      // Store operations
      getCourses: () => Promise<Course[]>
      getCoursesBySemester: (semesterId: string) => Promise<Course[]>
      getCourse: (id: string) => Promise<Course | null>
      createCourse: (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StoreResult<Course>>
      updateCourse: (id: string, updates: Partial<Course>) => Promise<StoreResult<Course>>
      deleteCourse: (id: string) => Promise<StoreResult>
      updateAssignment: (courseId: string, assignmentId: string, updates: any) => Promise<StoreResult>
      addAssignment: (courseId: string, assignment: any) => Promise<StoreResult>
      deleteAssignment: (courseId: string, assignmentId: string) => Promise<StoreResult>
      exportJSON: () => Promise<StoreResult>
      exportCSV: () => Promise<StoreResult>
      getExportData: () => Promise<PDFExportData>
      savePDF: (pdfData: ArrayBuffer) => Promise<StoreResult>
    }
  }
}
