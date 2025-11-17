-- ============================================
-- Product Categories 업데이트
-- 2025-01-17
-- 목적: 실제 프론트 노출 상품에 맞게 카테고리 정비
-- ============================================

-- ======================
-- 1. 기존 상품명 업데이트
-- ======================

-- 플레이스 유입 → 리워드 접수
UPDATE product_categories
SET
    name = '리워드 접수',
    description = '네이버 플레이스 유입(리워드) 접수 서비스'
WHERE slug = 'place-traffic';

-- 영수증 리뷰 → 방문자 리뷰
UPDATE product_categories
SET
    name = '방문자 리뷰',
    description = '방문자 리뷰 작성 서비스'
WHERE slug = 'receipt-review';

-- 카카오맵 리뷰 → K맵 리뷰
UPDATE product_categories
SET
    name = 'K맵 리뷰',
    description = '카카오맵 리뷰 작성 서비스'
WHERE slug = 'kakaomap-review';

-- ======================
-- 2. 체험단 마케팅 상품 추가
-- ======================

INSERT INTO product_categories (name, slug, description, is_active) VALUES
  ('블로그', 'blog-experience', '블로그 체험단 마케팅 서비스', true),
  ('샤오홍슈', 'xiaohongshu', '샤오홍슈 체험단 마케팅 서비스', true),
  ('실계정 기자단', 'journalist', '실계정 기자단 마케팅 서비스', true),
  ('블로그 인플루언서', 'influencer', '블로그 인플루언서 마케팅 서비스', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ======================
-- 3. 블로그 배포 상품 추가
-- ======================

INSERT INTO product_categories (name, slug, description, is_active) VALUES
  ('영상배포', 'video-distribution', '영상 배포 서비스', true),
  ('자동화 배포', 'auto-distribution', '자동화 배포 서비스', true),
  ('리뷰어 배포', 'reviewer-distribution', '리뷰어 배포 서비스', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ======================
-- 4. 카페 침투 마케팅 추가
-- ======================

INSERT INTO product_categories (name, slug, description, is_active) VALUES
  ('카페 침투 마케팅', 'cafe-marketing', '카페 침투 마케팅 서비스', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ======================
-- 5. 결과 확인
-- ======================

SELECT
    '=== 업데이트 완료 ===' AS info;

SELECT
    id,
    name AS "상품명",
    slug AS "슬러그",
    is_active AS "활성화",
    created_at AS "생성일"
FROM product_categories
ORDER BY created_at;

-- ======================
-- 6. 총 개수 확인
-- ======================

SELECT
    COUNT(*) AS "총 상품 개수"
FROM product_categories
WHERE is_active = true;
