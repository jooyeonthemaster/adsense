-- 카카오 소셜 로그인을 위한 clients 테이블 수정
-- 실행일: 2025-11-28

-- 1. 카카오 관련 컬럼 추가
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS kakao_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';

-- 2. password nullable로 변경 (카카오 사용자는 비밀번호 없음)
ALTER TABLE clients ALTER COLUMN password DROP NOT NULL;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clients_kakao_id ON clients(kakao_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_provider ON clients(auth_provider);

-- 4. 기존 데이터 auth_provider 기본값 설정
UPDATE clients SET auth_provider = 'local' WHERE auth_provider IS NULL;

-- 5. COMMENT 추가 (문서화)
COMMENT ON COLUMN clients.kakao_id IS '카카오 OAuth 사용자 고유 ID';
COMMENT ON COLUMN clients.auth_provider IS '인증 제공자: local(일반 로그인), kakao(카카오 로그인)';
