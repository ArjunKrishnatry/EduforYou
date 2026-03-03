import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, FileText, AlertCircle } from 'lucide-react'

interface UploadedFile {
  path: string
  name: string
  size: number
  status: 'pending' | 'parsing' | 'done' | 'error'
  text?: string
  error?: string
}

interface FileUploaderProps {
  files: UploadedFile[]
  onFilesAdded: (paths: string[]) => void
  onFileRemove: (path: string) => void
  onBrowse: () => void
  isProcessing?: boolean
}

// Extended File type for Electron which includes path
interface ElectronFile extends File {
  path: string
}

export function FileUploader({
  files,
  onFilesAdded,
  onFileRemove,
  onBrowse,
  isProcessing = false
}: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // In Electron, File objects have a 'path' property
    const paths = acceptedFiles
      .map((f) => (f as ElectronFile).path)
      .filter((p): p is string => typeof p === 'string' && p.length > 0)

    console.log('Dropped files paths:', paths)

    if (paths.length > 0) {
      onFilesAdded(paths)
    } else {
      console.warn('No valid file paths found in dropped files')
    }
  }, [onFilesAdded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    multiple: true,
    noClick: true, // We'll handle click via onBrowse
    noKeyboard: true,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <File className="text-red-500" size={20} />
    if (ext === 'docx' || ext === 'doc') return <FileText className="text-blue-500" size={20} />
    return <FileText className="text-gray-500" size={20} />
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-3 text-gray-400" size={32} />
        <p className="text-gray-600 dark:text-gray-400 mb-1">
          {isDragActive
            ? 'Drop files here...'
            : 'Drag & drop syllabus files here'
          }
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          or{' '}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onBrowse()
            }}
            className="text-primary-500 hover:underline font-medium"
          >
            browse
          </button>
          {' '}to select files
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Supports PDF, DOCX, DOC, TXT, MD
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Files ({files.length})
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {getFileIcon(file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {file.status === 'parsing' && 'Parsing...'}
                    {file.status === 'done' && file.text && `${file.text.length.toLocaleString()} characters extracted`}
                    {file.status === 'error' && (
                      <span className="text-red-500">{file.error || 'Failed to parse'}</span>
                    )}
                    {file.status === 'pending' && 'Waiting...'}
                  </p>
                </div>

                {/* Status indicator */}
                {file.status === 'parsing' && (
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                )}
                {file.status === 'error' && (
                  <div className="flex items-center gap-1 text-red-500" title={file.error}>
                    <AlertCircle size={16} />
                  </div>
                )}
                {file.status === 'done' && (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => onFileRemove(file.path)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  disabled={isProcessing}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
