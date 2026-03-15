import { NextRequest, NextResponse } from 'next/server'

import { getCachedAnalysis } from '@/lib/supabase'

export const GET = async (_request: NextRequest, props: { params: Promise<{ videoId: string }> }) => {
  const { videoId } = await props.params
  const result = await getCachedAnalysis(videoId)

  if (result) {
    return NextResponse.json({
      success: true,
      data: result,
    })
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '해당 영상의 분석 결과를 찾을 수 없습니다.',
      },
    },
    { status: 404 },
  )
}
