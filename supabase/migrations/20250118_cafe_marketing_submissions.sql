-- ============================================
-- Cafe Marketing Submissions Tables
-- 2025-01-18
-- 목적: 카페 침투 마케팅 제출 및 관리 시스템 구현
-- ============================================

-- ======================
-- 1. 카페 마케팅 제출 메인 테이블
-- ======================

CREATE TABLE IF NOT EXISTS cafe_marketing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- 기본 정보
  company_name VARCHAR(200) NOT NULL,
  place_url TEXT,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('review', 'info')),

  -- 카페 선택 정보
  region VARCHAR(100) NOT NULL, -- 지역군 (예: 강남구, 서초구 등)
  cafe_details JSONB NOT NULL, -- 카페별 발행 건수 [{"name": "카페명", "count": 10}, ...]
  total_count INTEGER NOT NULL CHECK (total_count > 0), -- 총 발행 건수 (자동 계산)

  -- 추가 정보
  has_photo BOOLEAN NOT NULL DEFAULT false, -- 사진 포함 여부 (가격 무관, 정보용)

  -- 가이드 및 추가 정보
  guideline TEXT,
  photo_urls TEXT[], -- 첨부 사진 (선택)

  -- 원고 관리
  script_status VARCHAR(20) DEFAULT 'pending' CHECK (
    script_status IN ('pending', 'writing', 'completed')
  ),
  script_url TEXT, -- Google Sheets 링크

  -- 포인트 및 상태
  total_points INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'script_writing', 'script_completed', 'in_progress', 'completed', 'cancelled')
  ),

  -- 메타데이터
  notes TEXT, -- 관리자 메모
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_client ON cafe_marketing_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_status ON cafe_marketing_submissions(status);
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_script_status ON cafe_marketing_submissions(script_status);
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_created ON cafe_marketing_submissions(created_at);

-- Updated at 트리거
CREATE OR REPLACE FUNCTION update_cafe_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cafe_marketing_updated_at
  BEFORE UPDATE ON cafe_marketing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_cafe_marketing_updated_at();

-- ======================
-- 2. 카페 마케팅 일일 기록 테이블
-- ======================

CREATE TABLE IF NOT EXISTS cafe_marketing_daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES cafe_marketing_submissions(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, record_date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cafe_daily_records_submission ON cafe_marketing_daily_records(submission_id);
CREATE INDEX IF NOT EXISTS idx_cafe_daily_records_date ON cafe_marketing_daily_records(record_date);

-- Updated at 트리거
CREATE TRIGGER trigger_cafe_daily_records_updated_at
  BEFORE UPDATE ON cafe_marketing_daily_records
  FOR EACH ROW
  EXECUTE FUNCTION update_cafe_marketing_updated_at();

-- ======================
-- 3. 결과 확인
-- ======================

SELECT '=== Cafe Marketing Tables Created ===' AS info;

SELECT
    table_name AS "테이블명",
    column_name AS "컬럼명",
    data_type AS "데이터 타입"
FROM information_schema.columns
WHERE table_name IN ('cafe_marketing_submissions', 'cafe_marketing_daily_records')
ORDER BY table_name, ordinal_position;
