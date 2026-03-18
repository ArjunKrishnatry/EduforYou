import { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle,
  Circle,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import type { Assignment, Course } from '../../../shared/types'

interface AssignmentListProps {
  courses: Course[]
  onAssignmentClick: (assignment: Assignment, course: Course) => void
  onToggleComplete: (courseId: string, assignmentId: string, completed: boolean) => Promise<void>
}

type SortField = 'dueDate' | 'title' | 'type' | 'weight' | 'course'
type SortDirection = 'asc' | 'desc'
type FilterType = 'all' | 'upcoming' | 'completed' | 'overdue'

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  exam: 'Exam',
  midterm: 'Midterm',
  final: 'Final',
  quiz: 'Quiz',
  homework: 'Homework',
  project: 'Project',
  paper: 'Paper',
  presentation: 'Presentation',
  lab: 'Lab',
  participation: 'Participation',
  other: 'Other'
}

export function AssignmentList({
  courses,
  onAssignmentClick,
  onToggleComplete
}: AssignmentListProps) {
  const [sortField, setSortField] = useState<SortField>('dueDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [filterAssignmentType, setFilterAssignmentType] = useState<string>('all')

  // Flatten all assignments with their course info
  const allAssignments = useMemo(() => {
    return courses.flatMap(course =>
      course.assignments.map(assignment => ({
        ...assignment,
        course
      }))
    )
  }, [courses])

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    const now = new Date()

    return allAssignments.filter(assignment => {
      // Course filter
      if (filterCourse !== 'all' && assignment.course.id !== filterCourse) {
        return false
      }

      // Assignment type filter
      if (filterAssignmentType !== 'all' && assignment.type !== filterAssignmentType) {
        return false
      }

      // Status filter
      if (filterType === 'completed' && !assignment.isCompleted) {
        return false
      }
      if (filterType === 'upcoming') {
        if (assignment.isCompleted) return false
        if (!assignment.dueDate) return true
        return new Date(assignment.dueDate) >= now
      }
      if (filterType === 'overdue') {
        if (assignment.isCompleted) return false
        if (!assignment.dueDate) return false
        return new Date(assignment.dueDate) < now
      }

      return true
    })
  }, [allAssignments, filterType, filterCourse, filterAssignmentType])

  // Sort assignments
  const sortedAssignments = useMemo(() => {
    return [...filteredAssignments].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          comparison = dateA - dateB
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'weight':
          comparison = (a.weight || 0) - (b.weight || 0)
          break
        case 'course':
          comparison = a.course.name.localeCompare(b.course.name)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredAssignments, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc'
      ? <ChevronUp size={14} />
      : <ChevronDown size={14} />
  }

  const now = new Date()

  // Get unique assignment types from the data
  const assignmentTypes = useMemo(() => {
    const types = new Set(allAssignments.map(a => a.type))
    return Array.from(types).sort()
  }, [allAssignments])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header with filters */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            All Assignments
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {sortedAssignments.length} {sortedAssignments.length === 1 ? 'assignment' : 'assignments'}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>

          <select
            value={filterAssignmentType}
            onChange={(e) => setFilterAssignmentType(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            {assignmentTypes.map(type => (
              <option key={type} value={type}>{ASSIGNMENT_TYPE_LABELS[type] || type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-sm">
              <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 w-10">
                {/* Checkbox column */}
              </th>
              <th
                className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Title
                  <SortIcon field="title" />
                </div>
              </th>
              <th
                className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('course')}
              >
                <div className="flex items-center gap-1">
                  Course
                  <SortIcon field="course" />
                </div>
              </th>
              <th
                className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Type
                  <SortIcon field="type" />
                </div>
              </th>
              <th
                className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  <SortIcon field="dueDate" />
                </div>
              </th>
              <th
                className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('weight')}
              >
                <div className="flex items-center gap-1">
                  Weight
                  <SortIcon field="weight" />
                </div>
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                Grade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedAssignments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                  No assignments match your filters
                </td>
              </tr>
            ) : (
              sortedAssignments.map((assignment) => {
                const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null
                const isOverdue = dueDate && dueDate < now && !assignment.isCompleted
                const isPastDue = dueDate && dueDate < now

                return (
                  <tr
                    key={assignment.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      isPastDue && !assignment.isCompleted ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                    } ${assignment.isCompleted ? 'opacity-60' : ''}`}
                    onClick={() => onAssignmentClick(assignment, assignment.course)}
                  >
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleComplete(assignment.course.id, assignment.id, !assignment.isCompleted)}
                        className="text-gray-400 hover:text-primary-500 transition-colors"
                      >
                        {assignment.isCompleted
                          ? <CheckCircle size={20} className="text-green-500" />
                          : <Circle size={20} />
                        }
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-gray-900 dark:text-white ${assignment.isCompleted ? 'line-through' : ''}`}>
                          {assignment.title}
                        </span>
                        {assignment.isPotentialDuplicate && (
                          <AlertTriangle size={14} className="text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: assignment.course.color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {assignment.course.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {ASSIGNMENT_TYPE_LABELS[assignment.type] || assignment.type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                        <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                          {dueDate
                            ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            : assignment.dueDateRaw || '--'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.weight !== undefined ? `${assignment.weight}%` : '--'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {assignment.gradeReceived !== undefined ? `${assignment.gradeReceived}%` : '--'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
