-- ============================================
-- 상품명에서 "[수정]" 텍스트 제거
-- ============================================
-- 실행 방법: Supabase Dashboard → SQL Editor에서 실행

-- 1. 현재 상태 확인 (실행 전 확인용)
SELECT id, name, slug, description
FROM product_categories
WHERE name LIKE '%[수정]%' OR name LIKE '%[%]%';

-- 2. "[수정]" 텍스트 제거
UPDATE product_categories
SET name = REPLACE(name, '[수정]', '')
WHERE name LIKE '%[수정]%';

-- 3. 혹시 다른 대괄호 텍스트도 제거 (필요시)
-- UPDATE product_categories
-- SET name = REGEXP_REPLACE(name, '\[.*?\]', '', 'g')
-- WHERE name ~ '\[.*?\]';

-- 4. 수정 결과 확인
SELECT id, name, slug, description
FROM product_categories
ORDER BY created_at;
