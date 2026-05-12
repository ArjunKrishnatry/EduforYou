import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  sidebarCollapsed: boolean
  isDarkMode: boolean
  activeModal: string | null
  toasts: Toast[]

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setDarkMode: (isDark: boolean) => void
  openModal: (modalId: string) => void
  closeModal: () => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  activeModal: null,
  toasts: [],

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed })
  },

  setDarkMode: (isDark) => {
    set({ isDarkMode: isDark })
  },

  openModal: (modalId) => {
    set({ activeModal: modalId })
  },

  closeModal: () => {
    set({ activeModal: null })
  },

  addToast: (message, type = 'info') => {
    const id = generateId()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    useUIStore.getState().setDarkMode(e.matches)
  })

  // Listen for Electron theme changes
  window.electronAPI?.onThemeChange((isDark) => {
    useUIStore.getState().setDarkMode(isDark)
  })
}
