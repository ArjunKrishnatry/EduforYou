import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'fs'
import {
  loadCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourse,
  getCoursesBySemester,
  updateAssignment,
  addAssignment,
  deleteAssignment,
  exportToJSON,
  exportToCSV,
  getExportData
} from '../services/store/courses.js'
import type { Course, Assignment } from '../../shared/types.js'

export function registerStoreHandlers() {
  // Get all courses
  ipcMain.handle('store:getCourses', async () => {
    return loadCourses()
  })

  // Get courses by semester
  ipcMain.handle('store:getCoursesBySemester', async (_event, semesterId: string) => {
    return getCoursesBySemester(semesterId)
  })

  // Get single course
  ipcMain.handle('store:getCourse', async (_event, id: string) => {
    return getCourse(id)
  })

  // Create course
  ipcMain.handle('store:createCourse', async (_event, courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const course = createCourse(courseData)
      return { success: true, course }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create course'
      }
    }
  })

  // Update course
  ipcMain.handle('store:updateCourse', async (_event, id: string, updates: Partial<Course>) => {
    try {
      const course = updateCourse(id, updates)
      if (!course) {
        return { success: false, error: 'Course not found' }
      }
      return { success: true, course }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update course'
      }
    }
  })

  // Delete course
  ipcMain.handle('store:deleteCourse', async (_event, id: string) => {
    const success = deleteCourse(id)
    return { success }
  })

  // Update assignment
  ipcMain.handle(
    'store:updateAssignment',
    async (_event, courseId: string, assignmentId: string, updates: Partial<Assignment>) => {
      try {
        const assignment = updateAssignment(courseId, assignmentId, updates)
        if (!assignment) {
          return { success: false, error: 'Assignment not found' }
        }
        return { success: true, assignment }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update assignment'
        }
      }
    }
  )

  // Add assignment
  ipcMain.handle(
    'store:addAssignment',
    async (_event, courseId: string, assignment: Omit<Assignment, 'id'>) => {
      try {
        const newAssignment = addAssignment(courseId, assignment)
        if (!newAssignment) {
          return { success: false, error: 'Course not found' }
        }
        return { success: true, assignment: newAssignment }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add assignment'
        }
      }
    }
  )

  // Delete assignment
  ipcMain.handle('store:deleteAssignment', async (_event, courseId: string, assignmentId: string) => {
    const success = deleteAssignment(courseId, assignmentId)
    return { success }
  })

  // Export to JSON
  ipcMain.handle('store:exportJSON', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: 'syllabus-export.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true }
    }

    try {
      const json = exportToJSON()
      writeFileSync(result.filePath, json)
      return { success: true, path: result.filePath }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  })

  // Export to CSV
  ipcMain.handle('store:exportCSV', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: 'syllabus-export.csv',
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true }
    }

    try {
      const csv = exportToCSV()
      writeFileSync(result.filePath, csv)
      return { success: true, path: result.filePath }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  })

  // Get export data for PDF generation (renderer handles PDF creation)
  ipcMain.handle('store:getExportData', async () => {
    return getExportData()
  })

  // Save PDF file (receives ArrayBuffer from renderer)
  ipcMain.handle('store:savePDF', async (event, pdfData: ArrayBuffer) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: 'syllabus-report.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true }
    }

    try {
      writeFileSync(result.filePath, Buffer.from(pdfData))
      return { success: true, path: result.filePath }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  })
}
