-- 총 작업일 컬럼 추가
-- 생성일: 2025-01-17
-- 목적: 카카오맵 리뷰 접수 시 총 작업일 저장 및 마감일 계산 지원

-- 1. total_days 컬럼 추가
ALTER TABLE kakaomap_review_submissions
ADD COLUMN IF NOT EXISTS total_days INTEGER;

-- 2. 기존 데이터 업데이트 (dailyCount 기반 예상 작업일수 계산)
UPDATE kakaomap_review_submissions
SET total_days = CEIL(total_count::DECIMAL / daily_count::DECIMAL)::INTEGER
WHERE total_days IS NULL AND daily_count > 0;

-- 3. NOT NULL 제약 조건 추가
ALTER TABLE kakaomap_review_submissions
ALTER COLUMN total_days SET NOT NULL;

-- 4. DEFAULT 값 설정 (1일 이상)
ALTER TABLE kakaomap_review_submissions
ALTER COLUMN total_days SET DEFAULT 1;

COMMENT ON COLUMN kakaomap_review_submissions.total_days IS '총 작업일수 - 접수일로부터 마감일까지의 일수';
