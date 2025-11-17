-- K맵 리뷰 기능 확장 마이그레이션
-- 생성일: 2025-01-16
-- 목적: 콘텐츠 검수, 수정 요청, 1:1 메시징 기능 지원

-- 1. 기존 kakaomap_review_submissions 테이블에 컬럼 추가
ALTER TABLE kakaomap_review_submissions
ADD COLUMN IF NOT EXISTS photo_ratio INTEGER DEFAULT 50 CHECK (photo_ratio >= 10 AND photo_ratio <= 100),
ADD COLUMN IF NOT EXISTS star_rating VARCHAR(10) DEFAULT 'mixed' CHECK (star_rating IN ('mixed', 'five', 'four')),
ADD COLUMN IF NOT EXISTS script_type VARCHAR(20) DEFAULT 'custom' CHECK (script_type IN ('custom', 'ai'));

COMMENT ON COLUMN kakaomap_review_submissions.photo_ratio IS '사진 비율 (10-100%, 10단위)';
COMMENT ON COLUMN kakaomap_review_submissions.star_rating IS '별점 옵션: mixed(혼합), five(5점만), four(4점만)';
COMMENT ON COLUMN kakaomap_review_submissions.script_type IS '스크립트 타입: custom(직접작성), ai(AI 제작)';

-- 2. K맵 콘텐츠 아이템 테이블 (관리자가 업로드한 이미지 + 스크립트)
CREATE TABLE IF NOT EXISTS kakaomap_content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES kakaomap_review_submissions(id) ON DELETE CASCADE,

  -- 콘텐츠 정보
  image_url TEXT,
  script_text TEXT,
  file_name TEXT,
  file_size INTEGER,

  -- 상태
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- 검수 정보
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES admins(id),
  review_note TEXT,

  -- 메타데이터
  upload_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kakaomap_content_submission ON kakaomap_content_items(submission_id);
CREATE INDEX idx_kakaomap_content_status ON kakaomap_content_items(status);

COMMENT ON TABLE kakaomap_content_items IS 'K맵 리뷰 콘텐츠 아이템 (관리자 업로드)';
COMMENT ON COLUMN kakaomap_content_items.submission_id IS '접수 ID';
COMMENT ON COLUMN kakaomap_content_items.image_url IS '이미지 URL (Supabase Storage)';
COMMENT ON COLUMN kakaomap_content_items.script_text IS '스크립트 텍스트';
COMMENT ON COLUMN kakaomap_content_items.status IS '상태: pending(대기), approved(승인), rejected(반려)';
COMMENT ON COLUMN kakaomap_content_items.upload_order IS '업로드 순서 (total_count 내에서)';

-- 3. K맵 수정 요청 테이블
CREATE TABLE IF NOT EXISTS kakaomap_revision_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES kakaomap_review_submissions(id) ON DELETE CASCADE,

  -- 요청 정보
  requested_by UUID NOT NULL REFERENCES clients(id),
  request_content TEXT NOT NULL,
  request_reason TEXT,

  -- 상태
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),

  -- 처리 정보
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES admins(id),
  resolution_note TEXT,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kakaomap_revision_submission ON kakaomap_revision_requests(submission_id);
CREATE INDEX idx_kakaomap_revision_status ON kakaomap_revision_requests(status);
CREATE INDEX idx_kakaomap_revision_client ON kakaomap_revision_requests(requested_by);

COMMENT ON TABLE kakaomap_revision_requests IS 'K맵 리뷰 수정 요청 내역';
COMMENT ON COLUMN kakaomap_revision_requests.request_content IS '수정 요청 내용';
COMMENT ON COLUMN kakaomap_revision_requests.status IS '상태: pending(대기), in_progress(처리중), completed(완료), rejected(거부)';

-- 4. K맵 1:1 메시징 테이블
CREATE TABLE IF NOT EXISTS kakaomap_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES kakaomap_review_submissions(id) ON DELETE CASCADE,

  -- 발신자 정보
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('admin', 'client')),
  sender_id UUID NOT NULL,
  sender_name VARCHAR(100) NOT NULL,

  -- 메시지 내용
  content TEXT NOT NULL,

  -- 첨부파일 (선택)
  attachment_url TEXT,
  attachment_name TEXT,

  -- 읽음 상태
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kakaomap_messages_submission ON kakaomap_messages(submission_id);
CREATE INDEX idx_kakaomap_messages_sender ON kakaomap_messages(sender_type, sender_id);
CREATE INDEX idx_kakaomap_messages_created ON kakaomap_messages(created_at DESC);
CREATE INDEX idx_kakaomap_messages_unread ON kakaomap_messages(is_read) WHERE is_read = false;

COMMENT ON TABLE kakaomap_messages IS 'K맵 리뷰 1:1 메시징';
COMMENT ON COLUMN kakaomap_messages.sender_type IS '발신자 타입: admin(관리자), client(클라이언트)';
COMMENT ON COLUMN kakaomap_messages.sender_id IS '발신자 ID (admins.id 또는 clients.id)';
COMMENT ON COLUMN kakaomap_messages.content IS '메시지 내용';
COMMENT ON COLUMN kakaomap_messages.is_read IS '읽음 여부';

-- 5. 자동 updated_at 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 테이블에 트리거 추가 (아직 없는 경우)
DROP TRIGGER IF EXISTS update_kakaomap_review_submissions_updated_at ON kakaomap_review_submissions;
CREATE TRIGGER update_kakaomap_review_submissions_updated_at
  BEFORE UPDATE ON kakaomap_review_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 새 테이블에 트리거 추가
CREATE TRIGGER update_kakaomap_content_items_updated_at
  BEFORE UPDATE ON kakaomap_content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kakaomap_revision_requests_updated_at
  BEFORE UPDATE ON kakaomap_revision_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kakaomap_messages_updated_at
  BEFORE UPDATE ON kakaomap_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) 정책
ALTER TABLE kakaomap_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kakaomap_revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kakaomap_messages ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "Admins can access all kakaomap content items"
  ON kakaomap_content_items FOR ALL
  USING (true);

CREATE POLICY "Admins can access all kakaomap revision requests"
  ON kakaomap_revision_requests FOR ALL
  USING (true);

CREATE POLICY "Admins can access all kakaomap messages"
  ON kakaomap_messages FOR ALL
  USING (true);

-- 클라이언트는 자신의 데이터만 접근 가능
CREATE POLICY "Clients can view their kakaomap content items"
  ON kakaomap_content_items FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM kakaomap_review_submissions WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their kakaomap revision requests"
  ON kakaomap_revision_requests FOR SELECT
  USING (requested_by = auth.uid());

CREATE POLICY "Clients can create kakaomap revision requests"
  ON kakaomap_revision_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Clients can view their kakaomap messages"
  ON kakaomap_messages FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM kakaomap_review_submissions WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can send kakaomap messages"
  ON kakaomap_messages FOR INSERT
  WITH CHECK (
    sender_type = 'client' AND
    sender_id = auth.uid() AND
    submission_id IN (
      SELECT id FROM kakaomap_review_submissions WHERE client_id = auth.uid()
    )
  );

-- 7. 샘플 데이터 (개발 환경용 - 필요시 주석 해제)
/*
INSERT INTO kakaomap_content_items (submission_id, image_url, script_text, status, upload_order) VALUES
  ('sample-uuid-1', 'https://example.com/image1.jpg', '맛있는 음식이에요!', 'pending', 1),
  ('sample-uuid-1', 'https://example.com/image2.jpg', '분위기가 좋습니다.', 'pending', 2);
*/
