CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT UNIQUE NOT NULL,
  video_title TEXT,
  channel_name TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  subtitle_raw TEXT NOT NULL,
  subtitle_corrected TEXT NOT NULL,
  summary_oneline TEXT NOT NULL,
  summary_points JSONB NOT NULL DEFAULT '[]',
  summary_full TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ko',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analyses_video_id ON analyses(video_id);
