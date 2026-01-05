-- Add referrer tracking system to clients table
-- Purpose: Allow clients to refer other clients and track referral relationships

-- Add referrer_id column
ALTER TABLE clients
ADD COLUMN referrer_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Add index for performance (for queries filtering by referrer)
CREATE INDEX idx_clients_referrer_id ON clients(referrer_id);

-- Add comment for documentation
COMMENT ON COLUMN clients.referrer_id IS '추천인 클라이언트 ID (다른 클라이언트의 ID)';
