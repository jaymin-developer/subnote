'use client'

import { useState } from 'react'

import { type SummaryType } from '@/types'

interface SummaryViewerProps {
  summary: {
    oneline: string
    points: string[]
    full: string
  }
}

const TABS: { key: SummaryType; label: string }[] = [
  { key: 'oneline', label: '한 줄 요약' },
  { key: 'points', label: '핵심 포인트' },
  { key: 'full', label: '전체 요약' },
]

export const SummaryViewer = ({ summary }: SummaryViewerProps) => {
  const [activeTab, setActiveTab] = useState<SummaryType>('points')

  return (
    <div>
      <div className="flex gap-1 mb-4 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        {activeTab === 'oneline' && (
          <p className="text-xl font-medium leading-relaxed text-gray-900 dark:text-white">
            {summary.oneline}
          </p>
        )}

        {activeTab === 'points' && (
          <ul className="space-y-3">
            {summary.points.map((point, i) => (
              <li key={i} className="flex gap-3 text-gray-800 dark:text-gray-200">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'full' && (
          <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200">
            {summary.full.split('\n').map((line, i) => {
              if (line.startsWith('##')) {
                return <h3 key={i} className="mt-4 mb-2 text-base font-semibold text-gray-900 dark:text-white">{line.replace(/^#+\s*/, '')}</h3>
              }
              if (line.startsWith('#')) {
                return <h2 key={i} className="mt-4 mb-2 text-lg font-bold text-gray-900 dark:text-white">{line.replace(/^#+\s*/, '')}</h2>
              }
              if (!line.trim()) return <br key={i} />
              return <p key={i} className="mb-2 leading-relaxed">{line}</p>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
