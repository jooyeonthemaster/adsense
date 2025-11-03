-- ============================================
-- 포인트 관련 컬럼을 INTEGER에서 BIGINT로 변경
-- 이유: INTEGER 최대값(2,147,483,647) 초과 시 오버플로우 방지
-- 실행일: 2025-11-03
-- ============================================

-- 1. clients 테이블 - points 컬럼
ALTER TABLE clients
ALTER COLUMN points TYPE BIGINT;

-- 2. point_transactions 테이블 - amount, balance_after 컬럼
ALTER TABLE point_transactions
ALTER COLUMN amount TYPE BIGINT;

ALTER TABLE point_transactions
ALTER COLUMN balance_after TYPE BIGINT;

-- 3. client_product_prices 테이블 - price_per_unit 컬럼
ALTER TABLE client_product_prices
ALTER COLUMN price_per_unit TYPE BIGINT;

-- 4. place_submissions 테이블 - total_points 컬럼
ALTER TABLE place_submissions
ALTER COLUMN total_points TYPE BIGINT;

-- 5. receipt_review_submissions 테이블 - total_points 컬럼
ALTER TABLE receipt_review_submissions
ALTER COLUMN total_points TYPE BIGINT;

-- 6. kakaomap_review_submissions 테이블 - total_points 컬럼
ALTER TABLE kakaomap_review_submissions
ALTER COLUMN total_points TYPE BIGINT;

-- 7. blog_distribution_submissions 테이블 - total_points 컬럼
ALTER TABLE blog_distribution_submissions
ALTER COLUMN total_points TYPE BIGINT;

-- 8. custom_product_submissions 테이블 - total_points 컬럼 (비활성화되었지만 테이블은 존재)
ALTER TABLE custom_product_submissions
ALTER COLUMN total_points TYPE BIGINT;

-- 9. dynamic_submissions 테이블 - total_points 컬럼 (비활성화되었지만 테이블은 존재)
ALTER TABLE dynamic_submissions
ALTER COLUMN total_points TYPE BIGINT;

-- 마이그레이션 완료
-- BIGINT 범위: -9,223,372,036,854,775,808 ~ 9,223,372,036,854,775,807 (약 922경)
