import { type VideoInfo } from '@/types'

const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false'
const INNERTUBE_CONTEXT = {
  client: {
    clientName: 'ANDROID',
    clientVersion: '19.29.37',
    androidSdkVersion: 30,
    hl: 'ko',
    gl: 'KR',
  },
}
const ANDROID_USER_AGENT = 'com.google.android.youtube/19.29.37 (Linux; U; Android 11) gzip'

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

interface CaptionTrack {
  baseUrl: string
  languageCode: string
}

interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[]
    }
  }
}

interface TimedTextEvent {
  segs?: { utf8?: string }[]
}

interface TimedTextResponse {
  events?: TimedTextEvent[]
}

const fetchCaptionTracks = async (videoId: string): Promise<CaptionTrack[]> => {
  const response = await fetch(INNERTUBE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': ANDROID_USER_AGENT,
    },
    body: JSON.stringify({
      context: INNERTUBE_CONTEXT,
      videoId,
    }),
  })

  if (!response.ok) throw new Error('INNERTUBE_FETCH_FAILED')

  const data = (await response.json()) as PlayerResponse
  const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks

  if (!tracks || tracks.length === 0) throw new Error('NO_CAPTION_TRACKS')

  return tracks
}

const pickTrackUrl = (tracks: CaptionTrack[], lang?: string): string => {
  const priority = [lang, 'ko', 'en'].filter((l): l is string => Boolean(l))

  for (const code of priority) {
    const match = tracks.find((t) => t.languageCode === code)
    if (match) return match.baseUrl
  }

  return tracks[0].baseUrl
}

const fetchTimedText = async (trackUrl: string): Promise<string> => {
  const url = trackUrl.includes('fmt=json3') ? trackUrl : `${trackUrl}&fmt=json3`
  const response = await fetch(url, {
    headers: { 'User-Agent': ANDROID_USER_AGENT },
  })

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

export const fetchSubtitle = async (videoId: string, lang?: string): Promise<string> => {
  const tracks = await fetchCaptionTracks(videoId)
  const trackUrl = pickTrackUrl(tracks, lang)
  const text = await fetchTimedText(trackUrl)

  if (text.length === 0) throw new Error('NO_SUBTITLE')

  return text
}
