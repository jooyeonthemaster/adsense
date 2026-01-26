-- ============================================
-- Rename Video Distribution to 247 Distribution
-- 2026-01-25
-- 목적: 영상배포 -> 247 배포로 상품명 변경
-- ============================================

-- product_categories 테이블 업데이트
UPDATE product_categories
SET
  name = '247 배포',
  description = '247 블로그 배포 서비스'
WHERE slug = 'video-distribution';

-- 변경 확인
SELECT
  id,
  name,
  slug,
  description
FROM product_categories
WHERE slug = 'video-distribution';
