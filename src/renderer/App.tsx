import React, { useState } from 'react'
import { Sidebar, Header, Dashboard } from './components/layout'
import { SemesterTabs } from './components/semester/SemesterTabs'
import { SyllabusInput } from './components/input'
import { SettingsModal } from './components/settings'

type View = 'dashboard' | 'add-course' | 'calendar' | 'settings'

export function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [lastAnalysisResult, setLastAnalysisResult] = useState<any>(null)

  const handleAnalyzeComplete = (result: any, courseName: string, semesterId: string) => {
    console.log('Analysis complete:', { result, courseName, semesterId })
    setLastAnalysisResult(result)

    // TODO: In Phase 4, save this to the course store
    // For now, just log and show success
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
