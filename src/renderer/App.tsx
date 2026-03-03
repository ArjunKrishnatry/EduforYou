import React, { useState } from 'react'
import { Sidebar, Header, Dashboard } from './components/layout'
import { SemesterTabs } from './components/semester/SemesterTabs'
import { SyllabusInput } from './components/input'

type View = 'dashboard' | 'add-course' | 'calendar' | 'settings'

export function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')

  const handleAnalyze = (text: string, courseName: string, semesterId: string) => {
    // TODO: This will be implemented in Phase 3 (LLM Integration)
    console.log('Analyzing syllabus:', { courseName, semesterId, textLength: text.length })
    alert(`Syllabus captured!\n\nCourse: ${courseName}\nText length: ${text.length} characters\n\nLLM analysis will be added in Phase 3.`)
  }

  const renderContent = () => {
    switch (currentView) {
      case 'add-course':
        return (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-surface-dark">
            <SyllabusInput onAnalyze={handleAnalyze} />
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
      <SidebarWithNav currentView={currentView} onNavigate={setCurrentView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <HeaderWithNav currentView={currentView} onNavigate={setCurrentView} />

        {/* Semester Tabs */}
        <SemesterTabs />

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  )
}

// Extended Sidebar with navigation
function SidebarWithNav({
  currentView,
  onNavigate
}: {
  currentView: View
  onNavigate: (view: View) => void
}) {
  return <Sidebar onNavigate={onNavigate} currentView={currentView} />
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
