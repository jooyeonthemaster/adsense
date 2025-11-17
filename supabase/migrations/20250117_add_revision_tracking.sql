-- 콘텐츠 수정 이력 추적
-- 생성일: 2025-01-17
-- 목적: 수정 요청 이력을 추적하여 "수정완료"와 "승인완료"를 구분

-- 1. has_been_revised 컬럼 추가
ALTER TABLE kakaomap_content_items
ADD COLUMN IF NOT EXISTS has_been_revised BOOLEAN DEFAULT false NOT NULL;

-- 2. 기존 데이터 업데이트 (피드백이 있는 approved 아이템은 수정된 것으로 간주)
UPDATE kakaomap_content_items
SET has_been_revised = true
WHERE review_status = 'approved'
AND id IN (
  SELECT DISTINCT content_item_id
  FROM kakaomap_content_item_feedbacks
  WHERE content_item_id IS NOT NULL
);

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_kakaomap_content_items_revised
ON kakaomap_content_items(review_status, has_been_revised);

COMMENT ON COLUMN kakaomap_content_items.has_been_revised IS '수정 요청 이력 여부 - true면 수정 요청을 받은 적이 있음';
