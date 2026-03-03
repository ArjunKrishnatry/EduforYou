// Re-export shared types
export * from '../../shared/types'

// Renderer-specific types
export interface AppState {
  isDarkMode: boolean
  currentSemesterId: string | null
  sidebarCollapsed: boolean
}
