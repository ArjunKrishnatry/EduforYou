// Semester types
export interface Semester {
  id: string
  name: string
  startDate: string
  endDate?: string
  isStarred: boolean
  createdAt: string
}

// Instructor types
export interface Instructor {
  name: string
  email?: string
  phone?: string
  officeLocation?: string
  officeHours?: Array<{
    day: string
    startTime: string
    endTime: string
    location?: string
  }>
}

// Assignment types
export interface Assignment {
  id: string
  title: string
  type: 'exam' | 'midterm' | 'final' | 'quiz' | 'homework' | 'project' | 'paper' | 'presentation' | 'lab' | 'participation' | 'other'
  description?: string
  dueDate?: string
  dueDateRaw?: string
  weight?: number
  estimatedTime?: string
  relatedTopics?: string[]
  isCompleted: boolean
  gradeReceived?: number
  isPotentialDuplicate?: boolean
}

// Grade weight types
export interface GradeWeight {
  category: string
  weight: number
  description?: string
}

// Material types
export interface Material {
  id: string
  type: 'textbook' | 'online_resource' | 'software' | 'equipment' | 'reading' | 'other'
  title: string
  author?: string
  isbn?: string
  url?: string
  isRequired: boolean
  notes?: string
}

// Prep tip types
export interface PrepTip {
  id: string
  category: 'study_strategy' | 'time_management' | 'exam_prep' | 'resource_recommendation' | 'general'
  content: string
  priority: 'high' | 'medium' | 'low'
}

// Course types
export interface Course {
  id: string
  name: string
  code?: string
  color: string
  semesterId: string
  instructor?: Instructor
  assignments: Assignment[]
  gradeWeights: GradeWeight[]
  materials: Material[]
  prepTips: PrepTip[]
  policies?: {
    attendance?: string
    lateWork?: string
    academicIntegrity?: string
    grading?: string
    other?: string[]
  }
  rawSyllabusText?: string
  createdAt: string
  updatedAt: string
}

// Course colors available for calendar
export const COURSE_COLORS = [
  { name: 'Red', value: '#dc4c3e' },
  { name: 'Orange', value: '#ff9933' },
  { name: 'Yellow', value: '#ffd43b' },
  { name: 'Green', value: '#299438' },
  { name: 'Teal', value: '#158fad' },
  { name: 'Blue', value: '#4073ff' },
  { name: 'Purple', value: '#884dff' },
  { name: 'Pink', value: '#eb96eb' },
  { name: 'Gray', value: '#808080' },
] as const

export type CourseColor = typeof COURSE_COLORS[number]['value']

// IPC channel names
export const IPC_CHANNELS = {
  THEME_CHANGED: 'theme-changed',
} as const
