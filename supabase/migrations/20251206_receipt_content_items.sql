-- 방문자 리뷰 콘텐츠 아이템 테이블 생성
-- K맵 리뷰(kakaomap_content_items)와 동일한 구조

CREATE TABLE IF NOT EXISTS receipt_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES receipt_review_submissions(id) ON DELETE CASCADE,
  upload_order INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  script_text TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'revision_requested')),
  has_been_revised BOOLEAN DEFAULT FALSE,
  review_registered_date DATE,
  receipt_date DATE,
  review_link TEXT,
  review_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_receipt_content_items_submission_id ON receipt_content_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_receipt_content_items_review_status ON receipt_content_items(review_status);

-- 코멘트 추가
COMMENT ON TABLE receipt_content_items IS '방문자(네이버) 리뷰 콘텐츠 아이템';
COMMENT ON COLUMN receipt_content_items.submission_id IS '방문자 리뷰 접수 ID';
COMMENT ON COLUMN receipt_content_items.upload_order IS '업로드 순서';
COMMENT ON COLUMN receipt_content_items.image_url IS '이미지 URL';
COMMENT ON COLUMN receipt_content_items.script_text IS '리뷰 원고 텍스트';
COMMENT ON COLUMN receipt_content_items.review_status IS '리뷰 상태 (pending, approved, revision_requested)';
COMMENT ON COLUMN receipt_content_items.has_been_revised IS '수정 여부';
COMMENT ON COLUMN receipt_content_items.review_registered_date IS '네이버에 리뷰가 실제 등록된 날짜';
COMMENT ON COLUMN receipt_content_items.receipt_date IS '영수증에 표시된 방문 날짜';
COMMENT ON COLUMN receipt_content_items.review_link IS '네이버 리뷰 URL';
COMMENT ON COLUMN receipt_content_items.review_id IS '네이버 리뷰 고유 ID';

-- RLS 정책 설정
ALTER TABLE receipt_content_items ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 레코드 접근 가능
CREATE POLICY "Admin full access to receipt_content_items" ON receipt_content_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 클라이언트는 자신의 submission에 연결된 레코드만 조회 가능
CREATE POLICY "Clients can view own receipt_content_items" ON receipt_content_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM receipt_review_submissions rrs
      JOIN clients c ON rrs.client_id = c.id
      WHERE rrs.id = receipt_content_items.submission_id
      AND c.user_id = auth.uid()
    )
  );
