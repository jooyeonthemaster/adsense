-- ============================================
-- 애드센스 마케팅 상품 접수 시스템 데이터베이스 스키마
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 사용자(거래처) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL, -- bcrypt 해시
  company_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  points INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 관리자 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL, -- bcrypt 해시
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  is_super_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 상품 카테고리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 거래처별 상품 가격 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS client_product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  price_per_unit INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, category_id)
);

-- ============================================
-- 5. 플레이스 유입 접수 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS place_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  place_url TEXT NOT NULL,
  daily_count INTEGER NOT NULL CHECK (daily_count >= 100),
  total_days INTEGER NOT NULL CHECK (total_days >= 3 AND total_days <= 7),
  total_points INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, approved, completed, cancelled
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. 영수증 리뷰 접수 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS receipt_review_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  place_url TEXT NOT NULL,
  daily_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL CHECK (total_count >= 30),
  has_photo BOOLEAN DEFAULT false NOT NULL,
  has_script BOOLEAN DEFAULT false NOT NULL,
  guide_text TEXT,
  business_license_url TEXT,
  sample_receipt_url TEXT,
  photo_urls TEXT[], -- Array of uploaded photo URLs
  total_points INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. 카카오맵 리뷰 접수 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS kakaomap_review_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  kakaomap_url TEXT NOT NULL,
  daily_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL CHECK (total_count >= 10),
  has_photo BOOLEAN DEFAULT false NOT NULL,
  text_review_count INTEGER DEFAULT 0 NOT NULL,
  photo_review_count INTEGER DEFAULT 0 NOT NULL,
  photo_urls TEXT[],
  script_urls TEXT[],
  total_points INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  script_confirmed BOOLEAN DEFAULT false,
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. 블로그 배포 접수 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS blog_distribution_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  distribution_type VARCHAR(50) NOT NULL, -- reviewer, video, automation
  content_type VARCHAR(20) NOT NULL, -- review, info
  company_name VARCHAR(200) NOT NULL,
  place_url TEXT NOT NULL,
  daily_count INTEGER NOT NULL CHECK (daily_count <= 3),
  total_count INTEGER NOT NULL CHECK (total_count <= 30),
  keywords TEXT[],
  guide_text TEXT,
  photo_urls TEXT[],
  script_urls TEXT[],
  account_id VARCHAR(100), -- For automation type
  charge_count INTEGER, -- For automation type
  total_points INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. 포인트 거래 내역 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL, -- charge, deduct, refund
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_type VARCHAR(50), -- submission_type
  reference_id UUID, -- submission_id
  description TEXT,
  created_by UUID, -- admin_id if manual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. 리포트 파일 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_type VARCHAR(50) NOT NULL,
  submission_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_by UUID REFERENCES admins(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. AS 신청 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS as_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  submission_type VARCHAR(50) NOT NULL,
  submission_id UUID NOT NULL,
  missing_rate DECIMAL(5,2) NOT NULL CHECK (missing_rate >= 20),
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, in_progress, resolved, rejected
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES admins(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성
-- ============================================
CREATE INDEX idx_clients_username ON clients(username);
CREATE INDEX idx_clients_active ON clients(is_active);
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_place_submissions_client ON place_submissions(client_id);
CREATE INDEX idx_place_submissions_status ON place_submissions(status);
CREATE INDEX idx_receipt_submissions_client ON receipt_review_submissions(client_id);
CREATE INDEX idx_receipt_submissions_status ON receipt_review_submissions(status);
CREATE INDEX idx_kakaomap_submissions_client ON kakaomap_review_submissions(client_id);
CREATE INDEX idx_kakaomap_submissions_status ON kakaomap_review_submissions(status);
CREATE INDEX idx_blog_submissions_client ON blog_distribution_submissions(client_id);
CREATE INDEX idx_blog_submissions_status ON blog_distribution_submissions(status);
CREATE INDEX idx_point_transactions_client ON point_transactions(client_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at);
CREATE INDEX idx_reports_submission ON reports(submission_type, submission_id);
CREATE INDEX idx_as_requests_client ON as_requests(client_id);
CREATE INDEX idx_as_requests_status ON as_requests(status);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_review_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kakaomap_review_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_distribution_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 기본 상품 카테고리 데이터 삽입
-- ============================================
INSERT INTO product_categories (name, slug, description) VALUES
  ('플레이스 유입', 'place-traffic', '네이버 플레이스 유입 접수 서비스'),
  ('영수증 리뷰', 'receipt-review', '영수증 기반 리뷰 작성 서비스'),
  ('카카오맵 리뷰', 'kakaomap-review', '카카오맵 리뷰 작성 서비스'),
  ('블로그 배포', 'blog-distribution', '블로그 콘텐츠 배포 서비스')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 기본 관리자 계정 생성 (비밀번호: admin123)
-- ============================================
-- 실제 배포 시 비밀번호를 변경하세요
INSERT INTO admins (username, password, name, email, is_super_admin) VALUES
  ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '관리자', 'admin@adsense.com', true)
ON CONFLICT (username) DO NOTHING;
