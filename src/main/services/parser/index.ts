import { readFile } from 'fs/promises'
import { extname } from 'path'
import { createRequire } from 'module'

// Create require for CommonJS modules
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')
const mammoth = require('mammoth')

// PDF parsing (pdf-parse v1.x)
async function parsePDF(filePath: string): Promise<string> {
  const buffer = await readFile(filePath)
  const data = await pdfParse(buffer)
  return data.text
}

// DOCX parsing
async function parseDOCX(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath })
  return result.value
}

// Plain text parsing
async function parseTXT(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8')
  return content
}

// Main parser function
export async function parseFile(filePath: string): Promise<{ text: string; pages?: number }> {
  const ext = extname(filePath).toLowerCase()

  switch (ext) {
    case '.pdf':
      const pdfText = await parsePDF(filePath)
      // Estimate pages (rough: ~3000 chars per page)
      const estimatedPages = Math.ceil(pdfText.length / 3000)
      return { text: pdfText, pages: estimatedPages }

    case '.docx':
    case '.doc':
      const docText = await parseDOCX(filePath)
      return { text: docText }

    case '.txt':
    case '.md':
      const txtText = await parseTXT(filePath)
      return { text: txtText }

    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}

// Chunk text for long documents (for LLM processing)
export function chunkText(text: string, maxChunkSize: number = 12000, overlap: number = 500): string[] {
  if (text.length <= maxChunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + maxChunkSize

    // Try to break at a paragraph or sentence boundary
    if (end < text.length) {
      // Look for paragraph break
      const paragraphBreak = text.lastIndexOf('\n\n', end)
      if (paragraphBreak > start + maxChunkSize / 2) {
        end = paragraphBreak + 2
      } else {
        // Look for sentence break
        const sentenceBreak = text.lastIndexOf('. ', end)
        if (sentenceBreak > start + maxChunkSize / 2) {
          end = sentenceBreak + 2
        }
      }
    }

    chunks.push(text.slice(start, end))
    start = end - overlap // Overlap for context continuity
  }

  return chunks
}

// Merge multiple file contents
export function mergeTexts(texts: string[]): string {
  return texts.join('\n\n---\n\n')
}
