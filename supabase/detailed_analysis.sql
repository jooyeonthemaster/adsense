-- ============================================
-- 상세 데이터 분석 SQL
-- ============================================

-- 1. product_categories 전체 데이터
SELECT '=== product_categories 전체 ===' AS info;

SELECT
    id,
    name,
    slug,
    description,
    is_active,
    created_at
FROM product_categories
ORDER BY created_at;

-- 2. client_product_prices 상세
SELECT '=== client_product_prices 상세 ===' AS info;

SELECT
    cpp.id,
    c.company_name AS client_name,
    pc.name AS product_name,
    pc.slug AS product_slug,
    cpp.price_per_unit,
    cpp.is_visible
FROM client_product_prices cpp
LEFT JOIN clients c ON cpp.client_id = c.id
LEFT JOIN product_categories pc ON cpp.category_id = pc.id
ORDER BY c.company_name, pc.name;

-- 3. experience_submissions 상세 (타입별 분포)
SELECT '=== experience_submissions 타입별 분포 ===' AS info;

SELECT
    experience_type,
    COUNT(*) AS count,
    SUM(total_points) AS total_points,
    AVG(total_points) AS avg_points
FROM experience_submissions
GROUP BY experience_type
ORDER BY count DESC;

-- 4. experience_submissions 전체 데이터
SELECT '=== experience_submissions 전체 데이터 ===' AS info;

SELECT
    id,
    company_name,
    experience_type,
    team_count,
    total_points,
    status,
    bloggers_registered,
    bloggers_selected,
    schedule_confirmed,
    created_at
FROM experience_submissions
ORDER BY created_at DESC;

-- 5. 클라이언트별 접수 현황 (모든 서비스)
SELECT '=== 클라이언트별 전체 접수 현황 ===' AS info;

SELECT
    c.company_name,
    (SELECT COUNT(*) FROM place_submissions WHERE client_id = c.id) AS place_count,
    (SELECT COUNT(*) FROM receipt_review_submissions WHERE client_id = c.id) AS receipt_count,
    (SELECT COUNT(*) FROM kakaomap_review_submissions WHERE client_id = c.id) AS kakaomap_count,
    (SELECT COUNT(*) FROM blog_distribution_submissions WHERE client_id = c.id) AS blog_count,
    (SELECT COUNT(*) FROM experience_submissions WHERE client_id = c.id) AS experience_count,
    (
        (SELECT COUNT(*) FROM place_submissions WHERE client_id = c.id) +
        (SELECT COUNT(*) FROM receipt_review_submissions WHERE client_id = c.id) +
        (SELECT COUNT(*) FROM kakaomap_review_submissions WHERE client_id = c.id) +
        (SELECT COUNT(*) FROM blog_distribution_submissions WHERE client_id = c.id) +
        (SELECT COUNT(*) FROM experience_submissions WHERE client_id = c.id)
    ) AS total_submissions
FROM clients c
ORDER BY total_submissions DESC;

-- 6. 클라이언트별 설정된 상품 가격 현황
SELECT '=== 클라이언트별 설정된 상품 가격 ===' AS info;

SELECT
    c.company_name AS client,
    STRING_AGG(pc.name, ', ' ORDER BY pc.name) AS available_products,
    COUNT(cpp.id) AS product_count
FROM clients c
LEFT JOIN client_product_prices cpp ON c.id = cpp.client_id
LEFT JOIN product_categories pc ON cpp.category_id = pc.id
WHERE cpp.is_visible = true
GROUP BY c.id, c.company_name
ORDER BY product_count DESC;

-- 7. 누락된 상품 카테고리 확인
SELECT '=== 체험단 타입이 product_categories에 있는지 확인 ===' AS info;

SELECT
    experience_type,
    CASE
        WHEN experience_type = 'blog-experience' THEN '블로그 체험단'
        WHEN experience_type = 'xiaohongshu' THEN '샤오홍슈'
        WHEN experience_type = 'journalist' THEN '실계정 기자단'
        WHEN experience_type = 'influencer' THEN '블로그 인플루언서'
        ELSE experience_type
    END AS korean_name,
    COUNT(*) AS submission_count,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM product_categories
            WHERE slug LIKE '%' || experience_type || '%'
               OR slug = 'blog-experience'
               OR slug = 'xiaohongshu'
               OR slug = 'journalist'
               OR slug = 'influencer'
        ) THEN '✅ 있음'
        ELSE '❌ 없음'
    END AS in_product_categories
FROM experience_submissions
GROUP BY experience_type
ORDER BY submission_count DESC;

-- 8. 최근 30일 접수 내역 (타입별)
SELECT '=== 최근 30일 서비스별 접수 현황 ===' AS info;

SELECT
    '플레이스 유입' AS service,
    COUNT(*) AS count,
    SUM(total_points) AS total_points
FROM place_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT
    '영수증 리뷰',
    COUNT(*),
    SUM(total_points)
FROM receipt_review_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT
    'K맵 리뷰',
    COUNT(*),
    SUM(total_points)
FROM kakaomap_review_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT
    '블로그 배포',
    COUNT(*),
    SUM(total_points)
FROM blog_distribution_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT
    '체험단 마케팅',
    COUNT(*),
    SUM(total_points)
FROM experience_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'

ORDER BY count DESC;
