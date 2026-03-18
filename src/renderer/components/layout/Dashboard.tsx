import { useMemo } from 'react'
import { BookOpen, Calendar, TrendingUp, Clock } from 'lucide-react'
import { useSemesterStore, useCourseStore } from '../../store'

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `In ${diffDays} days`
  if (diffDays < 14) return 'Next week'
  return `In ${Math.ceil(diffDays / 7)} weeks`
}

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
  const { courses } = useCourseStore()
  const starredSemester = semesters.find(s => s.isStarred)

  // Filter courses for starred semester
  const semesterCourses = useMemo(() => {
    if (!starredSemester) return courses
    return courses.filter(c => c.semesterId === starredSemester.id)
  }, [courses, starredSemester])

  // Calculate stats
  const stats = useMemo(() => {
    const allAssignments = semesterCourses.flatMap(c => c.assignments)
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Upcoming = assignments with due dates in the future that aren't completed
    const upcoming = allAssignments.filter(a => {
      if (a.isCompleted) return false
      if (!a.dueDate) return false
      const due = new Date(a.dueDate)
      return due > now
    })

    // Due this week
    const dueThisWeek = upcoming.filter(a => {
      const due = new Date(a.dueDate!)
      return due <= oneWeekFromNow
    })

    // Calculate average grade (only for completed assignments with grades)
    const gradedAssignments = allAssignments.filter(
      a => a.isCompleted && a.gradeReceived !== undefined
    )
    const avgGrade = gradedAssignments.length > 0
      ? (gradedAssignments.reduce((sum, a) => sum + (a.gradeReceived || 0), 0) / gradedAssignments.length).toFixed(1)
      : '--'

    // Sort by due date (earliest first)
    const sortedUpcoming = [...upcoming].sort((a, b) => {
      const dateA = new Date(a.dueDate!).getTime()
      const dateB = new Date(b.dueDate!).getTime()
      return dateA - dateB
    })

    return {
      courseCount: semesterCourses.length,
      upcomingCount: upcoming.length,
      avgGrade,
      dueThisWeekCount: dueThisWeek.length,
      upcomingAssignments: sortedUpcoming.slice(0, 5), // Top 5 soonest deadlines
      semesterCourses
    }
  }, [semesterCourses])

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
          value={stats.courseCount}
          color="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          label="Upcoming"
          value={stats.upcomingCount}
          color="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          label="Avg. Grade"
          value={stats.avgGrade}
          color="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          label="Due This Week"
          value={stats.dueThisWeekCount}
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
            {stats.upcomingAssignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming deadlines</p>
                <p className="text-sm mt-1">Add a course to see your assignments here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.upcomingAssignments.map((assignment) => {
                  const course = stats.semesterCourses.find(
                    c => c.assignments.some(a => a.id === assignment.id)
                  )
                  const dueDate = assignment.dueDate
                    ? new Date(assignment.dueDate)
                    : null

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div
                        className="w-2 h-full min-h-[40px] rounded-full"
                        style={{ backgroundColor: course?.color || '#808080' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {assignment.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {course?.name || 'Unknown Course'} • {assignment.type}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {dueDate && (
                          <>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {dueDate.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeDate(dueDate)}
                            </p>
                          </>
                        )}
                        {!dueDate && assignment.dueDateRaw && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {assignment.dueDateRaw}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
            {stats.semesterCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No grades yet</p>
                <p className="text-sm mt-1">Grades will appear as you complete assignments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.semesterCourses.map((course) => {
                  const gradedAssignments = course.assignments.filter(
                    a => a.isCompleted && a.gradeReceived !== undefined
                  )
                  const courseAvg = gradedAssignments.length > 0
                    ? (gradedAssignments.reduce((sum, a) => sum + (a.gradeReceived || 0), 0) / gradedAssignments.length)
                    : null

                  return (
                    <div
                      key={course.id}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                        {course.name}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {courseAvg !== null ? `${courseAvg.toFixed(1)}%` : '--'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
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
