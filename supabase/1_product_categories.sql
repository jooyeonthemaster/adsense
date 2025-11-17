-- 1. product_categories에 뭐가 있나?
SELECT
    id,
    name AS "상품명",
    slug AS "슬러그"
FROM product_categories
ORDER BY created_at;
