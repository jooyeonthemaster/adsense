-- ============================================
-- Cafe Marketing Structure Migration
-- 2025-01-18
-- 목적: cafe_list + publish_count → cafe_details + total_count
-- ============================================

-- ======================
-- 1. 기존 데이터 백업 (안전을 위해)
-- ======================

-- 기존 데이터가 있다면 임시 테이블에 백업
CREATE TEMP TABLE cafe_marketing_backup AS
SELECT * FROM cafe_marketing_submissions;

-- ======================
-- 2. cafe_marketing_submissions 테이블 구조 변경
-- ======================

-- cafe_list 컬럼 삭제 (존재하면)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cafe_marketing_submissions'
        AND column_name = 'cafe_list'
    ) THEN
        ALTER TABLE cafe_marketing_submissions DROP COLUMN cafe_list;
    END IF;
END $$;

-- publish_count 컬럼 삭제 (존재하면)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cafe_marketing_submissions'
        AND column_name = 'publish_count'
    ) THEN
        ALTER TABLE cafe_marketing_submissions DROP COLUMN publish_count;
    END IF;
END $$;

-- cafe_details 컬럼 추가 (존재하지 않으면)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cafe_marketing_submissions'
        AND column_name = 'cafe_details'
    ) THEN
        ALTER TABLE cafe_marketing_submissions
        ADD COLUMN cafe_details JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- total_count 컬럼 추가 (존재하지 않으면)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cafe_marketing_submissions'
        AND column_name = 'total_count'
    ) THEN
        ALTER TABLE cafe_marketing_submissions
        ADD COLUMN total_count INTEGER NOT NULL DEFAULT 1 CHECK (total_count > 0);
    END IF;
END $$;

-- has_photo 컬럼이 이미 있으면 NOT NULL DEFAULT false로 변경
DO $$
BEGIN
    ALTER TABLE cafe_marketing_submissions
    ALTER COLUMN has_photo SET NOT NULL,
    ALTER COLUMN has_photo SET DEFAULT false;
END $$;

-- ======================
-- 3. 인덱스 확인 및 추가
-- ======================

-- 기존 인덱스들이 없으면 생성
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_client ON cafe_marketing_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_status ON cafe_marketing_submissions(status);
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_script_status ON cafe_marketing_submissions(script_status);
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_created ON cafe_marketing_submissions(created_at);

-- ======================
-- 4. daily_records 테이블 확인
-- ======================

-- cafe_marketing_daily_records 테이블 생성 (존재하지 않으면)
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

-- Updated at 트리거 함수 생성 (존재하지 않으면)
CREATE OR REPLACE FUNCTION update_cafe_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (존재하지 않으면)
DROP TRIGGER IF EXISTS trigger_cafe_marketing_updated_at ON cafe_marketing_submissions;
CREATE TRIGGER trigger_cafe_marketing_updated_at
  BEFORE UPDATE ON cafe_marketing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_cafe_marketing_updated_at();

DROP TRIGGER IF EXISTS trigger_cafe_daily_records_updated_at ON cafe_marketing_daily_records;
CREATE TRIGGER trigger_cafe_daily_records_updated_at
  BEFORE UPDATE ON cafe_marketing_daily_records
  FOR EACH ROW
  EXECUTE FUNCTION update_cafe_marketing_updated_at();

-- ======================
-- 5. 결과 확인
-- ======================

SELECT '=== Cafe Marketing Migration Completed ===' AS info;

SELECT
    column_name AS "컬럼명",
    data_type AS "데이터 타입",
    is_nullable AS "NULL 허용"
FROM information_schema.columns
WHERE table_name = 'cafe_marketing_submissions'
ORDER BY ordinal_position;
