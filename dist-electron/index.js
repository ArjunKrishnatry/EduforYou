import { ipcMain, BrowserWindow, dialog, app, nativeTheme } from "electron";
import { extname, basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { createRequire } from "module";
const require$1 = createRequire(import.meta.url);
const pdfParse = require$1("pdf-parse");
const mammoth = require$1("mammoth");
async function parsePDF(filePath) {
  const buffer = await readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}
async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}
async function parseTXT(filePath) {
  const content = await readFile(filePath, "utf-8");
  return content;
}
async function parseFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      const pdfText = await parsePDF(filePath);
      const estimatedPages = Math.ceil(pdfText.length / 3e3);
      return { text: pdfText, pages: estimatedPages };
    case ".docx":
    case ".doc":
      const docText = await parseDOCX(filePath);
      return { text: docText };
    case ".txt":
    case ".md":
      const txtText = await parseTXT(filePath);
      return { text: txtText };
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
function chunkText(text, maxChunkSize = 12e3, overlap = 500) {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChunkSize;
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + maxChunkSize / 2) {
        end = paragraphBreak + 2;
      } else {
        const sentenceBreak = text.lastIndexOf(". ", end);
        if (sentenceBreak > start + maxChunkSize / 2) {
          end = sentenceBreak + 2;
        }
      }
    }
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  return chunks;
}
function mergeTexts(texts) {
  return texts.join("\n\n---\n\n");
}
function registerFileHandlers() {
  ipcMain.handle("file:select", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Documents", extensions: ["pdf", "docx", "doc", "txt", "md"] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths;
  });
  ipcMain.handle("file:parse", async (_event, filePath) => {
    console.log("Parsing file:", filePath);
    try {
      const { text, pages } = await parseFile(filePath);
      console.log("Parse success:", text.length, "chars");
      return {
        success: true,
        fileName: basename(filePath),
        text,
        pages,
        charCount: text.length
      };
    } catch (error) {
      console.error("Parse error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
  ipcMain.handle("file:parseMultiple", async (_event, filePaths) => {
    console.log("Parsing multiple files:", filePaths);
    try {
      const results = await Promise.all(
        filePaths.map(async (path) => {
          const { text } = await parseFile(path);
          return { fileName: basename(path), text };
        })
      );
      const mergedText = mergeTexts(results.map((r) => r.text));
      return {
        success: true,
        files: results.map((r) => r.fileName),
        text: mergedText,
        charCount: mergedText.length
      };
    } catch (error) {
      console.error("Parse multiple error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
  ipcMain.handle("file:chunk", async (_event, text, maxChunkSize) => {
    const chunks = chunkText(text, maxChunkSize);
    return {
      chunks,
      count: chunks.length
    };
  });
}
function registerAllHandlers() {
  registerFileHandlers();
}
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
  registerAllHandlers();
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
