-- 블로그 배포 일일 진행 기록 테이블
CREATE TABLE IF NOT EXISTS blog_distribution_daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES blog_distribution_submissions(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, record_date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_blog_daily_records_submission_id
  ON blog_distribution_daily_records(submission_id);

CREATE INDEX IF NOT EXISTS idx_blog_daily_records_date
  ON blog_distribution_daily_records(record_date);

-- 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_blog_daily_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_daily_records_updated_at
  BEFORE UPDATE ON blog_distribution_daily_records
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_daily_records_updated_at();

-- 코멘트
COMMENT ON TABLE blog_distribution_daily_records IS '블로그 배포 일일 진행 기록';
COMMENT ON COLUMN blog_distribution_daily_records.submission_id IS '제출 ID (FK)';
COMMENT ON COLUMN blog_distribution_daily_records.record_date IS '기록 날짜';
COMMENT ON COLUMN blog_distribution_daily_records.completed_count IS '당일 완료 건수';
COMMENT ON COLUMN blog_distribution_daily_records.notes IS '메모';
