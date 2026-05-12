import { ipcMain, Notification } from 'electron'
import {
  loadNotificationSettings,
  saveNotificationSettings,
  checkAndNotify,
} from '../services/notifications/index.js'

export function registerNotificationHandlers() {
  ipcMain.handle('notifications:getSettings', () => {
    return loadNotificationSettings()
  })

  ipcMain.handle('notifications:saveSettings', (_event, settings: { enabled: boolean; daysAhead: number }) => {
    saveNotificationSettings(settings)
    return { success: true }
  })

  ipcMain.handle('notifications:isSupported', () => {
    return { supported: Notification.isSupported() }
  })

  // Manual trigger to re-check now (useful after settings change)
  ipcMain.handle('notifications:checkNow', () => {
    checkAndNotify()
    return { success: true }
  })
}
