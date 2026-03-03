import React from 'react'
import { BookOpen, Calendar, TrendingUp, Clock } from 'lucide-react'
import { useSemesterStore } from '../../store'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { semesters } = useSemesterStore()
  const starredSemester = semesters.find(s => s.isStarred)

  // Empty state when no semesters
  if (semesters.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Syllabus Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by adding a semester. Then you can upload your course syllabi and we'll extract all your assignments, exams, and deadlines.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Click "Add Semester" in the tabs above to begin.
          </p>
        </div>
      </div>
    )
  }

  // Dashboard with starred semester info
  return (
    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<BookOpen className="w-6 h-6 text-blue-600" />}
          label="Courses"
          value={0}
          color="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          label="Upcoming"
          value={0}
          color="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          label="Avg. Grade"
          value="--"
          color="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          label="Due This Week"
          value={0}
          color="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Upcoming Deadlines
            </h3>
          </div>
          <div className="p-5">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming deadlines</p>
              <p className="text-sm mt-1">Add a course to see your assignments here</p>
            </div>
          </div>
        </div>

        {/* Current Grades */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Current Grades
            </h3>
          </div>
          <div className="p-5">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No grades yet</p>
              <p className="text-sm mt-1">Grades will appear as you complete assignments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Semester Info */}
      {starredSemester && (
        <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            <strong>Showing:</strong> {starredSemester.name}
            <span className="ml-2 text-primary-600 dark:text-primary-400">
              (Started: {new Date(starredSemester.startDate).toLocaleDateString()})
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
