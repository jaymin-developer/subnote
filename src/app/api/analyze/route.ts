import { NextRequest, NextResponse } from 'next/server'

import { generateAllSummaries, correctSubtitle } from '@/lib/claude'
import { getCachedAnalysis, saveAnalysis } from '@/lib/supabase'
import { extractVideoId, fetchSubtitle, fetchVideoInfo } from '@/lib/youtube'
import { type AnalysisResult, type SSEEvent } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const createInvalidUrlResponse = () => {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INVALID_URL',
        message: '유효한 YouTube URL이 아닙니다.',
      },
    },
    { status: 400 },
  )
}

const isAnalyzeRequestBody = (value: unknown): value is { url: string } => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  if (!('url' in value)) {
    return false
  }

  return typeof value.url === 'string'
}

const sendEvent = (controller: ReadableStreamDefaultController, encoder: TextEncoder, event: SSEEvent): void => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
}

export const POST = async (request: NextRequest) => {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return createInvalidUrlResponse()
  }

  if (!isAnalyzeRequestBody(body)) {
    return createInvalidUrlResponse()
  }

  const videoId = extractVideoId(body.url)

  if (!videoId) {
    return createInvalidUrlResponse()
  }

  const stream = new ReadableStream({
    start: async (controller) => {
      const encoder = new TextEncoder()

      try {
        const cachedResult = await getCachedAnalysis(videoId)

        if (cachedResult) {
          sendEvent(controller, encoder, {
            step: 'complete',
            data: cachedResult,
          })
          controller.close()
          return
        }

        sendEvent(controller, encoder, {
          step: 'info',
          message: '영상 정보를 불러오는 중...',
        })
        const videoInfo = await fetchVideoInfo(videoId)

        sendEvent(controller, encoder, {
          step: 'subtitle',
          message: '자막을 추출하는 중...',
        })

        let subtitleRaw: string

        try {
          subtitleRaw = await fetchSubtitle(videoId)
        } catch (error) {
          if (error instanceof Error && error.message === 'NO_SUBTITLE') {
            sendEvent(controller, encoder, {
              step: 'error',
              message: '이 영상은 자막이 없어 처리할 수 없습니다.',
              code: 'NO_SUBTITLE',
            })
            controller.close()
            return
          }

          throw error
        }

        sendEvent(controller, encoder, {
          step: 'correct',
          message: '자막을 교정하는 중...',
        })
        const subtitleCorrected = await correctSubtitle(subtitleRaw)

        sendEvent(controller, encoder, {
          step: 'summary',
          message: '요약을 생성하는 중...',
        })
        const summary = await generateAllSummaries(subtitleCorrected)

        const result: AnalysisResult = {
          videoInfo,
          subtitleRaw,
          subtitleCorrected,
          summary,
          processedAt: new Date().toISOString(),
          cached: false,
        }

        try {
          await saveAnalysis(result)
        } catch (error) {
          console.error(error)
        }

        sendEvent(controller, encoder, {
          step: 'complete',
          data: result,
        })
        controller.close()
      } catch (error) {
        const message = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.'

        sendEvent(controller, encoder, {
          step: 'error',
          message,
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
