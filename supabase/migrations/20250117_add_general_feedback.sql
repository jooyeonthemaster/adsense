-- 공통 피드백 지원을 위한 마이그레이션
-- 생성일: 2025-01-17
-- 목적: content_item_id를 nullable로 만들어 전체 submission에 대한 공통 피드백 지원

-- 1. content_item_id를 nullable로 변경
ALTER TABLE kakaomap_content_item_feedbacks
ALTER COLUMN content_item_id DROP NOT NULL;

-- 2. 인덱스 추가 (submission_id만으로 조회할 수 있도록)
CREATE INDEX IF NOT EXISTS idx_kakaomap_feedbacks_submission_only
ON kakaomap_content_item_feedbacks(submission_id)
WHERE content_item_id IS NULL;

COMMENT ON COLUMN kakaomap_content_item_feedbacks.content_item_id IS '콘텐츠 아이템 ID (NULL인 경우 전체 submission에 대한 공통 피드백)';
