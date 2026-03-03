import { app, BrowserWindow, nativeTheme } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

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
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle dark mode changes
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors)
})
