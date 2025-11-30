-- 클라이언트 마이페이지 정보 추가
-- 사업자등록증, 추가 연락처 정보 등

-- clients 테이블에 마이페이지용 컬럼 추가
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_license_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_license_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_number TEXT; -- 사업자등록번호
ALTER TABLE clients ADD COLUMN IF NOT EXISTS representative_name TEXT; -- 대표자명
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_address TEXT; -- 사업장 주소
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_email TEXT; -- 세금계산서 수령 이메일
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMPTZ;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clients_business_number ON clients(business_number);

-- 코멘트 추가
COMMENT ON COLUMN clients.business_license_url IS '사업자등록증 파일 URL';
COMMENT ON COLUMN clients.business_license_name IS '사업자등록증 파일명';
COMMENT ON COLUMN clients.business_number IS '사업자등록번호';
COMMENT ON COLUMN clients.representative_name IS '대표자명';
COMMENT ON COLUMN clients.business_address IS '사업장 주소';
COMMENT ON COLUMN clients.tax_email IS '세금계산서 수령 이메일';
COMMENT ON COLUMN clients.profile_updated_at IS '프로필 정보 최종 수정일';
