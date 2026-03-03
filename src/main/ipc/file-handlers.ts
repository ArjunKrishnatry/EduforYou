import { ipcMain, dialog, BrowserWindow } from 'electron'
import { basename } from 'path'
import { parseFile, chunkText, mergeTexts } from '../services/parser/index.js'

export function registerFileHandlers() {
  // Open file dialog
  ipcMain.handle('file:select', async (event) => {
    // Get the window that sent this request
    const win = BrowserWindow.fromWebContents(event.sender)

    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Documents', extensions: ['pdf', 'docx', 'doc', 'txt', 'md'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths
  })

  // Parse a single file
  ipcMain.handle('file:parse', async (_event, filePath: string) => {
    console.log('Parsing file:', filePath)
    try {
      const { text, pages } = await parseFile(filePath)
      console.log('Parse success:', text.length, 'chars')
      return {
        success: true,
        fileName: basename(filePath),
        text,
        pages,
        charCount: text.length
      }
    } catch (error) {
      console.error('Parse error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Parse multiple files and merge
  ipcMain.handle('file:parseMultiple', async (_event, filePaths: string[]) => {
    console.log('Parsing multiple files:', filePaths)
    try {
      const results = await Promise.all(
        filePaths.map(async (path) => {
          const { text } = await parseFile(path)
          return { fileName: basename(path), text }
        })
      )

      const mergedText = mergeTexts(results.map(r => r.text))

      return {
        success: true,
        files: results.map(r => r.fileName),
        text: mergedText,
        charCount: mergedText.length
      }
    } catch (error) {
      console.error('Parse multiple error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Chunk text for LLM processing
  ipcMain.handle('file:chunk', async (_event, text: string, maxChunkSize?: number) => {
    const chunks = chunkText(text, maxChunkSize)
    return {
      chunks,
      count: chunks.length
    }
  })
}
