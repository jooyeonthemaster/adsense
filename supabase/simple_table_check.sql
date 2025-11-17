-- ============================================
-- 간단한 테이블 확인 SQL (에러 없는 버전)
-- ============================================

-- 1. 모든 테이블 목록
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. submission/experience 관련 테이블만
SELECT '=== submission/experience 관련 ===' AS info;

SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND (tablename LIKE '%submission%' OR tablename LIKE '%experience%')
ORDER BY tablename;

-- 3. product_categories 데이터
SELECT '=== product_categories ===' AS info;

SELECT id, name, slug, is_active
FROM product_categories
ORDER BY created_at;

-- 4. experience_submissions 데이터 확인
SELECT '=== experience_submissions ===' AS info;

SELECT
    id,
    client_id,
    company_name,
    experience_type,
    team_count,
    total_points,
    status,
    created_at
FROM experience_submissions
ORDER BY created_at DESC
LIMIT 10;

-- 5. 각 테이블 레코드 수 (수동 카운트)
SELECT '=== 테이블별 레코드 수 ===' AS info;

SELECT 'clients' AS table_name, COUNT(*) AS count FROM clients
UNION ALL
SELECT 'product_categories', COUNT(*) FROM product_categories
UNION ALL
SELECT 'client_product_prices', COUNT(*) FROM client_product_prices
UNION ALL
SELECT 'place_submissions', COUNT(*) FROM place_submissions
UNION ALL
SELECT 'receipt_review_submissions', COUNT(*) FROM receipt_review_submissions
UNION ALL
SELECT 'kakaomap_review_submissions', COUNT(*) FROM kakaomap_review_submissions
UNION ALL
SELECT 'blog_distribution_submissions', COUNT(*) FROM blog_distribution_submissions
UNION ALL
SELECT 'experience_submissions', COUNT(*) FROM experience_submissions
UNION ALL
SELECT 'experience_bloggers', COUNT(*) FROM experience_bloggers
ORDER BY count DESC;
