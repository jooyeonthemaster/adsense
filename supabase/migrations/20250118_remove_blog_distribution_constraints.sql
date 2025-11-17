-- 블로그 배포 테이블의 제약 조건 제거
-- 프론트엔드와 API에서 검증하므로 DB 제약 조건은 불필요

-- 기존 제약 조건 삭제
ALTER TABLE blog_distribution_submissions
  DROP CONSTRAINT IF EXISTS blog_distribution_submissions_daily_count_check;

ALTER TABLE blog_distribution_submissions
  DROP CONSTRAINT IF EXISTS blog_distribution_submissions_total_count_check;

-- 코멘트
COMMENT ON COLUMN blog_distribution_submissions.daily_count
  IS '일 접수량 (프론트엔드/API에서 최소 3건 검증)';

COMMENT ON COLUMN blog_distribution_submissions.total_count
  IS '총 접수량 (프론트엔드/API에서 최소 30건 검증)';
