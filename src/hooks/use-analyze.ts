'use client'

import { useCallback, useState } from 'react'
import { YoutubeTranscript } from 'youtube-transcript'

import { type AnalysisResult, type SSEEvent, type SSEStepType } from '@/types'

type AnalyzeStatus = 'idle' | 'analyzing' | 'complete' | 'error'

const extractSubtitleClientSide = async (videoId: string): Promise<string | null> => {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId)
    if (!segments || segments.length === 0) return null
    return segments.map((s) => s.text.trim()).filter(Boolean).join(' ').trim()
  } catch {
    return null
  }
}

export const useAnalyze = () => {
  const [status, setStatus] = useState<AnalyzeStatus>('idle')
  const [currentStep, setCurrentStep] = useState<SSEStepType | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setCurrentStep(null)
    setResult(null)
    setError(null)
  }, [])

  const analyze = useCallback(async (url: string) => {
    reset()
    setStatus('analyzing')
    setCurrentStep('subtitle')

    try {
      const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)
      const videoId = videoIdMatch?.[1] ?? ''
      const subtitleText = videoId ? await extractSubtitleClientSide(videoId) : null

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, subtitleText }),
      })

      if (!response.ok || !response.body) {
        setStatus('error')
        setError('서버 요청에 실패했습니다.')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const dataPrefix = 'data: '
          if (!line.startsWith(dataPrefix)) continue

          const jsonStr = line.slice(dataPrefix.length)

          try {
            const event = JSON.parse(jsonStr) as SSEEvent

            setCurrentStep(event.step)

            if (event.step === 'complete') {
              setResult(event.data)
              setStatus('complete')
            } else if (event.step === 'error') {
              setError(event.message)
              setStatus('error')
            }
          } catch {
            continue
          }
        }
      }
    } catch {
      setStatus('error')
      setError('네트워크 오류가 발생했습니다.')
    }
  }, [reset])

  return { status, currentStep, result, error, analyze, reset }
}
