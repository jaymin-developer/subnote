export type SummaryType = 'oneline' | 'points' | 'full'

export type AnalyzeMode = 'subtitle' | 'whisper' | 'auto'

export interface VideoInfo {
  videoId: string
  title: string
  channel: string
  duration: number
  thumbnail: string
}

export interface AnalysisResult {
  videoInfo: VideoInfo
  subtitleRaw: string
  subtitleCorrected: string
  summary: {
    oneline: string
    points: string[]
    full: string
  }
  processedAt: string
  cached: boolean
}

export interface AnalyzeRequest {
  url: string
  options?: {
    mode?: AnalyzeMode
    summaryType?: SummaryType
  }
}

export interface AnalyzeResponse {
  success: true
  data: AnalysisResult
}

export interface AnalyzeErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export type SSEStepType = 'info' | 'subtitle' | 'correct' | 'summary' | 'complete' | 'error'

export interface SSEProgressEvent {
  step: Exclude<SSEStepType, 'complete' | 'error'>
  message: string
  data?: Partial<AnalysisResult>
}

export interface SSECompleteEvent {
  step: 'complete'
  data: AnalysisResult
}

export interface SSEErrorEvent {
  step: 'error'
  message: string
  code?: string
}

export type SSEEvent = SSEProgressEvent | SSECompleteEvent | SSEErrorEvent

export interface AnalysisRow {
  id: string
  video_id: string
  video_title: string | null
  channel_name: string | null
  thumbnail_url: string | null
  duration: number | null
  subtitle_raw: string
  subtitle_corrected: string
  summary_oneline: string
  summary_points: string[]
  summary_full: string
  language: string
  created_at: string
  updated_at: string
}
