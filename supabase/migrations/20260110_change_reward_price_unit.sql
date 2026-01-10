-- ============================================
-- Change Reward Price Unit: 100타당 → 1타당
-- 2026-01-10
-- 목적: 리워드 단가 설정을 100타당 가격에서 1타당 가격으로 변경
-- ============================================

-- ======================
-- 1. 기본 가격 테이블 변경
-- ======================

-- 기존 가격을 100으로 나누기 (0이 아닌 경우만)
UPDATE default_product_prices
SET price_per_unit = ROUND(price_per_unit / 100.0)
WHERE price_per_unit > 0;

-- 주석 업데이트
COMMENT ON COLUMN default_product_prices.price_per_unit IS '기본 단가 (1타당 포인트)';

-- ======================
-- 2. 거래처별 가격 테이블 변경
-- ======================

-- 기존 가격을 100으로 나누기 (0이 아닌 경우만)
UPDATE client_product_prices
SET price_per_unit = ROUND(price_per_unit / 100.0)
WHERE price_per_unit > 0;

-- 주석 업데이트
COMMENT ON COLUMN client_product_prices.price_per_unit IS '거래처별 단가 (1타당 포인트)';

-- ======================
-- 3. 변경 결과 확인
-- ======================

SELECT '=== Price Unit Changed: 100타당 → 1타당 ===' AS info;

-- 기본 가격 확인
SELECT
  pc.name AS "상품명",
  dpp.price_per_unit AS "변경후_가격(1타당)"
FROM default_product_prices dpp
JOIN product_categories pc ON pc.id = dpp.category_id
WHERE pc.slug IN ('twoople-reward', 'eureka-reward')
ORDER BY pc.name;

-- 거래처별 가격 확인 (리워드만)
SELECT
  c.username AS "거래처",
  pc.name AS "상품명",
  cpp.price_per_unit AS "변경후_가격(1타당)"
FROM client_product_prices cpp
JOIN clients c ON c.id = cpp.client_id
JOIN product_categories pc ON pc.id = cpp.category_id
WHERE pc.slug IN ('twoople-reward', 'eureka-reward')
ORDER BY c.username, pc.name;

-- ======================
-- 4. 완료
-- ======================

SELECT '=== Migration Completed Successfully ===' AS result;
