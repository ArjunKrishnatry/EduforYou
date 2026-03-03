import React, { useState, useCallback, useEffect } from 'react'
import { FileText, Type, ArrowRight, AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { TextPasteArea } from './TextPasteArea'
import { FileUploader } from './FileUploader'
import { useSemesterStore } from '../../store'

type InputMode = 'paste' | 'upload'

interface UploadedFile {
  path: string
  name: string
  size: number
  status: 'pending' | 'parsing' | 'done' | 'error'
  text?: string
  error?: string
}

interface AnalysisResult {
  courseName: string
  courseCode?: string
  instructor?: {
    name: string
    email?: string
  }
  assignments: Array<{
    title: string
    type: string
    dueDate?: string
    dueDateRaw?: string
    weight?: number
  }>
  gradeWeights: Array<{
    category: string
    weight: number
  }>
  materials: Array<{
    title: string
    isRequired: boolean
  }>
}

interface SyllabusInputProps {
  onAnalyzeComplete: (result: AnalysisResult, courseName: string, semesterId: string) => void
  onOpenSettings: () => void
}

export function SyllabusInput({ onAnalyzeComplete, onOpenSettings }: SyllabusInputProps) {
  const [mode, setMode] = useState<InputMode>('upload')
  const [pastedText, setPastedText] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [courseName, setCourseName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const { semesters, currentSemesterId } = useSemesterStore()
  const [selectedSemesterId, setSelectedSemesterId] = useState(currentSemesterId || '')

  const selectedSemester = semesters.find(s => s.id === selectedSemesterId)

  // Check for API key on mount
  useEffect(() => {
    checkApiKey()
  }, [])

  const checkApiKey = async () => {
    const result = await window.electronAPI.hasApiKey()
    setHasApiKey(result.hasKey)
  }

  // Handle file selection via dialog
  const handleBrowse = useCallback(async () => {
    try {
      const paths = await window.electronAPI.selectFiles()
      if (paths && paths.length > 0) {
        handleFilesAdded(paths)
      }
    } catch (err) {
      setError('Failed to open file dialog')
    }
  }, [])

  // Handle files added (from dialog or drop)
  const handleFilesAdded = useCallback(async (paths: string[]) => {
    setError(null)
    setIsProcessingFiles(true)
    setAnalysisResult(null)

    const newFiles: UploadedFile[] = paths.map((path) => ({
      path,
      name: path.split('/').pop() || path,
      size: 0,
      status: 'pending' as const
    }))

    setFiles((prev) => [...prev, ...newFiles])

    for (const file of newFiles) {
      setFiles((prev) =>
        prev.map((f) =>
          f.path === file.path ? { ...f, status: 'parsing' as const } : f
        )
      )

      try {
        const result = await window.electronAPI.parseFile(file.path)

        if (result.success) {
          setFiles((prev) =>
            prev.map((f) =>
              f.path === file.path
                ? {
                    ...f,
                    status: 'done' as const,
                    text: result.text,
                    size: result.charCount || 0
                  }
                : f
            )
          )
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.path === file.path
                ? { ...f, status: 'error' as const, error: result.error }
                : f
            )
          )
        }
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.path === file.path
              ? { ...f, status: 'error' as const, error: 'Failed to parse file' }
              : f
          )
        )
      }
    }

    setIsProcessingFiles(false)
  }, [])

  const handleFileRemove = useCallback((path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path))
    setAnalysisResult(null)
  }, [])

  const getCombinedText = (): string => {
    if (mode === 'paste') {
      return pastedText.trim()
    } else {
      const parsedTexts = files
        .filter((f) => f.status === 'done' && f.text)
        .map((f) => f.text!)

      if (parsedTexts.length === 0) return ''
      if (parsedTexts.length === 1) return parsedTexts[0]
      return parsedTexts.join('\n\n--- Next Document ---\n\n')
    }
  }

  const canAnalyze = (): boolean => {
    if (!courseName.trim()) return false
    if (!selectedSemesterId) return false
    if (!hasApiKey) return false

    const text = getCombinedText()
    if (!text || text.length < 50) return false

    if (mode === 'upload') {
      const hasErrors = files.some((f) => f.status === 'error')
      const hasPending = files.some((f) => f.status === 'pending' || f.status === 'parsing')
      if (hasErrors || hasPending || files.length === 0) return false
    }

    return true
  }

  const handleAnalyze = async () => {
    if (!canAnalyze()) return

    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    const text = getCombinedText()

    try {
      const result = await window.electronAPI.analyzeSyllabus(text, {
        semesterStartDate: selectedSemester?.startDate,
        courseName: courseName.trim()
      })

      if (result.success && result.data) {
        setAnalysisResult(result.data)
        onAnalyzeComplete(result.data, courseName.trim(), selectedSemesterId)
      } else {
        setError(result.error || 'Analysis failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const textLength = getCombinedText().length

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Add New Course
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Upload your syllabus or paste the text to extract assignments and deadlines.
      </p>

      {/* API Key Warning */}
      {hasApiKey === false && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-500 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                API Key Required
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You need to configure your Groq API key to analyze syllabi.
              </p>
              <button
                onClick={onOpenSettings}
                className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:underline inline-flex items-center gap-1"
              >
                <Settings size={14} />
                Open Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course name input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Course Name
        </label>
        <input
          type="text"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="e.g., CS 101: Introduction to Computer Science"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Semester selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Semester
        </label>
        <select
          value={selectedSemesterId}
          onChange={(e) => setSelectedSemesterId(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select a semester...</option>
          {semesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.name} (starts {new Date(sem.startDate).toLocaleDateString()})
            </option>
          ))}
        </select>
        {semesters.length === 0 && (
          <p className="mt-1 text-sm text-orange-500">
            Please add a semester first using the tabs above.
          </p>
        )}
      </div>

      {/* Input mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode('upload'); setAnalysisResult(null) }}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors
            ${mode === 'upload'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }
          `}
        >
          <FileText size={20} />
          <span className="font-medium">Upload Files</span>
        </button>
        <button
          onClick={() => { setMode('paste'); setAnalysisResult(null) }}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors
            ${mode === 'paste'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }
          `}
        >
          <Type size={20} />
          <span className="font-medium">Paste Text</span>
        </button>
      </div>

      {/* Input area */}
      <div className="mb-6">
        {mode === 'upload' ? (
          <FileUploader
            files={files}
            onFilesAdded={handleFilesAdded}
            onFileRemove={handleFileRemove}
            onBrowse={handleBrowse}
            isProcessing={isProcessingFiles}
          />
        ) : (
          <TextPasteArea
            value={pastedText}
            onChange={(text) => { setPastedText(text); setAnalysisResult(null) }}
          />
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Text preview info */}
      {textLength > 0 && !analysisResult && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Ready to analyze:</strong> {textLength.toLocaleString()} characters
            {textLength > 10000 && (
              <span className="ml-2 text-orange-500">
                (will be processed in chunks)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Analysis Result Preview */}
      {analysisResult && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-green-500" size={20} />
            <span className="font-medium text-green-700 dark:text-green-300">
              Analysis Complete!
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Assignments found</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {analysisResult.assignments?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Materials</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {analysisResult.materials?.length || 0}
              </p>
            </div>
            {analysisResult.instructor?.name && (
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Instructor</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {analysisResult.instructor.name}
                  {analysisResult.instructor.email && (
                    <span className="text-gray-500 ml-2">({analysisResult.instructor.email})</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={!canAnalyze() || isAnalyzing}
        className={`
          w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
          ${canAnalyze() && !isAnalyzing
            ? 'bg-primary-500 hover:bg-primary-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {isAnalyzing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Analyzing with AI...</span>
          </>
        ) : analysisResult ? (
          <>
            <CheckCircle size={20} />
            <span>Course Added!</span>
          </>
        ) : (
          <>
            <span>Analyze Syllabus</span>
            <ArrowRight size={20} />
          </>
        )}
      </button>

      {/* Help text */}
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {hasApiKey
          ? 'AI will extract assignments, exams, due dates, and grade weights.'
          : 'Configure your Groq API key in Settings to enable analysis.'}
      </p>
    </div>
  )
}
