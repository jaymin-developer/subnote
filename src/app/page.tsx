'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { ProgressIndicator } from '@/components/progress-indicator'
import { UrlInput } from '@/components/url-input'
import { useAnalyze } from '@/hooks/use-analyze'
import { extractVideoId } from '@/lib/youtube'

const HomePage = () => {
  const router = useRouter()
  const { status, currentStep, result, error, analyze, reset } = useAnalyze()

  useEffect(() => {
    if (status === 'complete' && result) {
      router.push(`/result/${result.videoInfo.videoId}`)
    }
  }, [status, result, router])

  return (
    <div className="flex flex-col items-center justify-center px-4 py-20">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          유튜브 영상을
          <br />
          <span className="text-blue-600 dark:text-blue-400">읽을 수 있는 글</span>로
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          URL 하나만 넣으면 자막 추출, 한글 교정, AI 요약까지 한번에
        </p>
      </div>

      <UrlInput
        onSubmit={analyze}
        isLoading={status === 'analyzing'}
      />

      {status === 'analyzing' && (
        <ProgressIndicator currentStep={currentStep} error={null} />
      )}

      {status === 'error' && (
        <div className="mt-8 text-center">
          <ProgressIndicator currentStep={currentStep} error={error} />
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  )
}

export default HomePage
