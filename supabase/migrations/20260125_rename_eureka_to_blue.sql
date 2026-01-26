-- ============================================
-- Rename Eureka to Blue
-- 2026-01-25
-- 목적: 리워드 매체명 유레카 -> 블루로 변경
-- ============================================

-- product_categories 테이블 업데이트
UPDATE product_categories
SET
  name = '블루',
  description = '블루 기반의 네이버 플레이스 조회수 증대 서비스'
WHERE slug = 'eureka-reward';

-- place_submissions 테이블 media_type 컬럼 주석 업데이트
COMMENT ON COLUMN place_submissions.media_type IS 'twoople: 투플, eureka: 블루';

-- 변경 확인
SELECT
  id,
  name,
  slug,
  description
FROM product_categories
WHERE slug = 'eureka-reward';
