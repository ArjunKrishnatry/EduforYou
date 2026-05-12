import { Notification, app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { loadCourses } from '../store/courses.js'

// File that tracks which notifications have been shown today
function getNotificationLogPath(): string {
  return join(app.getPath('userData'), 'notification-log.json')
}

interface NotificationLog {
  date: string // YYYY-MM-DD
  shown: string[] // assignment IDs shown today
}

function loadLog(): NotificationLog {
  try {
    if (existsSync(getNotificationLogPath())) {
      const data = JSON.parse(readFileSync(getNotificationLogPath(), 'utf-8')) as NotificationLog
      const today = new Date().toISOString().split('T')[0]
      if (data.date === today) return data
    }
  } catch {}
  return { date: new Date().toISOString().split('T')[0], shown: [] }
}

function saveLog(log: NotificationLog): void {
  try {
    writeFileSync(getNotificationLogPath(), JSON.stringify(log, null, 2))
  } catch {}
}

// Notification settings storage
const SETTINGS_FILE = () => join(app.getPath('userData'), 'notification-settings.json')

interface NotificationSettings {
  enabled: boolean
  daysAhead: number // warn this many days before due date
}

export function loadNotificationSettings(): NotificationSettings {
  try {
    if (existsSync(SETTINGS_FILE())) {
      return JSON.parse(readFileSync(SETTINGS_FILE(), 'utf-8'))
    }
  } catch {}
  return { enabled: true, daysAhead: 7 }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  writeFileSync(SETTINGS_FILE(), JSON.stringify(settings, null, 2))
}

function daysUntil(isoDate: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(isoDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - now.getTime()) / 86400000)
}

function dueDayLabel(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

export function checkAndNotify(): void {
  const settings = loadNotificationSettings()
  if (!settings.enabled) return
  if (!Notification.isSupported()) return

  const courses = loadCourses()
  const log = loadLog()
  const today = new Date().toISOString().split('T')[0]

  // Reset log if it's a new day
  if (log.date !== today) {
    log.date = today
    log.shown = []
  }

  for (const course of courses) {
    for (const assignment of course.assignments) {
      if (assignment.isCompleted) continue
      if (!assignment.dueDate) continue
      if (log.shown.includes(assignment.id)) continue

      const days = daysUntil(assignment.dueDate)
      if (days < 0 || days > settings.daysAhead) continue

      const weightStr = assignment.weight !== undefined ? ` (${assignment.weight}% of grade)` : ''
      const title = `${course.name}: ${assignment.title}`
      const body = `Due ${dueDayLabel(days)}${weightStr}`

      new Notification({ title, body, silent: false }).show()
      log.shown.push(assignment.id)
    }
  }

  saveLog(log)
}

let notificationTimer: ReturnType<typeof setInterval> | null = null

export function startNotificationScheduler(): void {
  // Check immediately on startup, then every hour
  checkAndNotify()
  notificationTimer = setInterval(checkAndNotify, 60 * 60 * 1000)
}

export function stopNotificationScheduler(): void {
  if (notificationTimer) {
    clearInterval(notificationTimer)
    notificationTimer = null
  }
}
