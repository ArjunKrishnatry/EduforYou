import { useState, useEffect } from 'react'
import { X, Key, CheckCircle, AlertCircle, Loader2, ExternalLink, Download, FileText, FileSpreadsheet, FileType, Calendar, Bell, RefreshCw, Link, Unlink } from 'lucide-react'
import { useCourseStore } from '../../store'

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

        {/* Export Section */}
        <ExportSection />

        {/* Calendar Section */}
        <CalendarSection />

        {/* Notifications Section */}
        <NotificationsSection />
      </div>
    </div>
  )
}

function ExportSection() {
  const { exportJSON, exportCSV, exportPDF, courses } = useCourseStore()
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const handleExport = async (type: 'json' | 'csv' | 'pdf') => {
    setIsExporting(type)
    try {
      if (type === 'json') await exportJSON()
      else if (type === 'csv') await exportCSV()
      else if (type === 'pdf') await exportPDF()
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Download size={18} className="text-gray-500" />
        <h3 className="font-medium text-gray-900 dark:text-white">
          Export Data
        </h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Export your courses and assignments to a file.
      </p>

      {courses.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          No courses to export. Add a course first.
        </p>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors"
          >
            {isExporting === 'json' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors"
          >
            {isExporting === 'csv' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={16} />
            )}
            CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors"
          >
            {isExporting === 'pdf' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileType size={16} />
            )}
            PDF
          </button>
        </div>
      )}
    </div>
  )
}

// ── Calendar Section ──────────────────────────────────────────────────────────

function CalendarSection() {
  const [isExporting, setIsExporting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [showCredentialsForm, setShowCredentialsForm] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [syncResult, setSyncResult] = useState<{ synced?: number; errors?: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    refreshStatus()
  }, [])

  const refreshStatus = async () => {
    const [connResult, credsResult] = await Promise.all([
      window.electronAPI.calendarIsConnected(),
      window.electronAPI.calendarHasCredentials(),
    ])
    setIsConnected(connResult.connected)
    setHasCredentials(credsResult.hasCredentials)
    if (credsResult.clientId) setClientId(credsResult.clientId)
  }

  const handleExportICS = async () => {
    setIsExporting(true)
    setError(null)
    try {
      await window.electronAPI.exportICS()
    } finally {
      setIsExporting(false)
    }
  }

  const handleSaveCredentials = async () => {
    if (!clientId.trim() || !clientSecret.trim()) return
    setError(null)
    const result = await window.electronAPI.calendarSaveCredentials(clientId.trim(), clientSecret.trim())
    if (result.success) {
      setHasCredentials(true)
      setShowCredentialsForm(false)
    } else {
      setError(result.error || 'Failed to save credentials')
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const result = await window.electronAPI.calendarGoogleConnect()
      if (result.success) {
        setIsConnected(true)
      } else {
        setError(result.error || 'Connection failed')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)
    setSyncResult(null)
    try {
      const result = await window.electronAPI.calendarGoogleSync()
      if (result.success) {
        setSyncResult({ synced: result.synced, errors: result.errors })
      } else {
        setError(result.error || 'Sync failed')
      }
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Calendar? This will not delete events already synced.')) return
    await window.electronAPI.calendarGoogleDisconnect()
    setIsConnected(false)
    setHasCredentials(false)
    setClientId('')
    setClientSecret('')
    setSyncResult(null)
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={18} className="text-gray-500" />
        <h3 className="font-medium text-gray-900 dark:text-white">Calendar</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {syncResult && (
        <div className="flex items-center gap-2 p-3 mb-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
          <p className="text-sm text-green-700 dark:text-green-300">
            Synced {syncResult.synced} event{syncResult.synced !== 1 ? 's' : ''}
            {syncResult.errors ? `, ${syncResult.errors} failed` : ''}
          </p>
        </div>
      )}

      {/* .ics export */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Export all assignments as an .ics file to import into any calendar app (Apple Calendar, Outlook, etc.)
        </p>
        <button
          onClick={handleExportICS}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
          Export .ics File
        </button>
      </div>

      {/* Google Calendar */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google Calendar</span>
            {isConnected && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle size={12} /> Connected
              </span>
            )}
          </div>
          {isConnected && (
            <button onClick={handleDisconnect} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
              <Unlink size={12} /> Disconnect
            </button>
          )}
        </div>

        {isConnected ? (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        ) : (
          <div className="space-y-3">
            {!showCredentialsForm && (
              <button
                onClick={() => setShowCredentialsForm(true)}
                className="text-sm text-primary-500 hover:underline"
              >
                {hasCredentials ? 'Change credentials' : 'Set up Google credentials →'}
              </button>
            )}

            {showCredentialsForm && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Create OAuth credentials at{' '}
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline inline-flex items-center gap-0.5">
                    console.cloud.google.com <ExternalLink size={10} />
                  </a>
                  {' '}with redirect URI:{' '}
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">http://localhost:42813/oauth2callback</code>
                </p>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Client ID"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Client Secret"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveCredentials} disabled={!clientId.trim() || !clientSecret.trim()}
                    className="px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 transition-colors">
                    Save
                  </button>
                  <button onClick={() => setShowCredentialsForm(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {hasCredentials && !showCredentialsForm && (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Link size={16} />}
                {isConnecting ? 'Opening browser...' : 'Connect Google Calendar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Notifications Section ─────────────────────────────────────────────────────

function NotificationsSection() {
  const [enabled, setEnabled] = useState(true)
  const [daysAhead, setDaysAhead] = useState(7)
  const [isSupported, setIsSupported] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [settings, support] = await Promise.all([
        window.electronAPI.notificationsGetSettings(),
        window.electronAPI.notificationsIsSupported(),
      ])
      setEnabled(settings.enabled)
      setDaysAhead(settings.daysAhead)
      setIsSupported(support.supported)
    }
    load()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    await window.electronAPI.notificationsSaveSettings({ enabled, daysAhead })
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // Trigger an immediate check with new settings
    if (enabled) window.electronAPI.notificationsCheckNow()
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={18} className="text-gray-500" />
        <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
      </div>

      {!isSupported && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
          System notifications are not supported on this platform.
        </p>
      )}

      <div className="space-y-4">
        {/* Toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Desktop notifications</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Alert when assignments are due soon</p>
          </div>
          <button
            onClick={() => setEnabled(prev => !prev)}
            disabled={!isSupported}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled && isSupported ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled && isSupported ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>

        {/* Days ahead slider */}
        {enabled && isSupported && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-gray-700 dark:text-gray-300 font-medium">Warn this many days ahead</label>
              <span className="text-primary-600 dark:text-primary-400 font-medium">{daysAhead} {daysAhead === 1 ? 'day' : 'days'}</span>
            </div>
            <input
              type="range"
              min={1}
              max={14}
              value={daysAhead}
              onChange={e => setDaysAhead(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 day</span>
              <span>14 days</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || !isSupported}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : null}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
