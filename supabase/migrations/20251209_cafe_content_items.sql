-- 카페 침투 마케팅 콘텐츠 아이템 테이블
-- 블로그 배포와 동일한 패턴으로 콘텐츠 기반 진행률 관리

-- 1. cafe_marketing_submissions 테이블에 progress_percentage 컬럼 추가
ALTER TABLE cafe_marketing_submissions
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

COMMENT ON COLUMN cafe_marketing_submissions.progress_percentage IS '콘텐츠 기반 진행률 (0-100)';

-- 2. 콘텐츠 아이템 테이블 생성
CREATE TABLE IF NOT EXISTS cafe_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES cafe_marketing_submissions(id) ON DELETE CASCADE,
  upload_order INTEGER NOT NULL DEFAULT 1,

  -- 콘텐츠 필드 (사용자 요청 기준)
  post_title TEXT,                          -- 작성제목
  published_date DATE,                      -- 발행일
  status TEXT DEFAULT 'pending',            -- 상태: pending(대기), approved(승인됨), revision_requested(수정요청)
  post_url TEXT,                            -- 리뷰링크 (카페 글 URL)
  writer_id TEXT,                           -- 작성 아이디
  cafe_name TEXT,                           -- 카페명 (선택적으로 어느 카페에 작성했는지)
  notes TEXT,                               -- 메모

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cafe_content_items_submission_id ON cafe_content_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_cafe_content_items_published_date ON cafe_content_items(published_date);
CREATE INDEX IF NOT EXISTS idx_cafe_content_items_status ON cafe_content_items(status);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_cafe_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cafe_content_items_updated_at ON cafe_content_items;
CREATE TRIGGER trigger_update_cafe_content_items_updated_at
  BEFORE UPDATE ON cafe_content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cafe_content_items_updated_at();

-- RLS 정책 (관리자만 접근 가능)
ALTER TABLE cafe_content_items ENABLE ROW LEVEL SECURITY;

-- 관리자 정책: 모든 작업 허용
CREATE POLICY "Admin full access on cafe_content_items"
  ON cafe_content_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- 서비스 역할 정책 (API 서버용)
CREATE POLICY "Service role full access on cafe_content_items"
  ON cafe_content_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE cafe_content_items IS '카페 침투 마케팅 콘텐츠 아이템 - 발행된 카페 글 관리';
COMMENT ON COLUMN cafe_content_items.post_title IS '작성제목';
COMMENT ON COLUMN cafe_content_items.published_date IS '발행일';
COMMENT ON COLUMN cafe_content_items.status IS '상태: pending(대기), approved(승인됨), revision_requested(수정요청)';
COMMENT ON COLUMN cafe_content_items.post_url IS '리뷰링크 (카페 글 URL)';
COMMENT ON COLUMN cafe_content_items.writer_id IS '작성 아이디';
COMMENT ON COLUMN cafe_content_items.cafe_name IS '작성한 카페명';
