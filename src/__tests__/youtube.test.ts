import { describe, expect, it } from 'vitest'

import { extractVideoId } from '@/lib/youtube'

describe('extractVideoId', () => {
  it('youtube.com/watch?v= 형식에서 videoId를 추출한다', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('youtu.be/ 단축 URL에서 videoId를 추출한다', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('youtube.com/shorts/ 형식에서 videoId를 추출한다', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('m.youtube.com 모바일 URL에서 videoId를 추출한다', () => {
    expect(extractVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('쿼리 파라미터가 추가된 URL에서도 videoId를 추출한다', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120')).toBe('dQw4w9WgXcQ')
  })

  it('유효하지 않은 URL에 대해 null을 반환한다', () => {
    expect(extractVideoId('https://www.google.com')).toBeNull()
    expect(extractVideoId('not-a-url')).toBeNull()
    expect(extractVideoId('')).toBeNull()
  })

  it('v 파라미터가 없는 youtube.com URL에 대해 null을 반환한다', () => {
    expect(extractVideoId('https://www.youtube.com/watch')).toBeNull()
  })
})
