'use client'

import { useState, type FormEvent } from 'react'

interface UrlInputProps {
  onSubmit: (url: string) => void
  isLoading: boolean
}

const isYouTubeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    return host === 'www.youtube.com' || host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be'
  } catch {
    return false
  }
}

export const UrlInput = ({ onSubmit, isLoading }: UrlInputProps) => {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const trimmed = url.trim()
    if (!trimmed) {
      setValidationError('URL을 입력해주세요.')
      return
    }

    if (!isYouTubeUrl(trimmed)) {
      setValidationError('유효한 YouTube URL을 입력해주세요.')
      return
    }

    setValidationError(null)
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            if (validationError) setValidationError(null)
          }}
          placeholder="YouTube URL을 붙여넣으세요"
          disabled={isLoading}
          className="flex-1 rounded-xl border border-gray-300 px-5 py-4 text-lg
            placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            disabled:cursor-not-allowed disabled:opacity-60
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white
            transition-colors hover:bg-blue-700 active:bg-blue-800
            disabled:cursor-not-allowed disabled:opacity-60
            dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              분석 중...
            </span>
          ) : (
            '분석하기'
          )}
        </button>
      </div>
      {validationError && (
        <p className="mt-2 text-sm text-red-500">{validationError}</p>
      )}
    </form>
  )
}
