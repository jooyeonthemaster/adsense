-- 카카오맵 콘텐츠 피드백에 읽음 상태 추가
-- 대행사가 검수 시 입력한 피드백을 관리자 목록에서 알림으로 표시하기 위함

-- 1. is_read 컬럼 추가 (관리자가 읽었는지 여부)
ALTER TABLE kakaomap_content_item_feedbacks
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 2. read_at 컬럼 추가 (읽은 시간)
ALTER TABLE kakaomap_content_item_feedbacks
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 3. 미읽음 피드백 조회용 인덱스 (클라이언트가 보낸 것 중 관리자가 안 읽은 것)
CREATE INDEX IF NOT EXISTS idx_content_item_feedbacks_unread
  ON kakaomap_content_item_feedbacks(submission_id, sender_type, is_read)
  WHERE sender_type = 'client' AND is_read = FALSE;

-- 코멘트 추가
COMMENT ON COLUMN kakaomap_content_item_feedbacks.is_read IS '관리자가 읽었는지 여부';
COMMENT ON COLUMN kakaomap_content_item_feedbacks.read_at IS '관리자가 읽은 시간';
