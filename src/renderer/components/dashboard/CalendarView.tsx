import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, EventClickArg } from '@fullcalendar/core'
import type { Course, Assignment } from '../../../shared/types'

interface CalendarViewProps {
  courses: Course[]
  onEventClick: (assignment: Assignment, course: Course) => void
}

export function CalendarView({ courses, onEventClick }: CalendarViewProps) {
  // Convert assignments to calendar events
  const events: EventInput[] = useMemo(() => {
    return courses.flatMap(course =>
      course.assignments
        .filter(assignment => assignment.dueDate)
        .map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          start: assignment.dueDate,
          allDay: true,
          backgroundColor: assignment.isCompleted ? '#9ca3af' : course.color,
          borderColor: assignment.isCompleted ? '#9ca3af' : course.color,
          textColor: '#ffffff',
          extendedProps: {
            assignment,
            course,
            type: assignment.type,
            weight: assignment.weight,
            isCompleted: assignment.isCompleted
          },
          classNames: assignment.isCompleted ? ['opacity-60', 'line-through'] : []
        }))
    )
  }, [courses])

  const handleEventClick = (info: EventClickArg) => {
    const { assignment, course } = info.event.extendedProps
    if (assignment && course) {
      onEventClick(assignment, course)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <style>{`
          .fc {
            --fc-border-color: var(--calendar-border, #e5e7eb);
            --fc-button-bg-color: var(--calendar-btn-bg, #f3f4f6);
            --fc-button-border-color: var(--calendar-btn-border, #d1d5db);
            --fc-button-text-color: var(--calendar-btn-text, #374151);
            --fc-button-hover-bg-color: var(--calendar-btn-hover, #e5e7eb);
            --fc-button-hover-border-color: var(--calendar-btn-hover-border, #9ca3af);
            --fc-button-active-bg-color: var(--calendar-btn-active, #4073ff);
            --fc-button-active-border-color: var(--calendar-btn-active-border, #4073ff);
            --fc-today-bg-color: var(--calendar-today, rgba(64, 115, 255, 0.1));
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: var(--calendar-neutral-bg, #f9fafb);
            --fc-list-event-hover-bg-color: var(--calendar-list-hover, #f3f4f6);
          }

          .dark .fc {
            --fc-border-color: #374151;
            --fc-button-bg-color: #374151;
            --fc-button-border-color: #4b5563;
            --fc-button-text-color: #e5e7eb;
            --fc-button-hover-bg-color: #4b5563;
            --fc-button-hover-border-color: #6b7280;
            --fc-button-active-bg-color: #4073ff;
            --fc-button-active-border-color: #4073ff;
            --fc-today-bg-color: rgba(64, 115, 255, 0.2);
            --fc-neutral-bg-color: #1f2937;
            --fc-list-event-hover-bg-color: #374151;
          }

          .fc .fc-toolbar-title {
            font-size: 1.25rem;
            font-weight: 600;
          }

          .dark .fc .fc-toolbar-title,
          .dark .fc .fc-col-header-cell-cushion,
          .dark .fc .fc-daygrid-day-number,
          .dark .fc .fc-list-day-text,
          .dark .fc .fc-list-day-side-text {
            color: #e5e7eb;
          }

          .fc .fc-button {
            font-weight: 500;
            padding: 0.4rem 0.75rem;
            font-size: 0.875rem;
            border-radius: 0.5rem;
          }

          .fc .fc-button:focus {
            box-shadow: 0 0 0 2px rgba(64, 115, 255, 0.3);
          }

          .fc .fc-daygrid-event {
            border-radius: 4px;
            padding: 2px 4px;
            font-size: 0.75rem;
            cursor: pointer;
          }

          .fc .fc-daygrid-day.fc-day-today {
            background-color: var(--fc-today-bg-color);
          }

          .fc .fc-event:hover {
            filter: brightness(0.9);
          }

          .fc .fc-list-event {
            cursor: pointer;
          }

          .fc .fc-list-event:hover td {
            background-color: var(--fc-list-event-hover-bg-color);
          }

          .fc .fc-list-event-dot {
            border-radius: 50%;
          }

          .fc-theme-standard .fc-list {
            border: none;
          }
        `}</style>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          aspectRatio={1.5}
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventDisplay="block"
          displayEventTime={false}
          eventContent={(arg) => (
            <div className="px-1 py-0.5 truncate">
              <span className="font-medium">{arg.event.title}</span>
              {arg.event.extendedProps.weight && (
                <span className="ml-1 opacity-75">
                  ({arg.event.extendedProps.weight}%)
                </span>
              )}
            </div>
          )}
        />
      </div>

      {/* Legend */}
      {courses.length > 0 && (
        <div className="px-4 pb-4 flex flex-wrap gap-3">
          {courses.map(course => (
            <div key={course.id} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: course.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {course.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
