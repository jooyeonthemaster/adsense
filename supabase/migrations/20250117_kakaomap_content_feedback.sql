-- 카카오맵 콘텐츠 아이템 검수 및 피드백 기능 추가

-- 1. kakaomap_content_items 테이블에 review_status 컬럼 추가
ALTER TABLE kakaomap_content_items
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending'
  CHECK (review_status IN ('pending', 'approved', 'revision_requested'));

-- 2. 개별 콘텐츠 아이템 피드백 테이블 생성
CREATE TABLE IF NOT EXISTS kakaomap_content_item_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES kakaomap_content_items(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES kakaomap_review_submissions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'client')),
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_item_feedbacks_content_item
  ON kakaomap_content_item_feedbacks(content_item_id);

CREATE INDEX IF NOT EXISTS idx_content_item_feedbacks_submission
  ON kakaomap_content_item_feedbacks(submission_id);

CREATE INDEX IF NOT EXISTS idx_content_items_review_status
  ON kakaomap_content_items(review_status);

-- RLS 정책 설정
ALTER TABLE kakaomap_content_item_feedbacks ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin can manage all feedbacks"
  ON kakaomap_content_item_feedbacks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Clients can view and create feedbacks for their own submissions
CREATE POLICY "Clients can view their own submission feedbacks"
  ON kakaomap_content_item_feedbacks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kakaomap_review_submissions
      WHERE kakaomap_review_submissions.id = kakaomap_content_item_feedbacks.submission_id
      AND kakaomap_review_submissions.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create feedbacks for their own submissions"
  ON kakaomap_content_item_feedbacks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kakaomap_review_submissions
      WHERE kakaomap_review_submissions.id = kakaomap_content_item_feedbacks.submission_id
      AND kakaomap_review_submissions.client_id = auth.uid()
    )
    AND sender_type = 'client'
    AND sender_id = auth.uid()
  );

-- 코멘트 추가
COMMENT ON TABLE kakaomap_content_item_feedbacks IS '카카오맵 콘텐츠 아이템 개별 피드백 (관리자 ↔ 클라이언트 메시지 히스토리)';
COMMENT ON COLUMN kakaomap_content_items.review_status IS '검수 상태: pending(검수 대기), approved(승인됨), revision_requested(수정 요청됨)';
