import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, Sliders } from 'lucide-react'
import type { Course } from '../../../shared/types'

interface GradeCalculatorProps {
  course: Course
}

interface WhatIfScenario {
  assignmentId: string
  projectedGrade: number
}

export function GradeCalculator({ course }: GradeCalculatorProps) {
  const [whatIfScenarios, setWhatIfScenarios] = useState<WhatIfScenario[]>([])
  const [showWhatIf, setShowWhatIf] = useState(false)

  // Calculate current grade from completed assignments
  const gradeStats = useMemo(() => {
    const completedWithGrades = course.assignments.filter(
      a => a.isCompleted && a.gradeReceived !== undefined && a.weight !== undefined
    )

    const upcomingAssignments = course.assignments.filter(
      a => !a.isCompleted && a.weight !== undefined
    )

    // Sum of weights for graded assignments
    const gradedWeight = completedWithGrades.reduce((sum, a) => sum + (a.weight || 0), 0)

    // Weighted sum of grades
    const weightedGradeSum = completedWithGrades.reduce(
      (sum, a) => sum + ((a.gradeReceived || 0) * (a.weight || 0) / 100),
      0
    )

    // Current grade (normalized to completed weight)
    const currentGrade = gradedWeight > 0 ? (weightedGradeSum / gradedWeight) * 100 : null

    // Total possible weight
    const totalWeight = course.assignments.reduce((sum, a) => sum + (a.weight || 0), 0)

    // Remaining weight
    const remainingWeight = upcomingAssignments.reduce((sum, a) => sum + (a.weight || 0), 0)

    return {
      currentGrade,
      gradedWeight,
      totalWeight,
      remainingWeight,
      completedWithGrades,
      upcomingAssignments,
      weightedGradeSum
    }
  }, [course.assignments])

  // Calculate what-if grade
  const whatIfGrade = useMemo(() => {
    if (!showWhatIf || whatIfScenarios.length === 0) return null

    let totalWeightedSum = gradeStats.weightedGradeSum
    let totalWeight = gradeStats.gradedWeight

    for (const scenario of whatIfScenarios) {
      const assignment = course.assignments.find(a => a.id === scenario.assignmentId)
      if (assignment && assignment.weight) {
        totalWeightedSum += (scenario.projectedGrade * assignment.weight) / 100
        totalWeight += assignment.weight
      }
    }

    return totalWeight > 0 ? (totalWeightedSum / totalWeight) * 100 : null
  }, [showWhatIf, whatIfScenarios, gradeStats, course.assignments])

  const handleScenarioChange = (assignmentId: string, grade: number) => {
    setWhatIfScenarios(prev => {
      const existing = prev.find(s => s.assignmentId === assignmentId)
      if (existing) {
        return prev.map(s => s.assignmentId === assignmentId ? { ...s, projectedGrade: grade } : s)
      }
      return [...prev, { assignmentId, projectedGrade: grade }]
    })
  }

  const getLetterGrade = (percentage: number | null): string => {
    if (percentage === null) return '--'
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const getGradeColor = (percentage: number | null): string => {
    if (percentage === null) return 'text-gray-400'
    if (percentage >= 90) return 'text-green-500'
    if (percentage >= 80) return 'text-blue-500'
    if (percentage >= 70) return 'text-yellow-500'
    if (percentage >= 60) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="text-gray-400" size={20} />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Grade Calculator
            </h3>
          </div>
          <button
            onClick={() => setShowWhatIf(!showWhatIf)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showWhatIf
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Sliders size={14} />
            What-If Mode
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Current Grade Display */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Grade</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getGradeColor(gradeStats.currentGrade)}`}>
                {gradeStats.currentGrade !== null
                  ? `${gradeStats.currentGrade.toFixed(1)}%`
                  : '--'
                }
              </span>
              <span className={`text-2xl font-semibold ${getGradeColor(gradeStats.currentGrade)}`}>
                ({getLetterGrade(gradeStats.currentGrade)})
              </span>
            </div>
          </div>

          {showWhatIf && whatIfGrade !== null && (
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Projected Grade</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${getGradeColor(whatIfGrade)}`}>
                  {whatIfGrade.toFixed(1)}%
                </span>
                <span className={`text-xl font-semibold ${getGradeColor(whatIfGrade)}`}>
                  ({getLetterGrade(whatIfGrade)})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">
              Weight Completed: {gradeStats.gradedWeight.toFixed(1)}%
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Remaining: {gradeStats.remainingWeight.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${Math.min(gradeStats.gradedWeight, 100)}%` }}
            />
          </div>
        </div>

        {/* Completed Assignments Summary */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Completed ({gradeStats.completedWithGrades.length})
          </p>
          <div className="space-y-2">
            {gradeStats.completedWithGrades.slice(0, 3).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                  {assignment.title}
                </span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {assignment.gradeReceived}%
                </span>
                <span className="ml-2 text-gray-400 text-xs">
                  ({assignment.weight}%)
                </span>
              </div>
            ))}
            {gradeStats.completedWithGrades.length > 3 && (
              <p className="text-xs text-gray-400">
                +{gradeStats.completedWithGrades.length - 3} more
              </p>
            )}
          </div>
        </div>

        {/* What-If Scenarios */}
        {showWhatIf && gradeStats.upcomingAssignments.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <TrendingUp size={16} />
              Project Future Grades
            </p>
            <div className="space-y-4">
              {gradeStats.upcomingAssignments.map((assignment) => {
                const scenario = whatIfScenarios.find(s => s.assignmentId === assignment.id)
                const projectedGrade = scenario?.projectedGrade ?? 85

                return (
                  <div key={assignment.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                        {assignment.title}
                      </span>
                      <span className="ml-2 text-gray-400 text-xs">
                        ({assignment.weight}% weight)
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white w-12 text-right">
                        {projectedGrade}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={projectedGrade}
                      onChange={(e) => handleScenarioChange(assignment.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                  </div>
                )
              })}
            </div>

            {/* Quick presets */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  gradeStats.upcomingAssignments.forEach(a => {
                    handleScenarioChange(a.id, 70)
                  })
                }}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                All C (70%)
              </button>
              <button
                onClick={() => {
                  gradeStats.upcomingAssignments.forEach(a => {
                    handleScenarioChange(a.id, 80)
                  })
                }}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                All B (80%)
              </button>
              <button
                onClick={() => {
                  gradeStats.upcomingAssignments.forEach(a => {
                    handleScenarioChange(a.id, 90)
                  })
                }}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                All A (90%)
              </button>
              <button
                onClick={() => {
                  gradeStats.upcomingAssignments.forEach(a => {
                    handleScenarioChange(a.id, 100)
                  })
                }}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                All 100%
              </button>
            </div>
          </div>
        )}

        {showWhatIf && gradeStats.upcomingAssignments.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No upcoming assignments with weights to project
          </p>
        )}
      </div>
    </div>
  )
}
