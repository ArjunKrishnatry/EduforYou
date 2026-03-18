import { useState, useEffect } from 'react'
import { Sidebar, Header, Dashboard } from './components/layout'
import { SemesterTabs } from './components/semester/SemesterTabs'
import { SyllabusInput } from './components/input'
import { SettingsModal } from './components/settings'
import { useCourseStore } from './store'
import { COURSE_COLORS } from '../shared/types'

type View = 'dashboard' | 'add-course' | 'calendar' | 'settings'

export function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { loadCourses, createCourse, courses } = useCourseStore()

  // Load courses on mount
  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const handleAnalyzeComplete = async (result: any, courseName: string, semesterId: string) => {
    console.log('Analysis complete:', { result, courseName, semesterId })

    // Pick a random color for the course
    const usedColors = courses.map(c => c.color)
    const availableColors = COURSE_COLORS.filter(c => !usedColors.includes(c.value))
    const color = availableColors.length > 0
      ? availableColors[Math.floor(Math.random() * availableColors.length)].value
      : COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)].value

    // Create course from analysis result
    const course = await createCourse({
      name: courseName,
      code: result.courseCode,
      color,
      semesterId,
      instructor: result.instructor,
      assignments: (result.assignments || []).map((a: any) => ({
        ...a,
        isCompleted: false
      })),
      gradeWeights: result.gradeWeights || [],
      materials: (result.materials || []).map((m: any) => ({
        ...m,
        type: m.type || 'other'
      })),
      prepTips: result.prepTips || [],
      policies: result.policies,
      rawSyllabusText: result.rawText
    })

    if (course) {
      console.log('Course saved:', course)
      // Navigate back to dashboard
      setCurrentView('dashboard')
    }
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  const renderContent = () => {
    switch (currentView) {
      case 'add-course':
        return (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-surface-dark">
            <SyllabusInput
              onAnalyzeComplete={handleAnalyzeComplete}
              onOpenSettings={handleOpenSettings}
            />
          </div>
        )
      case 'dashboard':
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-surface-dark">
      {/* Sidebar */}
      <SidebarWithNav
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <HeaderWithNav
          currentView={currentView}
          onNavigate={setCurrentView}
        />

        {/* Semester Tabs */}
        <SemesterTabs />

        {/* Content */}
        {renderContent()}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

// Extended Sidebar with navigation
function SidebarWithNav({
  currentView,
  onNavigate,
  onOpenSettings
}: {
  currentView: View
  onNavigate: (view: View) => void
  onOpenSettings: () => void
}) {
  return <Sidebar onNavigate={onNavigate} currentView={currentView} onOpenSettings={onOpenSettings} />
}

// Extended Header with add course button
function HeaderWithNav({
  currentView,
  onNavigate
}: {
  currentView: View
  onNavigate: (view: View) => void
}) {
  return <Header onAddCourse={() => onNavigate('add-course')} currentView={currentView} />
}
