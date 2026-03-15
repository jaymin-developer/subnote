# SubNote 배포 가이드 (비개발자용)

서비스를 인터넷에 올리려면 3가지 키가 필요합니다.
아래 순서대로 따라하세요. (총 10분 소요)

---

## 1. Supabase 키 2개 가져오기

Supabase는 우리 서비스의 데이터베이스입니다.

1. https://supabase.com 접속 → GitHub으로 로그인
2. 프로젝트가 없으면 "New Project" 클릭
   - Name: `subnote`
   - Password: 아무거나 (안전한 것)
   - Region: `Northeast Asia (Tokyo)`
3. 프로젝트 대시보드에서 왼쪽 메뉴 **"SQL Editor"** 클릭
4. 아래 코드를 복사해서 붙여넣고 **Run** 클릭:

```sql
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
```

5. 왼쪽 맨 아래 **"Project Settings"** (톱니바퀴) → **"API"** 탭
6. 여기서 2개를 복사:
   - **Project URL**: `https://xxxx.supabase.co`
   - **service_role key**: `eyJhbG...` (secret이라고 적혀있는 긴 문자열)

---

## 2. Anthropic API 키 1개 가져오기

Anthropic은 AI(Claude)를 제공하는 회사입니다.

1. https://console.anthropic.com 접속 → 계정 만들기/로그인
2. 왼쪽 메뉴 **"API Keys"** 클릭
3. **"Create Key"** 클릭 → 이름: `subnote`
4. 생성된 키 복사: `sk-ant-api03-...`

⚠️ 이 키는 한 번만 보여줍니다. 반드시 복사해두세요!

---

## 정리

필요한 3개:
- `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase service_role key
- `ANTHROPIC_API_KEY` = Anthropic API key
