-- 커뮤니티 마케팅 상품 카테고리 추가
-- 카페 침투 마케팅 페이지에서 "커뮤니티 마케팅" 서비스에 대한 가격 설정 기능 지원

INSERT INTO product_categories (name, slug, description, is_active)
VALUES (
  '커뮤니티 마케팅',
  'community-marketing',
  '다양한 온라인 커뮤니티 침투 마케팅',
  true
)
ON CONFLICT (slug) DO NOTHING;
