import { ipcMain } from 'electron'
import { GroqService, AnalysisResult } from '../services/llm/index.js'
import { chunkText } from '../services/parser/index.js'
import { loadApiKey, saveApiKey, deleteApiKey } from '../services/store/settings.js'

let groqService: GroqService | null = null

function getGroqService(): GroqService {
  if (!groqService) {
    const apiKey = loadApiKey()
    if (!apiKey) {
      throw new Error('Groq API key not configured. Please add your API key in Settings.')
    }
    groqService = new GroqService(apiKey)
  }
  return groqService
}

export function registerLLMHandlers() {
  // Save API key
  ipcMain.handle('llm:saveApiKey', async (_event, apiKey: string) => {
    const success = saveApiKey(apiKey)
    if (success) {
      // Reset service to use new key
      groqService = null
    }
    return { success }
  })

  // Check if API key is configured
  ipcMain.handle('llm:hasApiKey', async () => {
    const key = loadApiKey()
    return { hasKey: !!key }
  })

  // Delete API key
  ipcMain.handle('llm:deleteApiKey', async () => {
    const success = deleteApiKey()
    groqService = null
    return { success }
  })

  // Test API connection
  ipcMain.handle('llm:testConnection', async () => {
    try {
      const service = getGroqService()
      const success = await service.testConnection()
      return { success, error: success ? null : 'Connection test failed' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Analyze syllabus
  ipcMain.handle(
    'llm:analyze',
    async (
      _event,
      syllabusText: string,
      options: { semesterStartDate?: string; courseName?: string }
    ) => {
      console.log('Starting syllabus analysis...')

      try {
        const service = getGroqService()

        // Check if text needs chunking (> 10000 chars)
        const chunks = chunkText(syllabusText, 10000, 500)
        console.log(`Text split into ${chunks.length} chunk(s)`)

        let result: AnalysisResult

        if (chunks.length === 1) {
          // Single chunk - analyze directly
          result = await service.analyzeSyllabus(chunks[0], options.semesterStartDate)
        } else {
          // Multiple chunks - analyze each and merge
          const chunkResults: AnalysisResult[] = []

          for (let i = 0; i < chunks.length; i++) {
            console.log(`Analyzing chunk ${i + 1}/${chunks.length}...`)
            const chunkResult = await service.analyzeSyllabus(
              chunks[i],
              options.semesterStartDate
            )
            chunkResults.push(chunkResult)
          }

          console.log('Merging chunk results...')
          result = await service.mergeChunkResults(chunkResults)
        }

        // Override course name if provided
        if (options.courseName) {
          result.courseName = options.courseName
        }

        console.log('Analysis complete:', {
          courseName: result.courseName,
          assignments: result.assignments?.length || 0,
          materials: result.materials?.length || 0
        })

        return {
          success: true,
          data: result
        }
      } catch (error) {
        console.error('Analysis failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Analysis failed'
        }
      }
    }
  )
}
