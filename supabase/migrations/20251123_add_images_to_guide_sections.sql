-- ============================================
-- Add Images Support to Product Guide Sections
-- 2025-11-23
-- 목적: 가이드 섹션에 이미지 및 링크 기능 추가
-- ============================================

-- images 컬럼 추가 (JSONB 배열)
-- 구조: [{ url: 'storage_url', mobile_url: 'mobile_url', link: 'external_url', alt: 'description' }]
ALTER TABLE product_guide_sections 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 이미지 레이아웃 타입 컬럼 추가
ALTER TABLE product_guide_sections
ADD COLUMN IF NOT EXISTS image_layout VARCHAR(20) DEFAULT 'grid' CHECK (image_layout IN ('banner', 'gallery', 'grid', 'inline'));

COMMENT ON COLUMN product_guide_sections.images IS '섹션 이미지 배열 - url, mobile_url(선택), link(외부링크), alt(설명)';
COMMENT ON COLUMN product_guide_sections.image_layout IS '이미지 레이아웃: banner(배너), gallery(갤러리), grid(그리드), inline(인라인)';

SELECT '=== Images Support Added to Guide Sections ===' AS info;

