import { useState } from 'react'
import type { Assignment, Course } from '../../../shared/types'
import { CalendarView } from './CalendarView'
import { AssignmentModal } from './AssignmentModal'
import { useCourseStore, useSemesterStore } from '../../store'

export function FullCalendarPage() {
  const { courses, updateAssignment, deleteAssignment } = useCourseStore()
  const { semesters } = useSemesterStore()
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get starred semester courses or all courses
  const starredSemester = semesters.find(s => s.isStarred)
  const displayCourses = starredSemester
    ? courses.filter(c => c.semesterId === starredSemester.id)
    : courses

  const handleEventClick = (assignment: Assignment, course: Course) => {
    setSelectedAssignment(assignment)
    setSelectedCourse(course)
    setIsModalOpen(true)
  }

  const handleUpdateAssignment = async (assignmentId: string, updates: Partial<Assignment>) => {
    if (selectedCourse) {
      await updateAssignment(selectedCourse.id, assignmentId, updates)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (selectedCourse) {
      await deleteAssignment(selectedCourse.id, assignmentId)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Calendar
        </h1>
        {starredSemester && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing assignments for {starredSemester.name}
          </p>
        )}
      </div>

      {displayCourses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No courses to display. Add a course to see assignments on the calendar.
          </p>
        </div>
      ) : (
        <CalendarView
          courses={displayCourses}
          onEventClick={handleEventClick}
        />
      )}

      <AssignmentModal
        assignment={selectedAssignment}
        course={selectedCourse}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAssignment(null)
          setSelectedCourse(null)
        }}
        onUpdate={handleUpdateAssignment}
        onDelete={handleDeleteAssignment}
      />
    </div>
  )
}
