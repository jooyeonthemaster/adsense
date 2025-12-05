-- K맵 리뷰 콘텐츠 아이템에 날짜 필드 추가
-- 방문자 리뷰와 동일하게 리뷰등록날짜, 영수증날짜 필드 추가

ALTER TABLE kakaomap_content_items
ADD COLUMN IF NOT EXISTS review_registered_date TEXT,
ADD COLUMN IF NOT EXISTS receipt_date TEXT;

COMMENT ON COLUMN kakaomap_content_items.review_registered_date IS '리뷰 등록 날짜';
COMMENT ON COLUMN kakaomap_content_items.receipt_date IS '영수증 날짜';
