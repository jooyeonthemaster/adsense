-- ============================================
-- Default Product Prices System
-- 2026-01-05
-- 목적: 기본 상품 가격을 설정하여 신규 회원에게 자동 적용
-- ============================================

-- ======================
-- 1. 기본 가격 테이블 생성
-- ======================

CREATE TABLE IF NOT EXISTS default_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  price_per_unit INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_default_product_prices_category ON default_product_prices(category_id);

COMMENT ON TABLE default_product_prices IS '기본 상품 가격 설정 (신규 회원에게 적용)';
COMMENT ON COLUMN default_product_prices.category_id IS '상품 카테고리 ID';
COMMENT ON COLUMN default_product_prices.price_per_unit IS '기본 단가 (포인트)';

-- ======================
-- 2. 자동 updated_at 트리거
-- ======================

CREATE OR REPLACE FUNCTION update_default_product_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_default_product_prices_updated_at ON default_product_prices;
CREATE TRIGGER trigger_default_product_prices_updated_at
  BEFORE UPDATE ON default_product_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_default_product_prices_updated_at();

-- ======================
-- 3. RLS 비활성화 (API에서 권한 체크)
-- ======================

ALTER TABLE default_product_prices DISABLE ROW LEVEL SECURITY;

-- ======================
-- 4. 기본 데이터 삽입 (예시 가격)
-- 실제 가격은 관리자가 설정
-- ======================

-- 각 카테고리에 대해 기본 가격 0으로 초기화
INSERT INTO default_product_prices (category_id, price_per_unit)
SELECT id, 0
FROM product_categories
ON CONFLICT (category_id) DO NOTHING;

-- ======================
-- 5. 완료
-- ======================

SELECT '=== Default Product Prices System Created ===' AS info;

SELECT
  pc.name AS "상품명",
  pc.slug AS "슬러그",
  dpp.price_per_unit AS "기본가격"
FROM default_product_prices dpp
JOIN product_categories pc ON pc.id = dpp.category_id
ORDER BY pc.name;
