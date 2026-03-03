import React, { useState } from 'react'
import { Star, Plus, X } from 'lucide-react'
import { useSemesterStore } from '../../store'
import type { Semester } from '../../types'

interface AddSemesterModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, startDate: string) => void
}

function AddSemesterModal({ isOpen, onClose, onAdd }: AddSemesterModalProps) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && startDate) {
      onAdd(name, startDate)
      setName('')
      setStartDate('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add New Semester
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Semester Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fall 2026"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg"
            >
              Add Semester
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function SemesterTabs() {
  const [showAddModal, setShowAddModal] = useState(false)
  const {
    semesters,
    currentSemesterId,
    setCurrentSemester,
    toggleStarred,
    addSemester,
  } = useSemesterStore()

  const handleAddSemester = (name: string, startDate: string) => {
    addSemester({
      name,
      startDate,
      isStarred: semesters.length === 0, // Star first semester by default
    })
  }

  return (
    <>
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto custom-scrollbar">
        {semesters.map((semester) => (
          <SemesterTab
            key={semester.id}
            semester={semester}
            isActive={semester.id === currentSemesterId}
            onSelect={() => setCurrentSemester(semester.id)}
            onToggleStar={() => toggleStarred(semester.id)}
          />
        ))}

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Add Semester</span>
        </button>
      </div>

      <AddSemesterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSemester}
      />
    </>
  )
}

interface SemesterTabProps {
  semester: Semester
  isActive: boolean
  onSelect: () => void
  onToggleStar: () => void
}

function SemesterTab({ semester, isActive, onSelect, onToggleStar }: SemesterTabProps) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors
        ${isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
        }
      `}
      onClick={onSelect}
    >
      <span className="text-sm font-medium whitespace-nowrap">{semester.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleStar()
        }}
        className={`
          p-0.5 rounded transition-colors
          ${semester.isStarred
            ? 'text-yellow-500 hover:text-yellow-600'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }
        `}
        title={semester.isStarred ? 'Unstar semester' : 'Star semester (pin to dashboard)'}
      >
        <Star size={14} fill={semester.isStarred ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
