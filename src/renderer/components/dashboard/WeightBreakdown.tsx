import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
import type { Course } from '../../../shared/types'

interface WeightBreakdownProps {
  course: Course
}

const COLORS = [
  '#4073ff', // Blue
  '#299438', // Green
  '#ff9933', // Orange
  '#884dff', // Purple
  '#dc4c3e', // Red
  '#158fad', // Teal
  '#ffd43b', // Yellow
  '#eb96eb', // Pink
  '#808080', // Gray
]

export function WeightBreakdown({ course }: WeightBreakdownProps) {
  // Prepare data for pie chart
  const chartData = course.gradeWeights.map((weight, index) => ({
    name: weight.category,
    value: weight.weight,
    color: COLORS[index % COLORS.length]
  }))

  // If no grade weights, show assignments by type
  const assignmentTypeData = course.assignments.reduce((acc, assignment) => {
    const existing = acc.find(a => a.name === assignment.type)
    if (existing) {
      existing.value += assignment.weight || 0
    } else {
      acc.push({
        name: assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1),
        value: assignment.weight || 0,
        color: COLORS[acc.length % COLORS.length]
      })
    }
    return acc
  }, [] as { name: string; value: number; color: string }[])

  const data = chartData.length > 0 ? chartData : assignmentTypeData
  const totalWeight = data.reduce((sum, d) => sum + d.value, 0)

  if (data.length === 0 || totalWeight === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Grade Breakdown
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No grade weights available</p>
          <p className="text-sm mt-1">Weights will appear when extracted from syllabus</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <PieChartIcon className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {chartData.length > 0 ? 'Grade Breakdown' : 'Assignment Weights'}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ value }) => `${value}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`, 'Weight']}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weight details */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.value}%
              </span>
            </div>
          ))}

          {totalWeight !== 100 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <span className={`font-medium ${totalWeight === 100 ? 'text-green-500' : 'text-orange-500'}`}>
                  {totalWeight}%
                </span>
              </div>
              {totalWeight !== 100 && (
                <p className="text-xs text-orange-500 mt-1">
                  Note: Weights don't add up to 100%
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
