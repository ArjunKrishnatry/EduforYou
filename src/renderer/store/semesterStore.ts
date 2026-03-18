import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Semester } from '../../shared/types'

interface SemesterState {
  semesters: Semester[]
  currentSemesterId: string | null

  // Actions
  addSemester: (semester: Omit<Semester, 'id' | 'createdAt'>) => string
  updateSemester: (id: string, updates: Partial<Semester>) => void
  deleteSemester: (id: string) => void
  setCurrentSemester: (id: string | null) => void
  toggleStarred: (id: string) => void
  getStarredSemester: () => Semester | undefined
}

// Generate unique ID
const generateId = () => `sem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export const useSemesterStore = create<SemesterState>()(
  persist(
    (set, get) => ({
      semesters: [],
      currentSemesterId: null,

      addSemester: (semesterData) => {
        const id = generateId()
        const newSemester: Semester = {
          ...semesterData,
          id,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          semesters: [...state.semesters, newSemester],
          // Auto-select if first semester
          currentSemesterId: state.currentSemesterId || id,
        }))

        return id
      },

      updateSemester: (id, updates) => {
        set((state) => ({
          semesters: state.semesters.map((sem) =>
            sem.id === id ? { ...sem, ...updates } : sem
          ),
        }))
      },

      deleteSemester: (id) => {
        set((state) => {
          const filtered = state.semesters.filter((sem) => sem.id !== id)
          return {
            semesters: filtered,
            // Clear current if deleted
            currentSemesterId:
              state.currentSemesterId === id
                ? filtered[0]?.id || null
                : state.currentSemesterId,
          }
        })
      },

      setCurrentSemester: (id) => {
        set({ currentSemesterId: id })
      },

      toggleStarred: (id) => {
        set((state) => ({
          semesters: state.semesters.map((sem) =>
            sem.id === id
              ? { ...sem, isStarred: !sem.isStarred }
              : // Unstar others when starring one
                sem.isStarred && !get().semesters.find(s => s.id === id)?.isStarred
                ? { ...sem, isStarred: false }
                : sem
          ),
        }))
      },

      getStarredSemester: () => {
        return get().semesters.find((sem) => sem.isStarred)
      },
    }),
    {
      name: 'syllabus-semesters',
    }
  )
)
