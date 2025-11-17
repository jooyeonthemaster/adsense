-- ============================================
-- 핵심 문제 확인 SQL (한 눈에 보기)
-- ============================================

-- 1. product_categories에 뭐가 있나?
SELECT
    '📦 product_categories 현황' AS "분석",
    id,
    name AS "상품명",
    slug AS "슬러그",
    is_active AS "활성화"
FROM product_categories
ORDER BY created_at;

-- 2. 체험단 7건의 타입별 분포
SELECT
    '🎯 체험단 타입별 분포' AS "분석",
    CASE experience_type
        WHEN 'blog-experience' THEN '블로그 체험단'
        WHEN 'xiaohongshu' THEN '샤오홍슈'
        WHEN 'journalist' THEN '실계정 기자단'
        WHEN 'influencer' THEN '블로그 인플루언서'
        ELSE experience_type
    END AS "타입",
    COUNT(*) AS "접수 건수",
    SUM(total_points) AS "총 포인트"
FROM experience_submissions
GROUP BY experience_type
ORDER BY COUNT(*) DESC;

-- 3. 각 체험단 타입이 product_categories에 있나?
SELECT
    '🔍 체험단 타입 vs product_categories' AS "분석",
    CASE exp_type
        WHEN 'blog-experience' THEN '블로그 체험단'
        WHEN 'xiaohongshu' THEN '샤오홍슈'
        WHEN 'journalist' THEN '실계정 기자단'
        WHEN 'influencer' THEN '블로그 인플루언서'
    END AS "체험단 타입",
    exp_type AS "영문 타입",
    CASE
        WHEN EXISTS (
            SELECT 1 FROM product_categories
            WHERE slug LIKE '%' || exp_type || '%'
        ) THEN '✅ product_categories에 있음'
        ELSE '❌ product_categories에 없음'
    END AS "상태"
FROM (
    SELECT DISTINCT experience_type AS exp_type
    FROM experience_submissions
) AS types;

-- 4. 클라이언트별 설정된 상품 (누구한테 어떤 상품 가격이 설정됐나?)
SELECT
    '💰 클라이언트별 상품 가격 설정' AS "분석",
    c.company_name AS "클라이언트",
    pc.name AS "상품명",
    cpp.price_per_unit AS "단가",
    cpp.is_visible AS "노출"
FROM client_product_prices cpp
JOIN clients c ON cpp.client_id = c.id
JOIN product_categories pc ON cpp.category_id = pc.id
ORDER BY c.company_name, pc.name;

-- 5. 전체 상황 요약
SELECT
    '📊 전체 상황 요약' AS "분석",
    (SELECT COUNT(*) FROM product_categories) AS "등록된 상품 카테고리 수",
    (SELECT COUNT(DISTINCT experience_type) FROM experience_submissions) AS "사용중인 체험단 타입 수",
    (SELECT COUNT(*) FROM experience_submissions) AS "체험단 접수 건수",
    (SELECT SUM(total_points) FROM experience_submissions) AS "체험단 총 포인트";
