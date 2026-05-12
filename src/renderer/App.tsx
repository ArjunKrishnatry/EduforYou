import { useState, useEffect, useCallback } from 'react'
import { Sidebar, Header, Dashboard } from './components/layout'
import { SemesterTabs } from './components/semester/SemesterTabs'
import { SyllabusInput } from './components/input'
import { SettingsModal } from './components/settings'
import { CourseDetailView, FullCalendarPage } from './components/dashboard'
import { ToastContainer } from './components/ui/Toast'
import { useCourseStore } from './store'
import { COURSE_COLORS } from '../shared/types'

type View = 'dashboard' | 'add-course' | 'calendar' | 'course-detail' | 'settings'

export function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const { loadCourses, createCourse, courses, getCourseById } = useCourseStore()

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

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleAddCourse = useCallback(() => {
    setCurrentView('add-course')
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setCurrentView('add-course')
      } else if (e.key === ',') {
        e.preventDefault()
        setIsSettingsOpen(true)
      } else if (e.key === 'Escape') {
        if (currentView === 'course-detail' || currentView === 'add-course') {
          setCurrentView('dashboard')
          setSelectedCourseId(null)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentView])

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId)
    setCurrentView('course-detail')
  }

  const handleBackFromCourse = () => {
    setSelectedCourseId(null)
    setCurrentView('dashboard')
  }

  const selectedCourse = selectedCourseId ? getCourseById(selectedCourseId) : undefined

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
      case 'calendar':
        return <FullCalendarPage />
      case 'course-detail':
        if (selectedCourse) {
          return (
            <CourseDetailView
              course={selectedCourse}
              onBack={handleBackFromCourse}
            />
          )
        }
        return <Dashboard onSelectCourse={handleSelectCourse} />
      case 'dashboard':
      default:
        return <Dashboard onSelectCourse={handleSelectCourse} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-surface-dark">
      {/* Sidebar */}
      <SidebarWithNav
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenSettings={handleOpenSettings}
        onSelectCourse={handleSelectCourse}
        selectedCourseId={selectedCourseId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <HeaderWithNav
          currentView={currentView}
          onNavigate={setCurrentView}
          onAddCourse={handleAddCourse}
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

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}

// Extended Sidebar with navigation
function SidebarWithNav({
  currentView,
  onNavigate,
  onOpenSettings,
  onSelectCourse,
  selectedCourseId
}: {
  currentView: View
  onNavigate: (view: View) => void
  onOpenSettings: () => void
  onSelectCourse: (courseId: string) => void
  selectedCourseId: string | null
}) {
  return (
    <Sidebar
      onNavigate={onNavigate}
      currentView={currentView}
      onOpenSettings={onOpenSettings}
      onSelectCourse={onSelectCourse}
      selectedCourseId={selectedCourseId}
    />
  )
}

// Extended Header with add course button
function HeaderWithNav({
  currentView,
  onAddCourse,
}: {
  currentView: View
  onNavigate: (view: View) => void
  onAddCourse: () => void
}) {
  return <Header onAddCourse={onAddCourse} currentView={currentView} />
}
