import { create } from 'zustand'
import { jsPDF } from 'jspdf'
import type { Course, Assignment } from '../../shared/types'

interface CourseState {
  courses: Course[]
  isLoading: boolean
  selectedCourseId: string | null

  // Actions
  loadCourses: () => Promise<void>
  loadCoursesBySemester: (semesterId: string) => Promise<void>
  createCourse: (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Course | null>
  updateCourse: (id: string, updates: Partial<Course>) => Promise<boolean>
  deleteCourse: (id: string) => Promise<boolean>
  selectCourse: (id: string | null) => void

  // Assignment actions
  updateAssignment: (courseId: string, assignmentId: string, updates: Partial<Assignment>) => Promise<boolean>
  addAssignment: (courseId: string, assignment: Omit<Assignment, 'id'>) => Promise<Assignment | null>
  deleteAssignment: (courseId: string, assignmentId: string) => Promise<boolean>

  // Export actions
  exportJSON: () => Promise<boolean>
  exportCSV: () => Promise<boolean>
  exportPDF: () => Promise<boolean>

  // Helpers
  getCourseById: (id: string) => Course | undefined
  getCoursesBySemesterId: (semesterId: string) => Course[]
}

export const useCourseStore = create<CourseState>()((set, get) => ({
  courses: [],
  isLoading: false,
  selectedCourseId: null,

  loadCourses: async () => {
    set({ isLoading: true })
    try {
      const courses = await window.electronAPI.getCourses()
      set({ courses, isLoading: false })
    } catch (error) {
      console.error('Failed to load courses:', error)
      set({ isLoading: false })
    }
  },

  loadCoursesBySemester: async (semesterId: string) => {
    set({ isLoading: true })
    try {
      const courses = await window.electronAPI.getCoursesBySemester(semesterId)
      set({ courses, isLoading: false })
    } catch (error) {
      console.error('Failed to load courses:', error)
      set({ isLoading: false })
    }
  },

  createCourse: async (courseData) => {
    try {
      const result = await window.electronAPI.createCourse(courseData)
      if (result.success && result.course) {
        set((state) => ({
          courses: [...state.courses, result.course!]
        }))
        return result.course
      }
      console.error('Failed to create course:', result.error)
      return null
    } catch (error) {
      console.error('Failed to create course:', error)
      return null
    }
  },

  updateCourse: async (id, updates) => {
    try {
      const result = await window.electronAPI.updateCourse(id, updates)
      if (result.success && result.course) {
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id === id ? result.course! : c
          )
        }))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update course:', error)
      return false
    }
  },

  deleteCourse: async (id) => {
    try {
      const result = await window.electronAPI.deleteCourse(id)
      if (result.success) {
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== id),
          selectedCourseId: state.selectedCourseId === id ? null : state.selectedCourseId
        }))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete course:', error)
      return false
    }
  },

  selectCourse: (id) => {
    set({ selectedCourseId: id })
  },

  updateAssignment: async (courseId, assignmentId, updates) => {
    try {
      const result = await window.electronAPI.updateAssignment(courseId, assignmentId, updates)
      if (result.success) {
        // Reload courses to get updated data
        await get().loadCourses()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update assignment:', error)
      return false
    }
  },

  addAssignment: async (courseId, assignment) => {
    try {
      const result = await window.electronAPI.addAssignment(courseId, assignment)
      if (result.success && result.assignment) {
        // Reload courses to get updated data
        await get().loadCourses()
        return result.assignment
      }
      return null
    } catch (error) {
      console.error('Failed to add assignment:', error)
      return null
    }
  },

  deleteAssignment: async (courseId, assignmentId) => {
    try {
      const result = await window.electronAPI.deleteAssignment(courseId, assignmentId)
      if (result.success) {
        // Reload courses to get updated data
        await get().loadCourses()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      return false
    }
  },

  exportJSON: async () => {
    try {
      const result = await window.electronAPI.exportJSON()
      return result.success && !result.canceled
    } catch (error) {
      console.error('Failed to export JSON:', error)
      return false
    }
  },

  exportCSV: async () => {
    try {
      const result = await window.electronAPI.exportCSV()
      return result.success && !result.canceled
    } catch (error) {
      console.error('Failed to export CSV:', error)
      return false
    }
  },

  exportPDF: async () => {
    try {
      const exportData = await window.electronAPI.getExportData()
      const { courses, generatedAt } = exportData

      // Create PDF document
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let y = 20

      // Title
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Syllabus Dashboard Report', pageWidth / 2, y, { align: 'center' })
      y += 10

      // Generated date
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date(generatedAt).toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' })
      y += 15

      // Process each course
      for (const course of courses) {
        // Check if we need a new page
        if (y > 250) {
          doc.addPage()
          y = 20
        }

        // Course header
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 102, 204)
        doc.text(`${course.name}${course.code ? ` (${course.code})` : ''}`, 15, y)
        y += 8

        // Instructor info
        if (course.instructor?.name) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 100, 100)
          doc.text(`Instructor: ${course.instructor.name}${course.instructor.email ? ` - ${course.instructor.email}` : ''}`, 15, y)
          y += 6
        }

        // Assignments table header
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        y += 4
        doc.text('Assignment', 15, y)
        doc.text('Type', 90, y)
        doc.text('Due Date', 120, y)
        doc.text('Weight', 155, y)
        doc.text('Grade', 180, y)
        y += 2
        doc.setDrawColor(200, 200, 200)
        doc.line(15, y, 195, y)
        y += 5

        // Assignment rows
        doc.setFont('helvetica', 'normal')
        for (const assignment of course.assignments) {
          if (y > 270) {
            doc.addPage()
            y = 20
          }

          const title = assignment.title.length > 35
            ? assignment.title.substring(0, 32) + '...'
            : assignment.title
          doc.text(title, 15, y)
          doc.text(assignment.type, 90, y)
          doc.text(assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : assignment.dueDateRaw || '-', 120, y)
          doc.text(assignment.weight ? `${assignment.weight}%` : '-', 155, y)
          doc.text(assignment.gradeReceived !== undefined ? `${assignment.gradeReceived}%` : '-', 180, y)
          y += 5
        }

        // Grade weights summary
        if (course.gradeWeights.length > 0) {
          y += 5
          doc.setFont('helvetica', 'bold')
          doc.text('Grade Breakdown:', 15, y)
          y += 5
          doc.setFont('helvetica', 'normal')
          for (const gw of course.gradeWeights) {
            if (y > 270) {
              doc.addPage()
              y = 20
            }
            doc.text(`• ${gw.category}: ${gw.weight}%`, 20, y)
            y += 4
          }
        }

        y += 10
      }

      // Convert to ArrayBuffer and save
      const pdfBuffer = doc.output('arraybuffer')
      const result = await window.electronAPI.savePDF(pdfBuffer)
      return result.success && !result.canceled
    } catch (error) {
      console.error('Failed to export PDF:', error)
      return false
    }
  },

  getCourseById: (id) => {
    return get().courses.find((c) => c.id === id)
  },

  getCoursesBySemesterId: (semesterId) => {
    return get().courses.filter((c) => c.semesterId === semesterId)
  }
}))
