-- ============================================
-- Fix Non-Reward Product Prices
-- 2026-01-25
-- 목적: 리워드가 아닌 상품들의 가격을 100배로 복원
-- 원인: 20260110_change_reward_price_unit.sql이 모든 상품에 적용되어 버그 발생
-- ============================================

-- ======================
-- 1. 현재 상태 확인
-- ======================

SELECT '=== 수정 전 비-리워드 상품 가격 ===' AS info;

SELECT
  pc.slug,
  pc.name AS "상품명",
  dpp.price_per_unit AS "현재_가격"
FROM default_product_prices dpp
JOIN product_categories pc ON pc.id = dpp.category_id
WHERE pc.slug NOT IN ('twoople-reward', 'eureka-reward')
ORDER BY pc.name;

-- ======================
-- 2. 기본 가격 테이블 수정
-- ======================

-- 리워드가 아닌 상품들의 가격을 100배로 복원
UPDATE default_product_prices dpp
SET price_per_unit = price_per_unit * 100
FROM product_categories pc
WHERE pc.id = dpp.category_id
AND pc.slug NOT IN ('twoople-reward', 'eureka-reward')
AND dpp.price_per_unit > 0;

-- ======================
-- 3. 거래처별 가격 테이블 수정
-- ======================

-- 리워드가 아닌 상품들의 거래처별 가격을 100배로 복원
UPDATE client_product_prices cpp
SET price_per_unit = price_per_unit * 100
FROM product_categories pc
WHERE pc.id = cpp.category_id
AND pc.slug NOT IN ('twoople-reward', 'eureka-reward')
AND cpp.price_per_unit > 0;

-- ======================
-- 4. 수정 결과 확인
-- ======================

SELECT '=== 수정 후 비-리워드 상품 가격 ===' AS info;

SELECT
  pc.slug,
  pc.name AS "상품명",
  dpp.price_per_unit AS "복원된_가격"
FROM default_product_prices dpp
JOIN product_categories pc ON pc.id = dpp.category_id
WHERE pc.slug NOT IN ('twoople-reward', 'eureka-reward')
ORDER BY pc.name;

-- 리워드 가격은 그대로인지 확인
SELECT '=== 리워드 상품 가격 (변경 없음) ===' AS info;

SELECT
  pc.slug,
  pc.name AS "상품명",
  dpp.price_per_unit AS "가격(1타당)"
FROM default_product_prices dpp
JOIN product_categories pc ON pc.id = dpp.category_id
WHERE pc.slug IN ('twoople-reward', 'eureka-reward')
ORDER BY pc.name;

-- ======================
-- 5. 완료
-- ======================

SELECT '=== Non-Reward Prices Restored Successfully ===' AS result;
