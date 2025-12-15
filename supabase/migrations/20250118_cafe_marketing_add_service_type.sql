-- ============================================
-- Add service_type to Cafe Marketing Submissions
-- 2025-01-18
-- 목적: 카페 침투와 커뮤니티 마케팅 구분
-- ============================================

-- service_type 컬럼 추가
ALTER TABLE cafe_marketing_submissions
ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) NOT NULL DEFAULT 'cafe'
CHECK (service_type IN ('cafe', 'community'));

-- 기본값 제거 (향후 입력은 필수)
ALTER TABLE cafe_marketing_submissions
ALTER COLUMN service_type DROP DEFAULT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_service_type
ON cafe_marketing_submissions(service_type);

-- 확인
SELECT '=== Service Type Column Added ===' AS info;

SELECT
  column_name AS "컬럼명",
  data_type AS "데이터 타입",
  is_nullable AS "NULL 허용"
FROM information_schema.columns
WHERE table_name = 'cafe_marketing_submissions'
AND column_name = 'service_type';
