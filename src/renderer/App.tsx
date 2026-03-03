import React from 'react'
import { Sidebar, Header, Dashboard } from './components/layout'
import { SemesterTabs } from './components/semester/SemesterTabs'

export function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-surface-dark">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Semester Tabs */}
        <SemesterTabs />

        {/* Dashboard Content */}
        <Dashboard />
      </div>
    </div>
  )
}
