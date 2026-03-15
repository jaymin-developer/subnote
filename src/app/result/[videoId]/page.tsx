'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { SubtitleViewer } from '@/components/subtitle-viewer'
import { SummaryViewer } from '@/components/summary-viewer'
import { VideoInfoCard } from '@/components/video-info'
import { type AnalysisResult } from '@/types'

type ResultTab = 'summary' | 'subtitle'

const fetchResult = async (videoId: string): Promise<AnalysisResult> => {
  const res = await fetch(`/api/result/${videoId}`)
  if (!res.ok) throw new Error('NOT_FOUND')
  const json = (await res.json()) as { success: boolean; data: AnalysisResult }
  return json.data
}

const ResultPage = () => {
  const params = useParams<{ videoId: string }>()
  const [activeTab, setActiveTab] = useState<ResultTab>('summary')
  const [linkCopied, setLinkCopied] = useState(false)

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['result', params.videoId],
    queryFn: () => fetchResult(params.videoId),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const handleShareLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (isError || !result) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <p className="text-lg text-gray-500 dark:text-gray-400">분석 결과를 찾을 수 없습니다.</p>
        <Link href="/" className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
          메인으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <VideoInfoCard videoInfo={result.videoInfo} />

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('summary')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            AI 요약
          </button>
          <button
            onClick={() => setActiveTab('subtitle')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'subtitle'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            교정 자막
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShareLink}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {linkCopied ? '링크 복사됨!' : '공유'}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            새 영상 분석
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'summary' && <SummaryViewer summary={result.summary} />}
        {activeTab === 'subtitle' && <SubtitleViewer text={result.subtitleCorrected} />}
      </div>
    </div>
  )
}

export default ResultPage
