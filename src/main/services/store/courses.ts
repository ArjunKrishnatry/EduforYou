import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import type { Course, Assignment } from '../../../shared/types.js'

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

function getCoursesPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'courses.json')
}

function ensureDirectory(): void {
  const path = getCoursesPath()
  const dir = join(path, '..')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function loadCourses(): Course[] {
  try {
    const path = getCoursesPath()
    if (existsSync(path)) {
      const data = readFileSync(path, 'utf-8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load courses:', e)
  }
  return []
}

export function saveCourses(courses: Course[]): void {
  try {
    ensureDirectory()
    const path = getCoursesPath()
    writeFileSync(path, JSON.stringify(courses, null, 2))
  } catch (e) {
    console.error('Failed to save courses:', e)
  }
}

export function createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Course {
  const courses = loadCourses()

  const newCourse: Course = {
    ...courseData,
    id: `course_${generateId()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Ensure assignments have IDs
    assignments: (courseData.assignments || []).map(a => ({
      ...a,
      id: a.id || `assign_${generateId()}`,
      isCompleted: a.isCompleted || false
    })),
    // Ensure materials have IDs
    materials: (courseData.materials || []).map(m => ({
      ...m,
      id: m.id || `mat_${generateId()}`
    })),
    // Ensure prep tips have IDs
    prepTips: (courseData.prepTips || []).map(p => ({
      ...p,
      id: p.id || `tip_${generateId()}`
    }))
  }

  courses.push(newCourse)
  saveCourses(courses)

  return newCourse
}

export function updateCourse(id: string, updates: Partial<Course>): Course | null {
  const courses = loadCourses()
  const index = courses.findIndex(c => c.id === id)

  if (index === -1) return null

  courses[index] = {
    ...courses[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  saveCourses(courses)
  return courses[index]
}

export function deleteCourse(id: string): boolean {
  const courses = loadCourses()
  const filtered = courses.filter(c => c.id !== id)

  if (filtered.length === courses.length) return false

  saveCourses(filtered)
  return true
}

export function getCourse(id: string): Course | null {
  const courses = loadCourses()
  return courses.find(c => c.id === id) || null
}

export function getCoursesBySemester(semesterId: string): Course[] {
  const courses = loadCourses()
  return courses.filter(c => c.semesterId === semesterId)
}

// Assignment operations
export function updateAssignment(
  courseId: string,
  assignmentId: string,
  updates: Partial<Assignment>
): Assignment | null {
  const courses = loadCourses()
  const course = courses.find(c => c.id === courseId)

  if (!course) return null

  const assignmentIndex = course.assignments.findIndex(a => a.id === assignmentId)
  if (assignmentIndex === -1) return null

  course.assignments[assignmentIndex] = {
    ...course.assignments[assignmentIndex],
    ...updates
  }
  course.updatedAt = new Date().toISOString()

  saveCourses(courses)
  return course.assignments[assignmentIndex]
}

export function addAssignment(courseId: string, assignment: Omit<Assignment, 'id'>): Assignment | null {
  const courses = loadCourses()
  const course = courses.find(c => c.id === courseId)

  if (!course) return null

  const newAssignment: Assignment = {
    ...assignment,
    id: `assign_${generateId()}`,
    isCompleted: assignment.isCompleted || false
  }

  course.assignments.push(newAssignment)
  course.updatedAt = new Date().toISOString()

  saveCourses(courses)
  return newAssignment
}

export function deleteAssignment(courseId: string, assignmentId: string): boolean {
  const courses = loadCourses()
  const course = courses.find(c => c.id === courseId)

  if (!course) return false

  const initialLength = course.assignments.length
  course.assignments = course.assignments.filter(a => a.id !== assignmentId)

  if (course.assignments.length === initialLength) return false

  course.updatedAt = new Date().toISOString()
  saveCourses(courses)
  return true
}

// Export functions
export function exportToJSON(): string {
  const courses = loadCourses()
  return JSON.stringify(courses, null, 2)
}

export interface PDFExportData {
  courses: Course[]
  generatedAt: string
}

export function exportToCSV(): string {
  const courses = loadCourses()
  const rows: string[] = []

  // Header
  rows.push('Course,Assignment,Type,Due Date,Weight,Completed,Grade')

  for (const course of courses) {
    for (const assignment of course.assignments) {
      rows.push([
        `"${course.name.replace(/"/g, '""')}"`,
        `"${assignment.title.replace(/"/g, '""')}"`,
        assignment.type,
        assignment.dueDate || assignment.dueDateRaw || '',
        assignment.weight?.toString() || '',
        assignment.isCompleted ? 'Yes' : 'No',
        assignment.gradeReceived?.toString() || ''
      ].join(','))
    }
  }

  return rows.join('\n')
}

export function getExportData(): PDFExportData {
  return {
    courses: loadCourses(),
    generatedAt: new Date().toISOString()
  }
}
