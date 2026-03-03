import React from 'react'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react'
import { useUIStore, useSemesterStore } from '../../store'

type View = 'dashboard' | 'add-course' | 'calendar' | 'settings'

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
  onOpenSettings?: () => void
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  collapsed?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, isActive, collapsed, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
        ${isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  )
}

export function Sidebar({ currentView, onNavigate, onOpenSettings }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { semesters } = useSemesterStore()

  const starredSemester = semesters.find(s => s.isStarred)

  return (
    <aside
      className={`
        flex flex-col h-full bg-sidebar-light dark:bg-sidebar-dark border-r border-gray-200 dark:border-gray-700 transition-sidebar
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo / Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-700 drag-region">
        {!sidebarCollapsed && (
          <h1 className="font-semibold text-gray-900 dark:text-white no-drag">
            Syllabus
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 no-drag"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          isActive={currentView === 'dashboard'}
          collapsed={sidebarCollapsed}
          onClick={() => onNavigate('dashboard')}
        />
        <NavItem
          icon={<Calendar size={20} />}
          label="Calendar"
          isActive={currentView === 'calendar'}
          collapsed={sidebarCollapsed}
          onClick={() => onNavigate('calendar')}
        />

        {/* Courses Section */}
        {!sidebarCollapsed && (
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Courses
              </span>
              <button
                onClick={() => onNavigate('add-course')}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Add course"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Placeholder for courses - will be populated in Phase 4 */}
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
              {semesters.length === 0
                ? 'Add a semester to get started'
                : 'No courses yet'}
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <NavItem
            icon={<BookOpen size={20} />}
            label="Courses"
            collapsed={sidebarCollapsed}
            onClick={() => onNavigate('add-course')}
          />
        )}
      </nav>

      {/* Starred Semester Indicator */}
      {starredSemester && !sidebarCollapsed && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Dashboard shows:
          </div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {starredSemester.name}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <NavItem
          icon={<Settings size={20} />}
          label="Settings"
          isActive={currentView === 'settings'}
          collapsed={sidebarCollapsed}
          onClick={() => onOpenSettings?.()}
        />
      </div>
    </aside>
  )
}
