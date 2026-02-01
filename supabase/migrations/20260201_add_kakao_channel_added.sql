-- 카카오 채널 추가 여부 필드 추가
-- 목적: 카카오톡 광고성 메시지 발송을 위해 채널 친구 추가 여부 추적

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS kakao_channel_added BOOLEAN DEFAULT false;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clients_kakao_channel_added ON clients(kakao_channel_added);

-- 기존 사용자들은 채널 미추가 상태로 설정
UPDATE clients SET kakao_channel_added = false WHERE kakao_channel_added IS NULL;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN clients.kakao_channel_added IS '카카오톡 채널 친구 추가 완료 여부 (광고성 메시지 발송용)';
