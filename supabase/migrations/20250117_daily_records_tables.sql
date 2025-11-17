-- ============================================
-- Daily Records Tables for Review Marketing
-- 2025-01-17
-- 목적: 관리자가 일별 실제 유입 건수를 기록하는 테이블
-- ============================================

-- ======================
-- 1. 방문자 리뷰 일별 기록 테이블
-- ======================

CREATE TABLE IF NOT EXISTS receipt_review_daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES receipt_review_submissions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  actual_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_receipt_daily_records_submission ON receipt_review_daily_records(submission_id);
CREATE INDEX IF NOT EXISTS idx_receipt_daily_records_date ON receipt_review_daily_records(date);

-- ======================
-- 2. K맵 리뷰 일별 기록 테이블
-- ======================

CREATE TABLE IF NOT EXISTS kakaomap_review_daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES kakaomap_review_submissions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  actual_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_kakaomap_daily_records_submission ON kakaomap_review_daily_records(submission_id);
CREATE INDEX IF NOT EXISTS idx_kakaomap_daily_records_date ON kakaomap_review_daily_records(date);

-- ======================
-- 3. 결과 확인
-- ======================

SELECT '=== Daily Records Tables Created ===' AS info;

SELECT
    table_name AS "테이블명",
    column_name AS "컬럼명",
    data_type AS "데이터 타입"
FROM information_schema.columns
WHERE table_name IN ('receipt_review_daily_records', 'kakaomap_review_daily_records')
ORDER BY table_name, ordinal_position;
