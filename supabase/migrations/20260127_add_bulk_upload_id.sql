-- ============================================
-- Add bulk_upload_id for grouping bulk submissions
-- 2026-01-27
-- 목적: 대량 접수 시 같은 업로드 건들을 그룹핑
-- ============================================

-- 영수증 리뷰 테이블에 bulk_upload_id 추가
ALTER TABLE receipt_review_submissions
ADD COLUMN IF NOT EXISTS bulk_upload_id UUID DEFAULT NULL;

-- 블로그 배포 테이블에 bulk_upload_id 추가
ALTER TABLE blog_distribution_submissions
ADD COLUMN IF NOT EXISTS bulk_upload_id UUID DEFAULT NULL;

-- 플레이스 유입 테이블에 bulk_upload_id 추가
ALTER TABLE place_submissions
ADD COLUMN IF NOT EXISTS bulk_upload_id UUID DEFAULT NULL;

-- 인덱스 생성 (그룹핑 쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_receipt_bulk_upload_id
ON receipt_review_submissions(bulk_upload_id)
WHERE bulk_upload_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_bulk_upload_id
ON blog_distribution_submissions(bulk_upload_id)
WHERE bulk_upload_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_place_bulk_upload_id
ON place_submissions(bulk_upload_id)
WHERE bulk_upload_id IS NOT NULL;

-- 확인
SELECT 'bulk_upload_id columns added successfully' AS result;
