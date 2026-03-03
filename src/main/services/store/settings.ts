import { app, safeStorage } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

interface Settings {
  groqApiKey?: string
  theme: 'light' | 'dark' | 'system'
  defaultCalendarView: 'month' | 'week' | 'list'
  notificationDaysBefore: number
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  defaultCalendarView: 'month',
  notificationDaysBefore: 7
}

function getSettingsPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'settings.json')
}

function getSecureKeyPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'secure-keys.enc')
}

export function loadSettings(): Settings {
  try {
    const path = getSettingsPath()
    if (existsSync(path)) {
      const data = readFileSync(path, 'utf-8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: Partial<Settings>): void {
  try {
    const path = getSettingsPath()
    const dir = join(path, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const current = loadSettings()
    const updated = { ...current, ...settings }

    // Don't save API key in plain settings
    const { groqApiKey, ...safeSettings } = updated
    writeFileSync(path, JSON.stringify(safeSettings, null, 2))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

export function saveApiKey(key: string): boolean {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('Encryption not available, storing key in plain text')
      const path = getSecureKeyPath()
      writeFileSync(path, key)
      return true
    }

    const encrypted = safeStorage.encryptString(key)
    const path = getSecureKeyPath()
    writeFileSync(path, encrypted)
    return true
  } catch (e) {
    console.error('Failed to save API key:', e)
    return false
  }
}

export function loadApiKey(): string | null {
  try {
    const path = getSecureKeyPath()
    if (!existsSync(path)) {
      return null
    }

    const data = readFileSync(path)

    if (!safeStorage.isEncryptionAvailable()) {
      return data.toString('utf-8')
    }

    return safeStorage.decryptString(data)
  } catch (e) {
    console.error('Failed to load API key:', e)
    return null
  }
}

export function deleteApiKey(): boolean {
  try {
    const path = getSecureKeyPath()
    if (existsSync(path)) {
      const { unlinkSync } = require('fs')
      unlinkSync(path)
    }
    return true
  } catch (e) {
    console.error('Failed to delete API key:', e)
    return false
  }
}
