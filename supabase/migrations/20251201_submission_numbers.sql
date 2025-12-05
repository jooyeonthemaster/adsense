-- =====================================================
-- 접수번호(submission_number) 체계 도입
-- 형식: {상품코드}-{년도}-{일련번호}
-- 예: KM-2025-0001, RR-2025-0042
-- =====================================================

-- 상품 코드:
-- PL = Place (리워드)
-- RR = Receipt Review (방문자 리뷰/영수증 리뷰)
-- KM = Kakaomap (K맵 리뷰)
-- BD = Blog Distribution (블로그 배포)
-- EX = Experience (체험단)
-- CM = Cafe Marketing (카페 침투)

-- =====================================================
-- 1. 각 테이블에 submission_number 컬럼 추가
-- =====================================================

-- Place submissions (리워드)
ALTER TABLE place_submissions
ADD COLUMN IF NOT EXISTS submission_number VARCHAR(20) UNIQUE;

-- Receipt review submissions (방문자 리뷰)
ALTER TABLE receipt_review_submissions
ADD COLUMN IF NOT EXISTS submission_number VARCHAR(20) UNIQUE;

-- Kakaomap review submissions (K맵 리뷰)
ALTER TABLE kakaomap_review_submissions
ADD COLUMN IF NOT EXISTS submission_number VARCHAR(20) UNIQUE;

-- Blog distribution submissions (블로그 배포)
ALTER TABLE blog_distribution_submissions
ADD COLUMN IF NOT EXISTS submission_number VARCHAR(20) UNIQUE;

-- Experience submissions (체험단)
ALTER TABLE experience_submissions
ADD COLUMN IF NOT EXISTS submission_number VARCHAR(20) UNIQUE;

-- Cafe marketing submissions (카페 침투)
ALTER TABLE cafe_marketing_submissions
ADD COLUMN IF NOT EXISTS submission_number VARCHAR(20) UNIQUE;

-- =====================================================
-- 2. 접수번호 시퀀스 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS submission_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(10) NOT NULL,  -- PL, RR, KM, BD, EX, CM
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_code, year)
);

-- 초기 시퀀스 데이터 (2025년)
INSERT INTO submission_number_sequences (product_code, year, last_number)
VALUES
  ('PL', 2025, 0),
  ('RR', 2025, 0),
  ('KM', 2025, 0),
  ('BD', 2025, 0),
  ('EX', 2025, 0),
  ('CM', 2025, 0)
ON CONFLICT (product_code, year) DO NOTHING;

-- =====================================================
-- 3. 접수번호 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION generate_submission_number(p_product_code VARCHAR(10))
RETURNS VARCHAR(20) AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
  v_submission_number VARCHAR(20);
BEGIN
  v_year := EXTRACT(YEAR FROM NOW());

  -- 시퀀스 업데이트 및 다음 번호 가져오기 (동시성 처리)
  INSERT INTO submission_number_sequences (product_code, year, last_number)
  VALUES (p_product_code, v_year, 1)
  ON CONFLICT (product_code, year)
  DO UPDATE SET
    last_number = submission_number_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO v_next_number;

  -- 접수번호 형식: XX-YYYY-NNNN
  v_submission_number := p_product_code || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 4, '0');

  RETURN v_submission_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. 기존 데이터에 접수번호 부여 (생성일 순)
-- =====================================================

-- Place submissions
WITH numbered AS (
  SELECT id,
         'PL-' || EXTRACT(YEAR FROM created_at)::INTEGER || '-' ||
         LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at)::TEXT, 4, '0') as new_number
  FROM place_submissions
  WHERE submission_number IS NULL
)
UPDATE place_submissions p
SET submission_number = n.new_number
FROM numbered n
WHERE p.id = n.id;

-- Receipt review submissions
WITH numbered AS (
  SELECT id,
         'RR-' || EXTRACT(YEAR FROM created_at)::INTEGER || '-' ||
         LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at)::TEXT, 4, '0') as new_number
  FROM receipt_review_submissions
  WHERE submission_number IS NULL
)
UPDATE receipt_review_submissions p
SET submission_number = n.new_number
FROM numbered n
WHERE p.id = n.id;

-- Kakaomap review submissions
WITH numbered AS (
  SELECT id,
         'KM-' || EXTRACT(YEAR FROM created_at)::INTEGER || '-' ||
         LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at)::TEXT, 4, '0') as new_number
  FROM kakaomap_review_submissions
  WHERE submission_number IS NULL
)
UPDATE kakaomap_review_submissions p
SET submission_number = n.new_number
FROM numbered n
WHERE p.id = n.id;

-- Blog distribution submissions
WITH numbered AS (
  SELECT id,
         'BD-' || EXTRACT(YEAR FROM created_at)::INTEGER || '-' ||
         LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at)::TEXT, 4, '0') as new_number
  FROM blog_distribution_submissions
  WHERE submission_number IS NULL
)
UPDATE blog_distribution_submissions p
SET submission_number = n.new_number
FROM numbered n
WHERE p.id = n.id;

-- Experience submissions
WITH numbered AS (
  SELECT id,
         'EX-' || EXTRACT(YEAR FROM created_at)::INTEGER || '-' ||
         LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at)::TEXT, 4, '0') as new_number
  FROM experience_submissions
  WHERE submission_number IS NULL
)
UPDATE experience_submissions p
SET submission_number = n.new_number
FROM numbered n
WHERE p.id = n.id;

-- Cafe marketing submissions
WITH numbered AS (
  SELECT id,
         'CM-' || EXTRACT(YEAR FROM created_at)::INTEGER || '-' ||
         LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at)::TEXT, 4, '0') as new_number
  FROM cafe_marketing_submissions
  WHERE submission_number IS NULL
)
UPDATE cafe_marketing_submissions p
SET submission_number = n.new_number
FROM numbered n
WHERE p.id = n.id;

-- =====================================================
-- 5. 시퀀스 테이블 동기화 (기존 데이터 기준)
-- =====================================================

-- 각 상품별 마지막 번호로 시퀀스 업데이트
UPDATE submission_number_sequences s
SET last_number = COALESCE(
  (SELECT MAX(SUBSTRING(submission_number FROM '\d+$')::INTEGER)
   FROM place_submissions
   WHERE submission_number LIKE 'PL-' || s.year || '-%'), 0)
WHERE s.product_code = 'PL';

UPDATE submission_number_sequences s
SET last_number = COALESCE(
  (SELECT MAX(SUBSTRING(submission_number FROM '\d+$')::INTEGER)
   FROM receipt_review_submissions
   WHERE submission_number LIKE 'RR-' || s.year || '-%'), 0)
WHERE s.product_code = 'RR';

UPDATE submission_number_sequences s
SET last_number = COALESCE(
  (SELECT MAX(SUBSTRING(submission_number FROM '\d+$')::INTEGER)
   FROM kakaomap_review_submissions
   WHERE submission_number LIKE 'KM-' || s.year || '-%'), 0)
WHERE s.product_code = 'KM';

UPDATE submission_number_sequences s
SET last_number = COALESCE(
  (SELECT MAX(SUBSTRING(submission_number FROM '\d+$')::INTEGER)
   FROM blog_distribution_submissions
   WHERE submission_number LIKE 'BD-' || s.year || '-%'), 0)
WHERE s.product_code = 'BD';

UPDATE submission_number_sequences s
SET last_number = COALESCE(
  (SELECT MAX(SUBSTRING(submission_number FROM '\d+$')::INTEGER)
   FROM experience_submissions
   WHERE submission_number LIKE 'EX-' || s.year || '-%'), 0)
WHERE s.product_code = 'EX';

UPDATE submission_number_sequences s
SET last_number = COALESCE(
  (SELECT MAX(SUBSTRING(submission_number FROM '\d+$')::INTEGER)
   FROM cafe_marketing_submissions
   WHERE submission_number LIKE 'CM-' || s.year || '-%'), 0)
WHERE s.product_code = 'CM';

-- =====================================================
-- 6. 인덱스 생성
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_place_submissions_number ON place_submissions(submission_number);
CREATE INDEX IF NOT EXISTS idx_receipt_review_submissions_number ON receipt_review_submissions(submission_number);
CREATE INDEX IF NOT EXISTS idx_kakaomap_review_submissions_number ON kakaomap_review_submissions(submission_number);
CREATE INDEX IF NOT EXISTS idx_blog_distribution_submissions_number ON blog_distribution_submissions(submission_number);
CREATE INDEX IF NOT EXISTS idx_experience_submissions_number ON experience_submissions(submission_number);
CREATE INDEX IF NOT EXISTS idx_cafe_marketing_submissions_number ON cafe_marketing_submissions(submission_number);

-- =====================================================
-- 7. 확인용 쿼리
-- =====================================================

-- 실행 후 아래 쿼리로 결과 확인:
/*
SELECT 'place' as type, submission_number, company_name, created_at
FROM place_submissions ORDER BY created_at LIMIT 5;

SELECT 'receipt' as type, submission_number, company_name, created_at
FROM receipt_review_submissions ORDER BY created_at LIMIT 5;

SELECT 'kakaomap' as type, submission_number, company_name, created_at
FROM kakaomap_review_submissions ORDER BY created_at LIMIT 5;

SELECT 'blog' as type, submission_number, company_name, created_at
FROM blog_distribution_submissions ORDER BY created_at LIMIT 5;

SELECT 'experience' as type, submission_number, company_name, created_at
FROM experience_submissions ORDER BY created_at LIMIT 5;

SELECT 'cafe' as type, submission_number, company_name, created_at
FROM cafe_marketing_submissions ORDER BY created_at LIMIT 5;

-- 시퀀스 현황 확인
SELECT * FROM submission_number_sequences ORDER BY product_code, year;
*/
