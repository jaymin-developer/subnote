import { fetchTranscript, type TranscriptConfig, type TranscriptResponse } from 'youtube-transcript-plus'

import { type VideoInfo } from '@/types'

type TranscriptFetchOptions = Pick<TranscriptConfig, 'videoFetch' | 'transcriptFetch' | 'playerFetch' | 'userAgent'>

const defaultTranscriptOptions: TranscriptFetchOptions = {}

const oEmbedEndpoint = 'https://www.youtube.com/oembed'

export const extractVideoId = (url: string): string | null => {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const pathSegments = parsed.pathname.split('/').filter(Boolean)

    if (host === 'youtu.be') {
      return pathSegments[0] ?? null
    }

    if (host === 'www.youtube.com' || host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v')
      }

      if (pathSegments[0] === 'shorts' && pathSegments[1]) {
        return pathSegments[1]
      }
    }
  } catch {
    return null
  }

  return null
}

export const fetchVideoInfo = async (videoId: string): Promise<VideoInfo> => {
  const requestUrl = `${oEmbedEndpoint}?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error('FAILED_TO_FETCH_VIDEO_INFO')
  }

  const data = (await response.json()) as {
    title?: string
    author_name?: string
    thumbnail_url?: string
  }

  return {
    videoId,
    title: data.title ?? '',
    channel: data.author_name ?? '',
    duration: 0,
    thumbnail: data.thumbnail_url ?? '',
  }
}

const toPlainSubtitleText = (segments: TranscriptResponse[]): string => {
  return segments
    .map((segment) => segment.text.trim())
    .filter((segmentText) => segmentText.length > 0)
    .join(' ')
    .trim()
}

const fetchSubtitleByLanguage = async (videoId: string, lang?: string): Promise<TranscriptResponse[]> => {
  const transcriptConfig: TranscriptConfig = {
    ...defaultTranscriptOptions,
    ...(lang ? { lang } : {}),
  }

  return fetchTranscript(videoId, transcriptConfig)
}

export const fetchSubtitle = async (videoId: string, lang?: string): Promise<string> => {
  const languagePriority = [lang, 'ko', 'en'].filter((item): item is string => Boolean(item))
  const attemptedLanguages = new Set<string>()

  for (const candidateLanguage of languagePriority) {
    if (attemptedLanguages.has(candidateLanguage)) {
      continue
    }

    attemptedLanguages.add(candidateLanguage)

    try {
      const segments = await fetchSubtitleByLanguage(videoId, candidateLanguage)
      const subtitleText = toPlainSubtitleText(segments)

      if (subtitleText.length > 0) {
        return subtitleText
      }
    } catch {
      continue
    }
  }

  try {
    const fallbackSegments = await fetchSubtitleByLanguage(videoId)
    const fallbackText = toPlainSubtitleText(fallbackSegments)

    if (fallbackText.length > 0) {
      return fallbackText
    }
  } catch {
    throw new Error('NO_SUBTITLE')
  }

  throw new Error('NO_SUBTITLE')
}
