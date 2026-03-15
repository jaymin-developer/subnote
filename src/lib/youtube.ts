import { type VideoInfo } from '@/types'

const SUPADATA_API_URL = 'https://api.supadata.ai/v1/youtube/transcript'
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

interface SupadataResponse {
  content: string
  lang: string
}

export const fetchSubtitle = async (videoId: string, lang?: string): Promise<string> => {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) throw new Error('SUPADATA_API_KEY_MISSING')

  const params = new URLSearchParams({
    url: `https://www.youtube.com/watch?v=${videoId}`,
    text: 'true',
  })
  if (lang) params.set('lang', lang)

  const response = await fetch(`${SUPADATA_API_URL}?${params.toString()}`, {
    headers: { 'x-api-key': apiKey },
  })

  if (!response.ok) {
    if (response.status === 404) throw new Error('NO_SUBTITLE')
    throw new Error(`SUPADATA_ERROR_${response.status}`)
  }

  const data = (await response.json()) as SupadataResponse
  if (!data.content || data.content.trim().length === 0) throw new Error('NO_SUBTITLE')

  return data.content.trim()
}
