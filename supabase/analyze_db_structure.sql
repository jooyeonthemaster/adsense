-- ============================================
-- 슈퍼베이스 전체 데이터베이스 구조 분석 SQL
-- 실행: Supabase Dashboard → SQL Editor에 복사 후 실행
-- ============================================

-- ======================
-- 1. 모든 테이블 목록 조회
-- ======================
SELECT
    '=== 전체 테이블 목록 ===' AS section;

SELECT
    schemaname AS schema_name,
    tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ======================
-- 2. 각 테이블의 레코드 수
-- ======================
SELECT
    '' AS blank_line,
    '=== 테이블별 데이터 개수 ===' AS section;

SELECT
    'clients' AS table_name,
    COUNT(*) AS record_count
FROM clients
UNION ALL
SELECT 'admins', COUNT(*) FROM admins
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
SELECT 'experience_blogger_submissions', COUNT(*) FROM experience_blogger_submissions
UNION ALL
SELECT 'kakaomap_content_items', COUNT(*) FROM kakaomap_content_items
UNION ALL
SELECT 'kakaomap_revision_requests', COUNT(*) FROM kakaomap_revision_requests
UNION ALL
SELECT 'kakaomap_messages', COUNT(*) FROM kakaomap_messages
ORDER BY record_count DESC;

-- ======================
-- 3. product_categories 실제 데이터
-- ======================
SELECT
    '' AS blank_line,
    '=== product_categories 전체 데이터 ===' AS section;

SELECT
    id,
    name,
    slug,
    description,
    is_active,
    created_at
FROM product_categories
ORDER BY created_at;

-- ======================
-- 4. 체험단 관련 테이블 구조 확인
-- ======================
SELECT
    '' AS blank_line,
    '=== experience_blogger_submissions 테이블 구조 ===' AS section;

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'experience_blogger_submissions'
ORDER BY ordinal_position;

-- ======================
-- 5. 체험단 접수 내역 샘플 데이터 (최근 5건)
-- ======================
SELECT
    '' AS blank_line,
    '=== 체험단 접수 내역 샘플 (최근 5건) ===' AS section;

SELECT
    id,
    client_id,
    business_name,
    service_type,
    total_points,
    status,
    created_at
FROM experience_blogger_submissions
ORDER BY created_at DESC
LIMIT 5;

-- ======================
-- 6. 모든 submissions 테이블의 컬럼 구조
-- ======================
SELECT
    '' AS blank_line,
    '=== 모든 submissions 테이블 컬럼 비교 ===' AS section;

SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name LIKE '%submission%'
ORDER BY table_name, ordinal_position;

-- ======================
-- 7. 외래키 관계 확인
-- ======================
SELECT
    '' AS blank_line,
    '=== 외래키 관계 ===' AS section;

SELECT
    tc.table_name AS from_table,
    kcu.column_name AS from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (tc.table_name LIKE '%submission%' OR tc.table_name = 'client_product_prices')
ORDER BY tc.table_name, tc.constraint_name;

-- ======================
-- 8. client_product_prices 데이터 확인
-- ======================
SELECT
    '' AS blank_line,
    '=== client_product_prices 전체 데이터 ===' AS section;

SELECT
    cpp.id,
    c.company_name AS client_name,
    pc.name AS product_name,
    pc.slug AS product_slug,
    cpp.price_per_unit,
    cpp.is_visible,
    cpp.created_at
FROM client_product_prices cpp
LEFT JOIN clients c ON cpp.client_id = c.id
LEFT JOIN product_categories pc ON cpp.category_id = pc.id
ORDER BY c.company_name, pc.name;

-- ======================
-- 9. 서비스 타입별 접수 현황
-- ======================
SELECT
    '' AS blank_line,
    '=== 서비스 타입별 접수 현황 ===' AS section;

SELECT
    service_type,
    COUNT(*) AS submission_count,
    SUM(total_points) AS total_points,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count
FROM experience_blogger_submissions
GROUP BY service_type
ORDER BY submission_count DESC;

-- ======================
-- 10. 모든 테이블의 컬럼 상세 정보
-- ======================
SELECT
    '' AS blank_line,
    '=== 전체 테이블 컬럼 상세 정보 ===' AS section;

SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    pgd.description AS column_comment
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
    ON t.table_name = c.table_name
    AND t.table_schema = c.table_schema
LEFT JOIN pg_catalog.pg_statio_all_tables st
    ON st.schemaname = t.table_schema
    AND st.relname = t.table_name
LEFT JOIN pg_catalog.pg_description pgd
    ON pgd.objoid = st.relid
    AND pgd.objsubid = c.ordinal_position
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND (
        t.table_name LIKE '%submission%'
        OR t.table_name = 'product_categories'
        OR t.table_name = 'client_product_prices'
        OR t.table_name LIKE '%blogger%'
    )
ORDER BY t.table_name, c.ordinal_position;

-- ======================
-- 11. 인덱스 정보
-- ======================
SELECT
    '' AS blank_line,
    '=== 테이블 인덱스 정보 ===' AS section;

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (
        tablename LIKE '%submission%'
        OR tablename = 'product_categories'
        OR tablename = 'client_product_prices'
    )
ORDER BY tablename, indexname;

-- ======================
-- 12. 각 submission 테이블과 product_categories의 연결 여부
-- ======================
SELECT
    '' AS blank_line,
    '=== submission 테이블들의 category 연결 분석 ===' AS section;

-- place_submissions
SELECT
    'place_submissions' AS table_name,
    COUNT(*) AS total_records,
    COUNT(DISTINCT client_id) AS unique_clients,
    'NO CATEGORY LINK' AS category_connection
FROM place_submissions

UNION ALL

-- receipt_review_submissions
SELECT
    'receipt_review_submissions',
    COUNT(*),
    COUNT(DISTINCT client_id),
    'NO CATEGORY LINK'
FROM receipt_review_submissions

UNION ALL

-- kakaomap_review_submissions
SELECT
    'kakaomap_review_submissions',
    COUNT(*),
    COUNT(DISTINCT client_id),
    'NO CATEGORY LINK'
FROM kakaomap_review_submissions

UNION ALL

-- blog_distribution_submissions
SELECT
    'blog_distribution_submissions',
    COUNT(*),
    COUNT(DISTINCT client_id),
    'NO CATEGORY LINK'
FROM blog_distribution_submissions

UNION ALL

-- experience_blogger_submissions
SELECT
    'experience_blogger_submissions',
    COUNT(*),
    COUNT(DISTINCT client_id),
    'NO CATEGORY LINK'
FROM experience_blogger_submissions;

-- ======================
-- 13. 최근 생성된 모든 접수 내역 (전체 서비스)
-- ======================
SELECT
    '' AS blank_line,
    '=== 최근 접수 내역 (모든 서비스, 최근 10건) ===' AS section;

SELECT 'place_submissions' AS service, id, client_id, created_at, status, total_points
FROM place_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 'receipt_review' AS service, id, client_id, created_at, status, total_points
FROM receipt_review_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 'kakaomap_review' AS service, id, client_id, created_at, status, total_points
FROM kakaomap_review_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 'blog_distribution' AS service, id, client_id, created_at, status, total_points
FROM blog_distribution_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 'experience_blogger' AS service, id, client_id, created_at, status, total_points
FROM experience_blogger_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

ORDER BY created_at DESC
LIMIT 20;

-- ======================
-- 끝
-- ======================
SELECT
    '' AS blank_line,
    '=== 분석 완료 ===' AS section;
