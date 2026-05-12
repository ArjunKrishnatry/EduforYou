import { app, BrowserWindow, nativeTheme, Tray, Menu, nativeImage } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { registerAllHandlers } from './ipc/handlers.js'
import { createTrayIconBuffer } from './services/tray-icon.js'
import { startNotificationScheduler, stopNotificationScheduler } from './services/notifications/index.js'
import { loadCourses } from './services/store/courses.js'

// ESM compatibility: get __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Simple store for window bounds
interface WindowBounds {
  width: number
  height: number
  x?: number
  y?: number
}

function getStorePath() {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'window-state.json')
}

function loadWindowBounds(): WindowBounds {
  try {
    const path = getStorePath()
    if (existsSync(path)) {
      const data = readFileSync(path, 'utf-8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load window bounds:', e)
  }
  return { width: 1200, height: 800 }
}

function saveWindowBoundsToFile(bounds: WindowBounds) {
  try {
    const path = getStorePath()
    const dir = dirname(path)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(path, JSON.stringify(bounds, null, 2))
  } catch (e) {
    console.error('Failed to save window bounds:', e)
  }
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function buildTrayMenu() {
  const courses = loadCourses()
  const now = new Date()
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Collect upcoming assignments in the next 7 days
  const upcoming = courses
    .flatMap(c => c.assignments
      .filter(a => !a.isCompleted && a.dueDate)
      .map(a => ({ ...a, courseName: c.name }))
    )
    .filter(a => {
      const d = new Date(a.dueDate!)
      return d >= now && d <= oneWeek
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  const deadlineItems: Electron.MenuItemConstructorOptions[] = upcoming.length
    ? upcoming.map(a => ({
        label: `${a.courseName}: ${a.title} – ${new Date(a.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
        enabled: false,
      }))
    : [{ label: 'No upcoming deadlines', enabled: false }]

  return Menu.buildFromTemplate([
    { label: 'Syllabus Dashboard', enabled: false },
    { type: 'separator' },
    ...deadlineItems,
    { type: 'separator' },
    { label: 'Open', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { label: 'Quit', click: () => app.quit() },
  ])
}

function createTray() {
  const iconBuffer = createTrayIconBuffer()
  const icon = nativeImage.createFromBuffer(iconBuffer)
  if (process.platform === 'darwin') icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('Syllabus Dashboard')
  tray.setContextMenu(buildTrayMenu())

  // Refresh menu on click so deadlines are current
  tray.on('click', () => {
    tray?.setContextMenu(buildTrayMenu())
    if (process.platform !== 'darwin') {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}

function createWindow() {
  // Get saved window bounds
  const { width, height, x, y } = loadWindowBounds()

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff',
    show: false, // Don't show until ready
  })

  // Save window bounds on resize/move
  mainWindow.on('resize', saveWindowBounds)
  mainWindow.on('move', saveWindowBounds)

  // Show when ready to prevent flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Hide to tray instead of quitting on close
  mainWindow.on('close', (event) => {
    if (tray) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

function saveWindowBounds() {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  saveWindowBoundsToFile(bounds)
}

// App lifecycle
app.whenReady().then(() => {
  registerAllHandlers()
  createWindow()
  createTray()
  startNotificationScheduler()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  // Keep running in tray on all platforms
  // User must quit via tray menu or Cmd+Q
  if (!tray && process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopNotificationScheduler()
  tray?.destroy()
})

// Handle dark mode changes
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors)
})
