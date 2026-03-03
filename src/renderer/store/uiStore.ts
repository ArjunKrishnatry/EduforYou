import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  isDarkMode: boolean
  activeModal: string | null

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setDarkMode: (isDark: boolean) => void
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  activeModal: null,

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
