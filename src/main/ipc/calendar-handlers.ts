import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'fs'
import { loadCourses } from '../services/store/courses.js'
import { generateICS } from '../services/calendar/ics-generator.js'
import {
  initiateOAuthFlow,
  syncToGoogleCalendar,
  isConnected,
  deleteTokens,
  deleteGoogleCredentials,
  loadGoogleCredentials,
  saveGoogleCredentials,
} from '../services/calendar/google-calendar.js'

export function registerCalendarHandlers() {
  // Export .ics file
  ipcMain.handle('calendar:exportICS', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: 'syllabus-calendar.ics',
      filters: [{ name: 'iCalendar', extensions: ['ics'] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true }
    }

    try {
      const courses = loadCourses()
      const ics = generateICS(courses)
      writeFileSync(result.filePath, ics, 'utf-8')
      return { success: true, path: result.filePath }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Export failed' }
    }
  })

  // Check if Google Calendar is connected
  ipcMain.handle('calendar:isConnected', () => {
    return { connected: isConnected() }
  })

  // Check if Google credentials are saved
  ipcMain.handle('calendar:hasCredentials', () => {
    const creds = loadGoogleCredentials()
    return { hasCredentials: creds !== null, clientId: creds?.clientId || '' }
  })

  // Save Google credentials (client ID + secret)
  ipcMain.handle('calendar:saveCredentials', async (_event, clientId: string, clientSecret: string) => {
    try {
      saveGoogleCredentials({ clientId, clientSecret })
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save credentials' }
    }
  })

  // Initiate Google OAuth flow
  ipcMain.handle('calendar:googleConnect', async () => {
    const creds = loadGoogleCredentials()
    if (!creds) {
      return { success: false, error: 'No Google credentials configured. Please add your Client ID and Client Secret first.' }
    }

    try {
      await initiateOAuthFlow(creds)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'OAuth failed' }
    }
  })

  // Sync to Google Calendar
  ipcMain.handle('calendar:googleSync', async () => {
    try {
      const courses = loadCourses()
      const result = await syncToGoogleCalendar(courses)
      return { success: true, ...result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sync failed' }
    }
  })

  // Disconnect Google Calendar
  ipcMain.handle('calendar:googleDisconnect', async () => {
    deleteTokens()
    deleteGoogleCredentials()
    return { success: true }
  })
}
