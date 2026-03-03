import Groq from 'groq-sdk'
import { SYLLABUS_ANALYSIS_PROMPT, CHUNK_MERGE_PROMPT } from './prompts.js'

export interface AnalysisResult {
  courseName: string
  courseCode?: string
  term?: string
  instructor: {
    name: string
    email?: string
    phone?: string
    officeLocation?: string
    officeHours?: Array<{
      day: string
      startTime: string
      endTime: string
      location?: string
    }>
  }
  assignments: Array<{
    title: string
    type: string
    description?: string
    dueDate?: string
    dueDateRaw?: string
    weight?: number
    estimatedTime?: string
    relatedTopics?: string[]
    isPotentialDuplicate?: boolean
  }>
  gradeWeights: Array<{
    category: string
    weight: number
    description?: string
  }>
  materials: Array<{
    type: string
    title: string
    author?: string
    isbn?: string
    url?: string
    isRequired: boolean
    notes?: string
  }>
  prepTips: Array<{
    category: string
    content: string
    priority: string
  }>
  policies?: {
    attendance?: string
    lateWork?: string
    academicIntegrity?: string
    grading?: string
    other?: string[]
  }
}

export class GroqService {
  private client: Groq

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey })
  }

  async analyzeSyllabus(
    syllabusText: string,
    semesterStartDate?: string
  ): Promise<AnalysisResult> {
    let contextNote = ''
    if (semesterStartDate) {
      contextNote = `\n\nNote: The semester starts on ${semesterStartDate}. Use this to calculate dates for relative references like "Week 3".`
    }

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: SYLLABUS_ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: `Please analyze this syllabus and extract structured information:${contextNote}\n\n${syllabusText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from Groq API')
    }

    try {
      return JSON.parse(content) as AnalysisResult
    } catch (e) {
      throw new Error(`Failed to parse LLM response as JSON: ${e}`)
    }
  }

  async mergeChunkResults(results: AnalysisResult[]): Promise<AnalysisResult> {
    if (results.length === 1) {
      return results[0]
    }

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: CHUNK_MERGE_PROMPT
        },
        {
          role: 'user',
          content: `Merge these partial syllabus analysis results:\n\n${JSON.stringify(results, null, 2)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from Groq API during merge')
    }

    return JSON.parse(content) as AnalysisResult
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: 'Say "ok" and nothing else.' }
        ],
        max_tokens: 10
      })
      return !!response.choices[0]?.message?.content
    } catch (e) {
      return false
    }
  }
}
