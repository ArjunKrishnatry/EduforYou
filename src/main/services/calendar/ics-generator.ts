import type { Course } from '../../../shared/types.js'

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

function toICSDate(iso: string): string {
  // All-day date: YYYYMMDD
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function toICSDatetime(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace('.000', '')
}

export function generateICS(courses: Course[], semesterName?: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Syllabus Dashboard//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(semesterName || 'Syllabus Dashboard')}`,
    'X-WR-TIMEZONE:UTC',
  ]

  const now = toICSDatetime(new Date().toISOString())

  for (const course of courses) {
    for (const assignment of course.assignments) {
      if (!assignment.dueDate) continue

      const uid = `${assignment.id}@syllabus-dashboard`
      const dtstart = toICSDate(assignment.dueDate)
      // Due date event ends the next day (all-day convention)
      const dtend = toICSDate(new Date(new Date(assignment.dueDate).getTime() + 86400000).toISOString())

      const descParts: string[] = []
      if (course.name) descParts.push(`Course: ${course.name}`)
      if (assignment.type) descParts.push(`Type: ${assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}`)
      if (assignment.weight !== undefined) descParts.push(`Weight: ${assignment.weight}%`)
      if (assignment.description) descParts.push(`\n${assignment.description}`)

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${uid}`)
      lines.push(`DTSTAMP:${now}`)
      lines.push(`DTSTART;VALUE=DATE:${dtstart}`)
      lines.push(`DTEND;VALUE=DATE:${dtend}`)
      lines.push(`SUMMARY:${escapeICS(`${course.name}: ${assignment.title}`)}`)
      if (descParts.length) lines.push(`DESCRIPTION:${escapeICS(descParts.join('\\n'))}`)
      lines.push(`CATEGORIES:${escapeICS(course.name)}`)
      lines.push(`COLOR:${course.color}`)
      if (assignment.isCompleted) lines.push('STATUS:COMPLETED')
      else lines.push('STATUS:CONFIRMED')
      lines.push('END:VEVENT')
    }
  }

  lines.push('END:VCALENDAR')
  // ICS spec requires CRLF line endings
  return lines.join('\r\n')
}
