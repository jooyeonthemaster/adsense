-- ============================================
-- Reward (Place Traffic) Enhancements
-- 2025-11-22
-- 목적: 리워드 기능 완전 구현을 위한 테이블 업데이트
-- ============================================

-- ======================
-- 1. place_submissions 테이블에 place_mid 컬럼 추가
-- ======================

ALTER TABLE place_submissions
ADD COLUMN IF NOT EXISTS place_mid VARCHAR(100);

-- place_mid 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_place_submissions_mid ON place_submissions(place_mid);

-- ======================
-- 2. 플레이스 유입 일별 기록 테이블 생성
-- ======================

CREATE TABLE IF NOT EXISTS place_submissions_daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES place_submissions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  actual_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_place_daily_records_submission ON place_submissions_daily_records(submission_id);
CREATE INDEX IF NOT EXISTS idx_place_daily_records_date ON place_submissions_daily_records(date);

-- ======================
-- 3. 상태 업데이트: in_progress 추가
-- ======================

-- 기존: pending, approved, completed, cancelled
-- 추가: in_progress (구동중)

COMMENT ON COLUMN place_submissions.status IS 'pending, approved, in_progress, completed, cancelled';

-- ======================
-- 4. 결과 확인
-- ======================

SELECT '=== Place Submissions Enhancements Completed ===' AS info;

SELECT
    column_name AS "컬럼명",
    data_type AS "데이터 타입",
    is_nullable AS "NULL 허용"
FROM information_schema.columns
WHERE table_name = 'place_submissions'
ORDER BY ordinal_position;

SELECT
    table_name AS "테이블명",
    column_name AS "컬럼명",
    data_type AS "데이터 타입"
FROM information_schema.columns
WHERE table_name = 'place_submissions_daily_records'
ORDER BY ordinal_position;
