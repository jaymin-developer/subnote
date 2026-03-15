import Anthropic from '@anthropic-ai/sdk'

import { type SummaryType } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL_FAST = 'claude-3-haiku-20240307'
const MODEL_SMART = 'claude-sonnet-4-20250514'
const RETRY_DELAYS_MS = [2000, 5000, 10000] as const

const sleep = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

const getStatusCode = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  if ('status' in error) {
    const status = error.status
    return typeof status === 'number' ? status : null
  }

  if ('statusCode' in error) {
    const statusCode = error.statusCode
    return typeof statusCode === 'number' ? statusCode : null
  }

  return null
}

const withRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
  let lastError: unknown

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      const statusCode = getStatusCode(error)
      const isRetriable = statusCode === 429 || statusCode === 529

      if (!isRetriable || attempt === RETRY_DELAYS_MS.length) {
        throw error
      }

      await sleep(RETRY_DELAYS_MS[attempt])
    }
  }

  throw lastError instanceof Error ? lastError : new Error('UNKNOWN_CLAUDE_ERROR')
}

const extractText = (content: { type: string; text?: string }[]): string => {
  return content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text ?? '')
    .join('\n')
    .trim()
}

const extractJsonPayload = (raw: string): string => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)

  if (fenced?.[1]) {
    return fenced[1].trim()
  }

  return raw.trim()
}

const parsePoints = (raw: string): string[] => {
  const jsonPayload = extractJsonPayload(raw)
  const parsed: unknown = JSON.parse(jsonPayload)

  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    throw new Error('INVALID_POINTS_FORMAT')
  }

  return parsed
}

const parseAllSummaries = (raw: string): { oneline: string; points: string[]; full: string } => {
  const jsonPayload = extractJsonPayload(raw)
  const parsed: unknown = JSON.parse(jsonPayload)

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('INVALID_SUMMARY_FORMAT')
  }

  const candidate = parsed as Record<string, unknown>
  const oneline = candidate.oneline
  const points = candidate.points
  const full = candidate.full

  if (typeof oneline !== 'string' || typeof full !== 'string') {
    throw new Error('INVALID_SUMMARY_FORMAT')
  }

  if (!Array.isArray(points) || points.some((item) => typeof item !== 'string')) {
    throw new Error('INVALID_SUMMARY_FORMAT')
  }

  return {
    oneline,
    points,
    full,
  }
}

const createMessage = async (params: {
  system: string
  user: string
  maxTokens: number
  model?: string
}): Promise<string> => {
  const response = await withRetry(() => {
    return anthropic.messages.create({
      model: params.model ?? MODEL_FAST,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: [{ role: 'user', content: params.user }],
    })
  })

  return extractText(response.content)
}

export const correctSubtitle = async (rawText: string): Promise<string> => {
  const systemPrompt = `당신은 유튜브 자막 교정 전문가입니다.
아래 규칙을 모두 적용해 교정하세요.
1) 맞춤법과 문법 오류를 수정한다.
2) 띄어쓰기를 자연스럽게 교정한다.
3) 과도한 구어체는 문어체로 다듬는다.
4) 문맥에 맞게 전문용어와 고유명사를 교정한다.
5) 가독성을 위해 의미 단위로 단락을 분리한다.
원문의 의미와 뉘앙스는 반드시 보존한다.
교정 결과만 출력하고, 설명이나 부연은 절대 추가하지 않는다.`

  return createMessage({
    system: systemPrompt,
    user: rawText,
    maxTokens: 6000,
  })
}

export const generateSummary = async (correctedText: string, type: SummaryType): Promise<string | string[]> => {
  if (type === 'oneline') {
    const output = await createMessage({
      system: '당신은 한국어 요약 전문가입니다. 핵심 메시지를 한 문장으로만 작성하세요.',
      user: correctedText,
      maxTokens: 200,
    })

    return output
  }

  if (type === 'points') {
    const output = await createMessage({
      system:
        '당신은 한국어 요약 전문가입니다. 핵심 포인트 3~5개를 JSON 문자열 배열로만 출력하세요. 예: ["포인트1", "포인트2"]',
      user: correctedText,
      maxTokens: 800,
    })

    return parsePoints(output)
  }

  const output = await createMessage({
    system:
      '당신은 한국어 요약 전문가입니다. 섹션 제목과 본문으로 구성된 구조화 요약을 작성하세요. 불필요한 서두 없이 결과만 출력하세요.',
    user: correctedText,
    maxTokens: 1800,
  })

  return output
}

export const generateAllSummaries = async (
  correctedText: string,
): Promise<{ oneline: string; points: string[]; full: string }> => {
  await sleep(3000)

  const output = await createMessage({
    system: `당신은 한국어 요약 전문가입니다.
입력 텍스트를 바탕으로 아래 3가지 요약을 한 번에 생성하세요.
- oneline: 핵심 메시지 1문장
- points: 핵심 포인트 3~5개 문자열 배열
- full: 섹션별 구조화 요약
반드시 JSON 객체만 출력하세요.
스키마: {"oneline":"...","points":["..."],"full":"..."}`,
    user: correctedText,
    maxTokens: 2400,
    model: MODEL_SMART,
  })

  return parseAllSummaries(output)
}
