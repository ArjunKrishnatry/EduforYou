import { google } from 'googleapis'
import { createServer } from 'http'
import { shell, safeStorage } from 'electron'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { Course } from '../../../shared/types.js'

const SCOPES = ['https://www.googleapis.com/auth/calendar']
const CALLBACK_PORT = 42813
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/oauth2callback`
const TOKEN_FILE = () => join(app.getPath('userData'), 'google-tokens.enc')
const CREDS_FILE = () => join(app.getPath('userData'), 'google-creds.json')

interface GoogleCredentials {
  clientId: string
  clientSecret: string
}

interface TokenData {
  access_token: string
  refresh_token?: string
  expiry_date?: number
}

// ── Credentials storage ──────────────────────────────────────────────────────

export function saveGoogleCredentials(creds: GoogleCredentials): void {
  const json = JSON.stringify(creds)
  if (safeStorage.isEncryptionAvailable()) {
    writeFileSync(TOKEN_FILE(), safeStorage.encryptString(json))
  } else {
    writeFileSync(CREDS_FILE(), json)
  }
}

export function loadGoogleCredentials(): GoogleCredentials | null {
  try {
    if (safeStorage.isEncryptionAvailable() && existsSync(TOKEN_FILE())) {
      const enc = readFileSync(TOKEN_FILE())
      return JSON.parse(safeStorage.decryptString(enc))
    }
    if (existsSync(CREDS_FILE())) {
      return JSON.parse(readFileSync(CREDS_FILE(), 'utf-8'))
    }
  } catch {
    // Corrupted – return null
  }
  return null
}

export function deleteGoogleCredentials(): void {
  const tf = TOKEN_FILE()
  const cf = CREDS_FILE()
  if (existsSync(tf)) { try { require('fs').unlinkSync(tf) } catch {} }
  if (existsSync(cf)) { try { require('fs').unlinkSync(cf) } catch {} }
}

// ── Token storage ────────────────────────────────────────────────────────────

const TOKEN_STORE = () => join(app.getPath('userData'), 'google-oauth-tokens.json')

function saveTokens(tokens: TokenData): void {
  writeFileSync(TOKEN_STORE(), JSON.stringify(tokens, null, 2))
}

function loadTokens(): TokenData | null {
  try {
    if (existsSync(TOKEN_STORE())) {
      return JSON.parse(readFileSync(TOKEN_STORE(), 'utf-8'))
    }
  } catch {}
  return null
}

export function deleteTokens(): void {
  try {
    if (existsSync(TOKEN_STORE())) require('fs').unlinkSync(TOKEN_STORE())
  } catch {}
}

export function isConnected(): boolean {
  return loadTokens() !== null
}

// ── OAuth flow ───────────────────────────────────────────────────────────────

function createOAuth2Client(creds: GoogleCredentials) {
  return new google.auth.OAuth2(creds.clientId, creds.clientSecret, REDIRECT_URI)
}

export async function initiateOAuthFlow(creds: GoogleCredentials): Promise<void> {
  const client = createOAuth2Client(creds)
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url!, `http://localhost:${CALLBACK_PORT}`)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end('<h2>Authorization denied. You can close this tab.</h2>')
          server.close()
          reject(new Error(`OAuth error: ${error}`))
          return
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' })
          res.end('<h2>Missing authorization code.</h2>')
          server.close()
          reject(new Error('Missing authorization code'))
          return
        }

        const { tokens } = await client.getToken(code)
        saveTokens(tokens as TokenData)
        // Also save credentials for future use
        saveGoogleCredentials(creds)

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end('<h2>Connected! You can close this tab and return to Syllabus Dashboard.</h2>')
        server.close()
        resolve()
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' })
        res.end('<h2>An error occurred. Please try again.</h2>')
        server.close()
        reject(err)
      }
    })

    server.listen(CALLBACK_PORT, () => {
      shell.openExternal(authUrl)
    })

    server.on('error', (err) => {
      reject(new Error(`Could not start local server on port ${CALLBACK_PORT}: ${err.message}`))
    })

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close()
      reject(new Error('OAuth timed out'))
    }, 5 * 60 * 1000)
  })
}

// ── Calendar sync ────────────────────────────────────────────────────────────

function toGoogleDate(iso: string): string {
  return iso.split('T')[0]
}

export async function syncToGoogleCalendar(courses: Course[]): Promise<{ synced: number; errors: number }> {
  const tokens = loadTokens()
  const creds = loadGoogleCredentials()
  if (!tokens || !creds) throw new Error('Not connected to Google Calendar')

  const client = createOAuth2Client(creds)
  client.setCredentials(tokens)

  // Refresh token if needed and save updated tokens
  client.on('tokens', (newTokens) => {
    const merged = { ...tokens, ...newTokens }
    saveTokens(merged as TokenData)
  })

  const calendar = google.calendar({ version: 'v3', auth: client })

  // Find or create our calendar
  let calendarId = 'primary'
  try {
    const listRes = await calendar.calendarList.list()
    const existing = listRes.data.items?.find(c => c.summary === 'Syllabus Dashboard')
    if (existing) {
      calendarId = existing.id!
    } else {
      const newCal = await calendar.calendars.insert({
        requestBody: { summary: 'Syllabus Dashboard', description: 'Managed by Syllabus Dashboard app' }
      })
      calendarId = newCal.data.id!
    }
  } catch {
    calendarId = 'primary'
  }

  let synced = 0
  let errors = 0

  for (const course of courses) {
    for (const assignment of course.assignments) {
      if (!assignment.dueDate) continue

      const eventId = `sd_${assignment.id}`.replace(/[^a-zA-Z0-9]/g, '')
      const event = {
        summary: `${course.name}: ${assignment.title}`,
        description: [
          `Type: ${assignment.type}`,
          assignment.weight !== undefined ? `Weight: ${assignment.weight}%` : '',
          assignment.description || ''
        ].filter(Boolean).join('\n'),
        start: { date: toGoogleDate(assignment.dueDate) },
        end: {
          date: toGoogleDate(
            new Date(new Date(assignment.dueDate).getTime() + 86400000).toISOString()
          )
        },
        colorId: course.color ? '9' : undefined, // blueberry default
      }

      try {
        // Try update first, then insert
        try {
          await calendar.events.update({ calendarId, eventId, requestBody: event })
        } catch {
          await calendar.events.insert({ calendarId, requestBody: { ...event, id: eventId } })
        }
        synced++
      } catch {
        errors++
      }
    }
  }

  return { synced, errors }
}
