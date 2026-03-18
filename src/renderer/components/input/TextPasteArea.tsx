import { useState } from 'react'
import { Clipboard, X } from 'lucide-react'

interface TextPasteAreaProps {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  maxLength?: number
}

export function TextPasteArea({
  value,
  onChange,
  placeholder = 'Paste your syllabus text here...',
  maxLength = 100000
}: TextPasteAreaProps) {
  const [isFocused, setIsFocused] = useState(false)

  const charCount = value.length
  const isNearLimit = charCount > maxLength * 0.9

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange(text)
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="space-y-2">
      <div
        className={`
          relative rounded-lg border-2 transition-colors
          ${isFocused
            ? 'border-primary-500 ring-2 ring-primary-500/20'
            : 'border-gray-300 dark:border-gray-600'
          }
        `}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full h-64 p-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none rounded-lg"
        />

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Clear text"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={handlePaste}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Paste from clipboard"
          >
            <Clipboard size={16} />
          </button>
        </div>
      </div>

      {/* Character count */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {charCount > 0 && `${charCount.toLocaleString()} characters`}
        </span>
        <span className={isNearLimit ? 'text-orange-500' : ''}>
          {isNearLimit && `${maxLength.toLocaleString()} max`}
        </span>
      </div>
    </div>
  )
}
