-- 블로그 배포 콘텐츠에 상태 및 블로그 ID 컬럼 추가
-- 네이버 리뷰 형식과 동일하게 맞춤

-- ============================================
-- blog_content_items 테이블 컬럼 추가
-- ============================================

-- 상태 컬럼 추가 (대기, 승인됨, 수정요청)
ALTER TABLE blog_content_items
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 블로그 아이디 컬럼 추가
ALTER TABLE blog_content_items
ADD COLUMN IF NOT EXISTS blog_id TEXT;

-- 배포 타입 컬럼 추가 (영상, 자동화, 리뷰어 구분용)
ALTER TABLE blog_content_items
ADD COLUMN IF NOT EXISTS distribution_type TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_blog_content_items_status ON blog_content_items(status);
CREATE INDEX IF NOT EXISTS idx_blog_content_items_distribution_type ON blog_content_items(distribution_type);

-- 코멘트 추가
COMMENT ON COLUMN blog_content_items.status IS '콘텐츠 상태: pending(대기), approved(승인됨), revision_requested(수정요청)';
COMMENT ON COLUMN blog_content_items.blog_id IS '블로그 포스트 고유 ID';
COMMENT ON COLUMN blog_content_items.distribution_type IS '배포 타입: reviewer(리뷰어), video(영상), automation(자동화)';

-- ============================================
-- blog_distribution_submissions 테이블 컬럼 추가
-- ============================================

-- 진행률 컬럼 추가
ALTER TABLE blog_distribution_submissions
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- 코멘트 추가
COMMENT ON COLUMN blog_distribution_submissions.progress_percentage IS '콘텐츠 아이템 기반 진행률 (0-100%)';
