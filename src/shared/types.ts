// Semester types
export interface Semester {
  id: string
  name: string
  startDate: string
  endDate?: string
  isStarred: boolean
  createdAt: string
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
  // Future channels will be added here
} as const
