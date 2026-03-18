import { Book, Globe, Monitor, Wrench, FileText, ExternalLink } from 'lucide-react'
import type { Material } from '../../../shared/types'

interface MaterialsListProps {
  materials: Material[]
}

const TYPE_ICONS: Record<string, typeof Book> = {
  textbook: Book,
  online_resource: Globe,
  software: Monitor,
  equipment: Wrench,
  reading: FileText,
  other: FileText
}

const TYPE_LABELS: Record<string, string> = {
  textbook: 'Textbook',
  online_resource: 'Online Resource',
  software: 'Software',
  equipment: 'Equipment',
  reading: 'Reading',
  other: 'Other'
}

export function MaterialsList({ materials }: MaterialsListProps) {
  if (materials.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Book className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Course Materials
          </h3>
        </div>
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Book className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No materials listed</p>
        </div>
      </div>
    )
  }

  const required = materials.filter(m => m.isRequired)
  const optional = materials.filter(m => !m.isRequired)

  const MaterialItem = ({ material }: { material: Material }) => {
    const Icon = TYPE_ICONS[material.type] || FileText

    return (
      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
          <Icon size={18} className="text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {material.title}
              </p>
              {material.author && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  by {material.author}
                </p>
              )}
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
              {TYPE_LABELS[material.type] || material.type}
            </span>
          </div>

          {material.isbn && (
            <p className="text-xs text-gray-400 mt-1">
              ISBN: {material.isbn}
            </p>
          )}

          {material.url && (
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 mt-2"
            >
              <ExternalLink size={14} />
              Open Link
            </a>
          )}

          {material.notes && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {material.notes}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Book className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Course Materials
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({materials.length})
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {required.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Required
            </h4>
            <div className="space-y-2">
              {required.map((material) => (
                <MaterialItem key={material.id} material={material} />
              ))}
            </div>
          </div>
        )}

        {optional.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Optional / Recommended
            </h4>
            <div className="space-y-2">
              {optional.map((material) => (
                <MaterialItem key={material.id} material={material} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
