import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { type AnalysisResult, type AnalysisRow } from '@/types'

let _supabase: SupabaseClient | null = null

const getSupabase = () => {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_ENV_MISSING')
  }

  _supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _supabase
}

const toAnalysisResult = (row: AnalysisRow): AnalysisResult => {
  return {
    videoInfo: {
      videoId: row.video_id,
      title: row.video_title ?? '',
      channel: row.channel_name ?? '',
      duration: row.duration ?? 0,
      thumbnail: row.thumbnail_url ?? '',
    },
    subtitleRaw: row.subtitle_raw,
    subtitleCorrected: row.subtitle_corrected,
    summary: {
      oneline: row.summary_oneline,
      points: row.summary_points,
      full: row.summary_full,
    },
    processedAt: row.updated_at || row.created_at,
    cached: true,
  }
}

const toAnalysisRow = (result: AnalysisResult): AnalysisRow => {
  const timestamp = result.processedAt

  return {
    id: crypto.randomUUID(),
    video_id: result.videoInfo.videoId,
    video_title: result.videoInfo.title,
    channel_name: result.videoInfo.channel,
    thumbnail_url: result.videoInfo.thumbnail,
    duration: result.videoInfo.duration,
    subtitle_raw: result.subtitleRaw,
    subtitle_corrected: result.subtitleCorrected,
    summary_oneline: result.summary.oneline,
    summary_points: result.summary.points,
    summary_full: result.summary.full,
    language: 'ko',
    created_at: timestamp,
    updated_at: timestamp,
  }
}

export const getCachedAnalysis = async (videoId: string): Promise<AnalysisResult | null> => {
  const { data, error } = await getSupabase()
    .from('analyses')
    .select('*')
    .eq('video_id', videoId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(error)
    return null
  }

  if (!data) {
    return null
  }

  return toAnalysisResult(data as AnalysisRow)
}

export const saveAnalysis = async (result: AnalysisResult): Promise<void> => {
  const row = toAnalysisRow(result)
  const { error } = await getSupabase()
    .from('analyses')
    .upsert(row, { onConflict: 'video_id' })

  if (!error) {
    return
  }

  console.error(error)
  throw error
}
