-- ============================================
-- Eureka Reward 추가
-- 2026-01-03
-- 목적: 유레카 리워드 매체 추가 및 media_type 컬럼 추가
-- ============================================

-- ======================
-- 1. 유레카 리워드 상품 카테고리 추가
-- ======================

INSERT INTO product_categories (name, slug, description, is_active) VALUES
  ('유레카 리워드', 'eureka-reward', '유레카 기반의 네이버 플레이스 조회수 증대 서비스', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ======================
-- 2. place_submissions 테이블에 media_type 컬럼 추가
-- ======================

ALTER TABLE place_submissions
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) DEFAULT 'twoople';

-- 기존 데이터는 모두 twoople로 설정
UPDATE place_submissions SET media_type = 'twoople' WHERE media_type IS NULL;

-- media_type 인덱스 생성 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_place_submissions_media_type ON place_submissions(media_type);

-- ======================
-- 3. 컬럼 설명 추가
-- ======================

COMMENT ON COLUMN place_submissions.media_type IS 'twoople: 투플, eureka: 유레카';

-- ======================
-- 4. 결과 확인
-- ======================

SELECT '=== Eureka Reward Migration Completed ===' AS info;

-- 새 카테고리 확인
SELECT
    id,
    name AS "상품명",
    slug AS "슬러그",
    is_active AS "활성화"
FROM product_categories
WHERE slug IN ('place-traffic', 'eureka-reward')
ORDER BY slug;

-- place_submissions 컬럼 확인
SELECT
    column_name AS "컬럼명",
    data_type AS "데이터 타입",
    column_default AS "기본값"
FROM information_schema.columns
WHERE table_name = 'place_submissions' AND column_name = 'media_type';