-- ============================================
-- Product Guides Management System
-- 2025-11-23
-- 목적: 각 상품별 접수 페이지의 서비스 안내/가이드를 체계적으로 관리
-- ============================================

-- ======================
-- 1. 상품별 가이드 메인 테이블
-- ======================

CREATE TABLE IF NOT EXISTS product_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_product_guides_key ON product_guides(product_key);
CREATE INDEX idx_product_guides_active ON product_guides(is_active, display_order);

COMMENT ON TABLE product_guides IS '상품별 가이드 메인 정보';
COMMENT ON COLUMN product_guides.product_key IS '상품 식별자 (reward, receipt-review, kakaomap-review 등)';
COMMENT ON COLUMN product_guides.title IS '가이드 제목';
COMMENT ON COLUMN product_guides.description IS '가이드 설명';
COMMENT ON COLUMN product_guides.icon IS 'Lucide 아이콘 이름';

-- ======================
-- 2. 가이드 섹션 테이블
-- ======================

CREATE TABLE IF NOT EXISTS product_guide_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES product_guides(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  icon VARCHAR(50),
  is_collapsible BOOLEAN DEFAULT true,
  is_expanded_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  bg_color VARCHAR(50),
  text_color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_guide_sections_guide ON product_guide_sections(guide_id, display_order);
CREATE INDEX idx_guide_sections_type ON product_guide_sections(section_type);
CREATE INDEX idx_guide_sections_active ON product_guide_sections(is_active);

COMMENT ON TABLE product_guide_sections IS '가이드 섹션 (접을 수 있는 블록)';
COMMENT ON COLUMN product_guide_sections.section_type IS '섹션 타입: features, notice, pricing, steps, faq, warning, custom';
COMMENT ON COLUMN product_guide_sections.content IS 'HTML 또는 Markdown 형식의 내용';
COMMENT ON COLUMN product_guide_sections.is_collapsible IS '접을 수 있는지 여부';
COMMENT ON COLUMN product_guide_sections.is_expanded_default IS '기본으로 펼쳐진 상태인지';
COMMENT ON COLUMN product_guide_sections.bg_color IS '배경색 (Tailwind 클래스명)';
COMMENT ON COLUMN product_guide_sections.text_color IS '텍스트색 (Tailwind 클래스명)';

-- ======================
-- 3. 가이드 수정 이력 테이블
-- ======================

CREATE TABLE IF NOT EXISTS product_guide_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES product_guides(id) ON DELETE CASCADE,
  section_id UUID REFERENCES product_guide_sections(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL,
  content_snapshot JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_guide_history_guide ON product_guide_history(guide_id, changed_at DESC);
CREATE INDEX idx_guide_history_section ON product_guide_history(section_id, changed_at DESC);
CREATE INDEX idx_guide_history_user ON product_guide_history(changed_by, changed_at DESC);

COMMENT ON TABLE product_guide_history IS '가이드 수정 이력';
COMMENT ON COLUMN product_guide_history.action IS 'created, updated, deleted';
COMMENT ON COLUMN product_guide_history.content_snapshot IS '변경 전 내용 스냅샷';

-- ======================
-- 4. 자동 updated_at 트리거
-- ======================

CREATE OR REPLACE FUNCTION update_product_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_product_guides_updated_at
  BEFORE UPDATE ON product_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_product_guides_updated_at();

CREATE TRIGGER trigger_product_guide_sections_updated_at
  BEFORE UPDATE ON product_guide_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_product_guides_updated_at();

-- ======================
-- 5. 수정 이력 자동 기록 트리거
-- ======================

-- 가이드 수정 이력
CREATE OR REPLACE FUNCTION log_product_guide_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO product_guide_history (guide_id, action, content_snapshot, changed_by)
    VALUES (
      OLD.id,
      'updated',
      jsonb_build_object(
        'title', OLD.title,
        'description', OLD.description,
        'is_active', OLD.is_active,
        'display_order', OLD.display_order
      ),
      NEW.updated_by
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO product_guide_history (guide_id, action, content_snapshot, changed_by)
    VALUES (
      OLD.id,
      'deleted',
      jsonb_build_object(
        'title', OLD.title,
        'description', OLD.description,
        'product_key', OLD.product_key
      ),
      OLD.updated_by
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_product_guide_changes
  AFTER UPDATE OR DELETE ON product_guides
  FOR EACH ROW
  EXECUTE FUNCTION log_product_guide_changes();

-- 섹션 수정 이력
CREATE OR REPLACE FUNCTION log_product_guide_section_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO product_guide_history (guide_id, section_id, action, content_snapshot)
    VALUES (
      OLD.guide_id,
      OLD.id,
      'updated',
      jsonb_build_object(
        'title', OLD.title,
        'content', OLD.content,
        'section_type', OLD.section_type,
        'is_active', OLD.is_active
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO product_guide_history (guide_id, section_id, action, content_snapshot)
    VALUES (
      OLD.guide_id,
      OLD.id,
      'deleted',
      jsonb_build_object(
        'title', OLD.title,
        'content', OLD.content,
        'section_type', OLD.section_type
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_product_guide_section_changes
  AFTER UPDATE OR DELETE ON product_guide_sections
  FOR EACH ROW
  EXECUTE FUNCTION log_product_guide_section_changes();

-- ======================
-- 6. RLS 비활성화 (API에서 권한 체크)
-- ======================

ALTER TABLE product_guides DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_guide_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_guide_history DISABLE ROW LEVEL SECURITY;

-- ======================
-- 7. 기본 데이터 삽입
-- ======================

-- 리워드
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('reward', '리워드 접수 서비스', '네이버 플레이스 유입 서비스', 'Gift', 1)
ON CONFLICT (product_key) DO NOTHING;

-- 방문자 리뷰
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('receipt-review', '방문자 리뷰 서비스', '영수증 기반 네이버 리뷰 작성', 'MessageSquare', 2)
ON CONFLICT (product_key) DO NOTHING;

-- K맵 리뷰
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('kakaomap-review', '카카오맵 리뷰 서비스', '카카오맵 리뷰 작성 서비스', 'Star', 3)
ON CONFLICT (product_key) DO NOTHING;

-- 블로그 체험단
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('blog-experience', '블로그 체험단', '블로거 체험단 마케팅', 'Users', 4)
ON CONFLICT (product_key) DO NOTHING;

-- 샤오홍슈
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('xiaohongshu', '샤오홍슈 체험단', '중국인 인플루언서 마케팅', 'Users', 5)
ON CONFLICT (product_key) DO NOTHING;

-- 블로그 기자단
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('journalist', '블로그 기자단', '실계정 기자단 마케팅', 'Users', 6)
ON CONFLICT (product_key) DO NOTHING;

-- 블로그 인플루언서
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('influencer', '블로그 인플루언서', '인플루언서 협업 마케팅', 'Users', 7)
ON CONFLICT (product_key) DO NOTHING;

-- 영상 배포
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('blog-video', '영상 배포', '블로그 영상 콘텐츠 배포', 'FileText', 8)
ON CONFLICT (product_key) DO NOTHING;

-- 자동화 배포
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('blog-automation', '자동화 배포', '블로그 자동 배포 서비스', 'FileText', 9)
ON CONFLICT (product_key) DO NOTHING;

-- 리뷰어 배포
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('blog-reviewer', '리뷰어 배포', '블로그 리뷰어 배포', 'FileText', 10)
ON CONFLICT (product_key) DO NOTHING;

-- 카페침투 마케팅
INSERT INTO product_guides (product_key, title, description, icon, display_order)
VALUES ('cafe-marketing', '카페침투 마케팅', '네이버 카페 마케팅', 'Coffee', 11)
ON CONFLICT (product_key) DO NOTHING;

-- ======================
-- 8. 완료
-- ======================

SELECT '=== Product Guides Management System Created ===' AS info;

SELECT COUNT(*) AS "생성된 가이드 수" FROM product_guides;












