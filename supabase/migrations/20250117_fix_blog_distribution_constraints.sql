-- 블로그 배포 테이블의 잘못된 제약 조건 수정
-- daily_count와 total_count를 최대값이 아닌 최소값으로 변경

-- 기존 제약 조건 삭제
ALTER TABLE blog_distribution_submissions
  DROP CONSTRAINT IF EXISTS blog_distribution_submissions_daily_count_check;

ALTER TABLE blog_distribution_submissions
  DROP CONSTRAINT IF EXISTS blog_distribution_submissions_total_count_check;

-- 올바른 제약 조건 추가 (최소값으로)
ALTER TABLE blog_distribution_submissions
  ADD CONSTRAINT blog_distribution_submissions_daily_count_check
  CHECK (daily_count >= 3);

ALTER TABLE blog_distribution_submissions
  ADD CONSTRAINT blog_distribution_submissions_total_count_check
  CHECK (total_count >= 30);

-- 코멘트
COMMENT ON CONSTRAINT blog_distribution_submissions_daily_count_check
  ON blog_distribution_submissions
  IS '일 접수량은 최소 3건 이상';

COMMENT ON CONSTRAINT blog_distribution_submissions_total_count_check
  ON blog_distribution_submissions
  IS '총 접수량은 최소 30건 이상 (최소 10일 × 3건)';
