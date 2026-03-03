import { app, BrowserWindow, nativeTheme } from "electron";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = dirname(__filename$1);
function getStorePath() {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, "window-state.json");
}
function loadWindowBounds() {
  try {
    const path = getStorePath();
    if (existsSync(path)) {
      const data = readFileSync(path, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load window bounds:", e);
  }
  return { width: 1200, height: 800 };
}
function saveWindowBoundsToFile(bounds) {
  try {
    const path = getStorePath();
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(path, JSON.stringify(bounds, null, 2));
  } catch (e) {
    console.error("Failed to save window bounds:", e);
  }
}
let mainWindow = null;
function createWindow() {
  const { width, height, x, y } = loadWindowBounds();
  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#ffffff",
    show: false
    // Don't show until ready
  });
  mainWindow.on("resize", saveWindowBounds);
  mainWindow.on("move", saveWindowBounds);
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname$1, "../dist/index.html"));
  }
}
function saveWindowBounds() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  saveWindowBoundsToFile(bounds);
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
nativeTheme.on("updated", () => {
  mainWindow?.webContents.send("theme-changed", nativeTheme.shouldUseDarkColors);
});
