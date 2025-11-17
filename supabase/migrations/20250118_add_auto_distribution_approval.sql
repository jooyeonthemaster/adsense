-- Add auto_distribution_approved field to clients table
-- This field controls whether a client is allowed to use the auto distribution service

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS auto_distribution_approved BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN clients.auto_distribution_approved IS '자동화 배포 서비스 사용 승인 여부';

-- Update existing clients to false (default)
UPDATE clients SET auto_distribution_approved = FALSE WHERE auto_distribution_approved IS NULL;
