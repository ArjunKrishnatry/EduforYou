import { useState, useEffect } from 'react'
import { X, Calendar, Percent, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react'
import type { Assignment, Course } from '../../../shared/types'

interface AssignmentModalProps {
  assignment: Assignment | null
  course: Course | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (assignmentId: string, updates: Partial<Assignment>) => Promise<void>
  onDelete: (assignmentId: string) => Promise<void>
}

const ASSIGNMENT_TYPES = [
  'exam', 'midterm', 'final', 'quiz', 'homework',
  'project', 'paper', 'presentation', 'lab', 'participation', 'other'
] as const

export function AssignmentModal({
  assignment,
  course,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}: AssignmentModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedAssignment, setEditedAssignment] = useState<Partial<Assignment>>({})

  useEffect(() => {
    if (assignment) {
      setEditedAssignment({ ...assignment })
    }
  }, [assignment])

  if (!isOpen || !assignment || !course) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(assignment.id, editedAssignment)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleComplete = async () => {
    const newCompleted = !assignment.isCompleted
    await onUpdate(assignment.id, { isCompleted: newCompleted })
  }

  const handleGradeChange = async (grade: string) => {
    const gradeValue = grade === '' ? undefined : parseFloat(grade)
    setEditedAssignment(prev => ({ ...prev, gradeReceived: gradeValue }))
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
      await onDelete(assignment.id)
      onClose()
    }
  }

  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null
  const isPastDue = dueDate && dueDate < new Date() && !assignment.isCompleted

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
          style={{ borderTopColor: course.color, borderTopWidth: 4 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editedAssignment.title || ''}
                  onChange={(e) => setEditedAssignment(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-lg font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary-500 outline-none text-gray-900 dark:text-white"
                />
              ) : (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {assignment.title}
                </h3>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {course.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {/* Status & Type */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleToggleComplete}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                assignment.isCompleted
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <CheckCircle size={16} />
              {assignment.isCompleted ? 'Completed' : 'Mark Complete'}
            </button>

            {isEditing ? (
              <select
                value={editedAssignment.type || assignment.type}
                onChange={(e) => setEditedAssignment(prev => ({ ...prev, type: e.target.value as Assignment['type'] }))}
                className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-700 border-none"
              >
                {ASSIGNMENT_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
              </span>
            )}

            {assignment.isPotentialDuplicate && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                <AlertTriangle size={14} />
                Potential Duplicate
              </span>
            )}
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
              {isEditing ? (
                <input
                  type="date"
                  value={editedAssignment.dueDate?.split('T')[0] || ''}
                  onChange={(e) => setEditedAssignment(prev => ({
                    ...prev,
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                  }))}
                  className="mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className={`font-medium ${isPastDue ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                  {dueDate
                    ? dueDate.toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : assignment.dueDateRaw || 'No due date'
                  }
                  {isPastDue && ' (Overdue)'}
                </p>
              )}
            </div>
          </div>

          {/* Weight */}
          <div className="flex items-center gap-3 mb-4">
            <Percent className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editedAssignment.weight ?? ''}
                  onChange={(e) => setEditedAssignment(prev => ({
                    ...prev,
                    weight: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  className="mt-1 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">
                  {assignment.weight !== undefined ? `${assignment.weight}%` : 'Not specified'}
                </p>
              )}
            </div>
          </div>

          {/* Grade Received */}
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-gray-400" size={20} />
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Grade Received</p>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editedAssignment.gradeReceived ?? ''}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  onBlur={handleSave}
                  className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="--"
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
            {isEditing ? (
              <textarea
                value={editedAssignment.description || ''}
                onChange={(e) => setEditedAssignment(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add a description..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {assignment.description || 'No description'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-600 font-medium"
          >
            Delete Assignment
          </button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedAssignment({ ...assignment })
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
