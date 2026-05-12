import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Plus, Palette } from 'lucide-react'
import type { Course, Assignment } from '../../../shared/types'
import { COURSE_COLORS } from '../../../shared/types'
import { AssignmentList } from './AssignmentList'
import { AssignmentModal } from './AssignmentModal'
import { CalendarView } from './CalendarView'
import { GradeCalculator } from './GradeCalculator'
import { WeightBreakdown } from './WeightBreakdown'
import { MaterialsList } from './MaterialsList'
import { InstructorInfo } from './InstructorInfo'
import { PrepTipsPanel } from './PrepTipsPanel'
import { useCourseStore } from '../../store'

interface CourseDetailViewProps {
  course: Course
  onBack: () => void
}

type Tab = 'overview' | 'assignments' | 'calendar'

export function CourseDetailView({ course, onBack }: CourseDetailViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const { updateAssignment, deleteAssignment, addAssignment, updateCourse } = useCourseStore()

  // Close color picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleColorChange = async (color: string) => {
    await updateCourse(course.id, { color })
    setShowColorPicker(false)
  }

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsModalOpen(true)
  }

  const handleToggleComplete = async (courseId: string, assignmentId: string, completed: boolean) => {
    await updateAssignment(courseId, assignmentId, { isCompleted: completed })
  }

  const handleUpdateAssignment = async (assignmentId: string, updates: Partial<Assignment>) => {
    await updateAssignment(course.id, assignmentId, updates)
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    await deleteAssignment(course.id, assignmentId)
  }

  const handleAddAssignment = async () => {
    const newAssignment = await addAssignment(course.id, {
      title: 'New Assignment',
      type: 'homework',
      isCompleted: false
    })
    if (newAssignment) {
      setSelectedAssignment(newAssignment)
      setIsModalOpen(true)
    }
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview' },
    { id: 'assignments' as Tab, label: 'Assignments' },
    { id: 'calendar' as Tab, label: 'Calendar' }
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            {/* Color picker trigger */}
            <div className="relative" ref={colorPickerRef}>
              <button
                onClick={() => setShowColorPicker(prev => !prev)}
                className="group relative w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600 transition-all"
                style={{ backgroundColor: course.color }}
                title="Change course color"
              >
                <Palette size={10} className="absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {showColorPicker && (
                <div className="absolute top-7 left-0 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Course color</p>
                  <div className="grid grid-cols-5 gap-2">
                    {COURSE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleColorChange(c.value)}
                        className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${course.color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-300' : ''}`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {course.name}
              </h1>
              {course.code && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {course.code}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleAddAssignment}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
          >
            <Plus size={16} />
            Add Assignment
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50 dark:bg-gray-900">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <GradeCalculator course={course} />
              <WeightBreakdown course={course} />
              {course.prepTips?.length > 0 && (
                <PrepTipsPanel tips={course.prepTips} />
              )}
            </div>

            {/* Right Column - Side Info */}
            <div className="space-y-6">
              <InstructorInfo instructor={course.instructor} />
              <MaterialsList materials={course.materials} />
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <AssignmentList
            courses={[course]}
            onAssignmentClick={handleAssignmentClick}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            courses={[course]}
            onEventClick={handleAssignmentClick}
          />
        )}
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        assignment={selectedAssignment}
        course={course}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAssignment(null)
        }}
        onUpdate={handleUpdateAssignment}
        onDelete={handleDeleteAssignment}
      />
    </div>
  )
}
