-- 3. 체험단 타입이 product_categories에 있나?
SELECT
    DISTINCT experience_type AS "체험단_타입",
    CASE
        WHEN EXISTS (
            SELECT 1 FROM product_categories
            WHERE slug LIKE '%' || experience_type || '%'
        ) THEN '✅ 있음'
        ELSE '❌ 없음'
    END AS "상태"
FROM experience_submissions
ORDER BY experience_type;
