import { Lightbulb, Clock, BookOpen, Star, Info } from 'lucide-react'
import type { PrepTip } from '../../../shared/types'

interface PrepTipsPanelProps {
  tips: PrepTip[]
}

const CATEGORY_META: Record<PrepTip['category'], { label: string; icon: typeof Lightbulb; color: string }> = {
  study_strategy: { label: 'Study Strategy', icon: BookOpen, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  time_management: { label: 'Time Management', icon: Clock, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  exam_prep: { label: 'Exam Prep', icon: Star, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
  resource_recommendation: { label: 'Resources', icon: Info, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
  general: { label: 'General', icon: Lightbulb, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
}

const PRIORITY_ORDER: Record<PrepTip['priority'], number> = { high: 0, medium: 1, low: 2 }

export function PrepTipsPanel({ tips }: PrepTipsPanelProps) {
  if (tips.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-white">Prep Tips</h3>
        </div>
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No prep tips extracted from this syllabus</p>
        </div>
      </div>
    )
  }

  const sorted = [...tips].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-white">Prep Tips</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">({tips.length})</span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {sorted.map((tip) => {
          const meta = CATEGORY_META[tip.category]
          const Icon = meta.icon
          return (
            <div key={tip.id} className={`flex items-start gap-3 p-3 rounded-lg ${meta.color}`}>
              <Icon size={18} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-75">{meta.label}</span>
                  {tip.priority === 'high' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                      High priority
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{tip.content}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
