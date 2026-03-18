import { User, Mail, Phone, MapPin, Clock } from 'lucide-react'
import type { Instructor } from '../../../shared/types'

interface InstructorInfoProps {
  instructor?: Instructor
}

export function InstructorInfo({ instructor }: InstructorInfoProps) {
  if (!instructor || !instructor.name) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Instructor
          </h3>
        </div>
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No instructor info available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <User className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Instructor
          </h3>
        </div>
      </div>

      <div className="p-5">
        {/* Name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
              {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {instructor.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Instructor
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          {instructor.email && (
            <a
              href={`mailto:${instructor.email}`}
              className="flex items-center gap-3 text-sm hover:text-primary-500 transition-colors"
            >
              <Mail size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {instructor.email}
              </span>
            </a>
          )}

          {instructor.phone && (
            <a
              href={`tel:${instructor.phone}`}
              className="flex items-center gap-3 text-sm hover:text-primary-500 transition-colors"
            >
              <Phone size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {instructor.phone}
              </span>
            </a>
          )}

          {instructor.officeLocation && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {instructor.officeLocation}
              </span>
            </div>
          )}
        </div>

        {/* Office Hours */}
        {instructor.officeHours && instructor.officeHours.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Office Hours
              </span>
            </div>
            <div className="space-y-2">
              {instructor.officeHours.map((hours, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-gray-900 dark:text-white min-w-[80px]">
                    {hours.day}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {hours.startTime} - {hours.endTime}
                    {hours.location && (
                      <span className="text-gray-400 ml-2">
                        ({hours.location})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
