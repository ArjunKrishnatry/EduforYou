import { useState, useEffect } from 'react'
import { X, Key, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [hasExistingKey, setHasExistingKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      checkExistingKey()
    }
  }, [isOpen])

  const checkExistingKey = async () => {
    const result = await window.electronAPI.hasApiKey()
    setHasExistingKey(result.hasKey)
  }

  const handleSave = async () => {
    if (!apiKey.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await window.electronAPI.saveApiKey(apiKey.trim())
      if (result.success) {
        setHasExistingKey(true)
        setApiKey('')
        setTestResult(null)
      } else {
        setError('Failed to save API key')
      }
    } catch (e) {
      setError('Failed to save API key')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    setError(null)

    try {
      // If there's a new key entered, save it first
      if (apiKey.trim()) {
        await window.electronAPI.saveApiKey(apiKey.trim())
        setHasExistingKey(true)
        setApiKey('')
      }

      const result = await window.electronAPI.testConnection()
      setTestResult(result.success ? 'success' : 'error')
      if (!result.success && result.error) {
        setError(result.error)
      }
    } catch (e) {
      setTestResult('error')
      setError('Connection test failed')
    } finally {
      setIsTesting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your API key?')) return

    await window.electronAPI.deleteApiKey()
    setHasExistingKey(false)
    setTestResult(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Groq API Key Section */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key size={18} className="text-gray-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Groq API Key
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Required for AI-powered syllabus analysis. Get your free API key from{' '}
              <a
                href="https://console.groq.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline inline-flex items-center gap-1"
              >
                console.groq.com
                <ExternalLink size={12} />
              </a>
            </p>

            {hasExistingKey ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="text-green-500" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    API key configured
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Your key is securely stored
                  </p>
                </div>
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-500 hover:text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="text-red-500" size={18} />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Test result */}
          {testResult === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="text-green-500" size={18} />
              <p className="text-sm text-green-700 dark:text-green-300">
                Connection successful! Your API key is working.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {!hasExistingKey && apiKey.trim() && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Key'}
              </button>
            )}
            <button
              onClick={handleTest}
              disabled={isTesting || (!hasExistingKey && !apiKey.trim())}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Groq Free Tier
          </h4>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <li>• 14,400 requests per day</li>
            <li>• 30 requests per minute</li>
            <li>• Enough for ~50+ syllabus analyses per day</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
