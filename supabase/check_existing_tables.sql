-- ============================================
-- 실제 존재하는 테이블 확인 (단계 1)
-- ============================================

-- 1. public 스키마의 모든 테이블 목록
SELECT
    tablename AS table_name,
    schemaname AS schema_name
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. submission 관련 테이블만 필터링
SELECT
    '=== submission 관련 테이블 ===' AS section;

SELECT
    tablename AS table_name
FROM pg_tables
WHERE schemaname = 'public'
    AND (
        tablename LIKE '%submission%'
        OR tablename LIKE '%blogger%'
        OR tablename LIKE '%experience%'
        OR tablename LIKE '%cafe%'
        OR tablename LIKE '%kakaomap%'
    )
ORDER BY tablename;

-- 3. 각 테이블의 레코드 수 (동적으로 확인)
SELECT
    '=== 테이블별 레코드 수 ===' AS section;

SELECT
    schemaname||'.'||tablename AS full_table_name,
    n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
