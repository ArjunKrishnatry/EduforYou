import { Bell, Search, Plus } from 'lucide-react'
import { useSemesterStore } from '../../store'

type View = 'dashboard' | 'add-course' | 'calendar' | 'settings'

interface HeaderProps {
  currentView: View
  onAddCourse: () => void
}

export function Header({ currentView, onAddCourse }: HeaderProps) {
  const { semesters, currentSemesterId } = useSemesterStore()
  const currentSemester = semesters.find(s => s.id === currentSemesterId)

  const getTitle = () => {
    switch (currentView) {
      case 'add-course':
        return 'Add Course'
      case 'calendar':
        return 'Calendar'
      case 'settings':
        return 'Settings'
      default:
        return 'Dashboard'
    }
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {getTitle()}
        </h2>
        {currentView === 'dashboard' && currentSemester && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 dark:text-gray-400">
              {currentSemester.name}
            </span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Add Course Button (only on dashboard) */}
        {currentView === 'dashboard' && (
          <button
            onClick={onAddCourse}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span>Add Course</span>
          </button>
        )}

        {/* Search - placeholder for future */}
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Search size={20} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell size={20} />
          {/* Notification badge - will be dynamic in Phase 6 */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
