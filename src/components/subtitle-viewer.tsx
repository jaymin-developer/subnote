'use client'

import { useCallback, useState } from 'react'

interface SubtitleViewerProps {
  text: string
}

export const SubtitleViewer = ({ text }: SubtitleViewerProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subtitle.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [text])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCopy}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium
            transition-colors hover:bg-gray-50 active:bg-gray-100
            dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {copied ? '복사됨!' : '복사하기'}
        </button>
        <button
          onClick={handleDownload}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium
            transition-colors hover:bg-gray-50 active:bg-gray-100
            dark:border-gray-600 dark:hover:bg-gray-700"
        >
          .txt 다운로드
        </button>
      </div>
      <div className="max-h-[500px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
        {text.split('\n').map((paragraph, i) => (
          <p key={i} className={paragraph.trim() ? 'mb-3' : 'mb-1'}>
            {paragraph || '\u00A0'}
          </p>
        ))}
      </div>
    </div>
  )
}
