-- 온보딩 관련 필드 추가
-- 2024-12-03

-- clients 테이블에 온보딩 관련 컬럼 추가
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS client_type VARCHAR(20) DEFAULT NULL; -- 'advertiser' (광고주) | 'agency' (대행사)

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_completed ON clients(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);

-- 기존 사용자는 온보딩 완료 처리 (기존에 만들어진 계정은 모두 완료 상태로)
UPDATE clients
SET onboarding_completed = true
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- 새로 추가되는 카카오 사용자는 온보딩 미완료 상태로 시작
-- (auth_provider = 'kakao' AND created_at이 이 마이그레이션 이후인 경우)

COMMENT ON COLUMN clients.onboarding_completed IS '온보딩 완료 여부 - 카카오 최초 로그인 시 false로 시작';
COMMENT ON COLUMN clients.client_type IS '클라이언트 유형 - advertiser(광고주) 또는 agency(대행사)';
