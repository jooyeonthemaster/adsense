-- K맵 리뷰 콘텐츠 아이템에 리뷰 링크와 리뷰 아이디 필드 추가
-- review_link: 카카오맵 리뷰 URL
-- review_id: 카카오맵 리뷰 고유 ID

ALTER TABLE kakaomap_content_items
ADD COLUMN IF NOT EXISTS review_link TEXT,
ADD COLUMN IF NOT EXISTS review_id TEXT;

COMMENT ON COLUMN kakaomap_content_items.review_link IS '카카오맵 리뷰 URL';
COMMENT ON COLUMN kakaomap_content_items.review_id IS '카카오맵 리뷰 고유 ID';
