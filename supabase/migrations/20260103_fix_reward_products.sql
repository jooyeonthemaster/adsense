-- ============================================
-- 리워드 상품 카테고리 정리
-- 2026-01-03
-- 목적: 투플/유레카 리워드 상품명 정리
-- ============================================

-- ======================
-- 1. 기존 place-traffic을 twoople-reward로 변경
-- ======================

-- 기존 place-traffic의 slug와 이름 업데이트
UPDATE product_categories
SET
    slug = 'twoople-reward',
    name = '투플',
    description = '투플 기반의 네이버 플레이스 조회수 증대 서비스'
WHERE slug = 'place-traffic';

-- ======================
-- 2. eureka-reward 이름 간소화
-- ======================

UPDATE product_categories
SET
    name = '유레카',
    description = '유레카 기반의 네이버 플레이스 조회수 증대 서비스'
WHERE slug = 'eureka-reward';

-- ======================
-- 3. 결과 확인
-- ======================

SELECT '=== 리워드 상품 정리 완료 ===' AS info;

SELECT
    id,
    name AS "상품명",
    slug AS "슬러그",
    description AS "설명",
    is_active AS "활성화"
FROM product_categories
WHERE slug IN ('twoople-reward', 'eureka-reward')
ORDER BY slug;
