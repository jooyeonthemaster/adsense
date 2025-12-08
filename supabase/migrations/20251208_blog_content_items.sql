-- 블로그 배포 콘텐츠 아이템 테이블 생성
-- 네이버 리뷰(receipt_content_items)와 유사한 구조로 콘텐츠 기반 진행률 관리

CREATE TABLE IF NOT EXISTS blog_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES blog_distribution_submissions(id) ON DELETE CASCADE,
  upload_order INTEGER NOT NULL DEFAULT 1,

  -- 블로그 콘텐츠 정보
  blog_url TEXT,
  blog_title TEXT,
  keyword TEXT,
  published_date DATE,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_blog_content_items_submission_id ON blog_content_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_blog_content_items_published_date ON blog_content_items(published_date);

-- 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_blog_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_content_items_updated_at
  BEFORE UPDATE ON blog_content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_content_items_updated_at();

-- 코멘트 추가
COMMENT ON TABLE blog_content_items IS '블로그 배포 콘텐츠 아이템 - 업로드된 블로그 데이터 관리';
COMMENT ON COLUMN blog_content_items.submission_id IS '블로그 배포 접수 ID';
COMMENT ON COLUMN blog_content_items.upload_order IS '업로드 순서';
COMMENT ON COLUMN blog_content_items.blog_url IS '블로그 URL';
COMMENT ON COLUMN blog_content_items.blog_title IS '블로그 제목';
COMMENT ON COLUMN blog_content_items.keyword IS '키워드';
COMMENT ON COLUMN blog_content_items.published_date IS '발행 날짜';
COMMENT ON COLUMN blog_content_items.notes IS '메모';

-- RLS 정책 설정
ALTER TABLE blog_content_items ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 레코드 접근 가능
CREATE POLICY "Admin full access to blog_content_items" ON blog_content_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 클라이언트는 자신의 submission에 연결된 레코드만 조회 가능
CREATE POLICY "Clients can view own blog_content_items" ON blog_content_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_distribution_submissions bds
      JOIN clients c ON bds.client_id = c.id
      WHERE bds.id = blog_content_items.submission_id
      AND c.user_id = auth.uid()
    )
  );
