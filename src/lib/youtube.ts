import { Innertube } from 'youtubei.js'
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

interface TimedTextEvent {
  segs?: { utf8?: string }[]
}

interface TimedTextResponse {
  events?: TimedTextEvent[]
}

const pickCaptionTrackUrl = (
  tracks: { language_code: string; base_url: string }[],
  lang?: string,
): string | null => {
  const priority = [lang, 'ko', 'en'].filter((l): l is string => Boolean(l))

  for (const code of priority) {
    const match = tracks.find((t) => t.language_code === code)
    if (match) return match.base_url
  }

  return tracks[0]?.base_url ?? null
}

const fetchSubtitleViaInnerTube = async (videoId: string, lang?: string): Promise<string> => {
  const innertube = await Innertube.create({ generate_session_locally: true })
  const info = await innertube.getInfo(videoId)

  const rawTracks = info.captions?.caption_tracks
  if (!rawTracks || rawTracks.length === 0) throw new Error('NO_CAPTION_TRACKS')

  const tracks = rawTracks
    .filter((t): t is typeof t & { base_url: string } => typeof t.base_url === 'string')
    .map((t) => ({ language_code: t.language_code, base_url: t.base_url }))

  if (tracks.length === 0) throw new Error('NO_CAPTION_TRACKS')

  const trackUrl = pickCaptionTrackUrl(tracks, lang)
  if (!trackUrl) throw new Error('NO_CAPTION_TRACKS')

  const url = trackUrl.includes('fmt=json3') ? trackUrl : `${trackUrl}&fmt=json3`
  const response = await fetch(url)
  if (!response.ok) throw new Error('TIMEDTEXT_FETCH_FAILED')

  const data = (await response.json()) as TimedTextResponse
  if (!data.events) throw new Error('NO_EVENTS')

  return data.events
    .flatMap((event) => event.segs ?? [])
    .map((seg) => seg.utf8?.trim() ?? '')
    .filter((text) => text.length > 0 && text !== '\n')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const fetchSubtitleViaLegacy = async (videoId: string, lang?: string): Promise<string> => {
  const languagePriority = [lang, 'ko', 'en'].filter((item): item is string => Boolean(item))
  const attemptedLanguages = new Set<string>()

  for (const candidateLanguage of languagePriority) {
    if (attemptedLanguages.has(candidateLanguage)) continue
    attemptedLanguages.add(candidateLanguage)

    try {
      const segments = await fetchSubtitleByLanguage(videoId, candidateLanguage)
      const subtitleText = toPlainSubtitleText(segments)
      if (subtitleText.length > 0) return subtitleText
    } catch {
      continue
    }
  }

  const fallbackSegments = await fetchSubtitleByLanguage(videoId)
  const fallbackText = toPlainSubtitleText(fallbackSegments)
  if (fallbackText.length > 0) return fallbackText

  throw new Error('NO_SUBTITLE')
}

export const fetchSubtitle = async (videoId: string, lang?: string): Promise<string> => {
  try {
    const result = await fetchSubtitleViaInnerTube(videoId)
    if (result.length > 0) return result
  } catch {
    /* fallback to legacy */
  }

  try {
    return await fetchSubtitleViaLegacy(videoId, lang)
  } catch {
    throw new Error('NO_SUBTITLE')
  }
}
