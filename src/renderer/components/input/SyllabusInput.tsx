import React, { useState, useCallback } from 'react'
import { FileText, Type, ArrowRight, AlertCircle } from 'lucide-react'
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

interface SyllabusInputProps {
  onAnalyze: (text: string, courseName: string, semesterId: string) => void
  isAnalyzing?: boolean
}

export function SyllabusInput({ onAnalyze, isAnalyzing = false }: SyllabusInputProps) {
  const [mode, setMode] = useState<InputMode>('upload')
  const [pastedText, setPastedText] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [courseName, setCourseName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)

  const { semesters, currentSemesterId } = useSemesterStore()
  const [selectedSemesterId, setSelectedSemesterId] = useState(currentSemesterId || '')

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

    // Add files with pending status
    const newFiles: UploadedFile[] = paths.map((path) => ({
      path,
      name: path.split('/').pop() || path,
      size: 0,
      status: 'pending' as const
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Parse each file
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

  // Handle file removal
  const handleFileRemove = useCallback((path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path))
  }, [])

  // Get combined text from all sources
  const getCombinedText = (): string => {
    if (mode === 'paste') {
      return pastedText.trim()
    } else {
      const parsedTexts = files
        .filter((f) => f.status === 'done' && f.text)
        .map((f) => f.text!)

      if (parsedTexts.length === 0) return ''
      if (parsedTexts.length === 1) return parsedTexts[0]

      // Merge multiple files with separator
      return parsedTexts.join('\n\n--- Next Document ---\n\n')
    }
  }

  // Check if ready to analyze
  const canAnalyze = (): boolean => {
    if (!courseName.trim()) return false
    if (!selectedSemesterId) return false

    const text = getCombinedText()
    if (!text || text.length < 50) return false

    if (mode === 'upload') {
      const hasErrors = files.some((f) => f.status === 'error')
      const hasPending = files.some((f) => f.status === 'pending' || f.status === 'parsing')
      if (hasErrors || hasPending || files.length === 0) return false
    }

    return true
  }

  // Handle analyze button
  const handleAnalyze = () => {
    if (!canAnalyze()) return

    const text = getCombinedText()
    onAnalyze(text, courseName.trim(), selectedSemesterId)
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
              {sem.name}
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
          onClick={() => setMode('upload')}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors
            ${mode === 'upload'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }
          `}
        >
          <FileText size={20} />
          <span className="font-medium">Upload Files</span>
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors
            ${mode === 'paste'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
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
            onChange={setPastedText}
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
      {textLength > 0 && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Ready to analyze:</strong> {textLength.toLocaleString()} characters
            {textLength > 15000 && (
              <span className="ml-2 text-orange-500">
                (will be processed in chunks)
              </span>
            )}
          </p>
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
            <span>Analyzing...</span>
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
        AI will extract assignments, exams, due dates, and grade weights from your syllabus.
      </p>
    </div>
  )
}
