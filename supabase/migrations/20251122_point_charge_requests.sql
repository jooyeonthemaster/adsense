-- 포인트 충전 요청 테이블
CREATE TABLE IF NOT EXISTS point_charge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_point_charge_requests_client_id ON point_charge_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_point_charge_requests_status ON point_charge_requests(status);
CREATE INDEX IF NOT EXISTS idx_point_charge_requests_created_at ON point_charge_requests(created_at DESC);

-- RLS 활성화
ALTER TABLE point_charge_requests ENABLE ROW LEVEL SECURITY;

-- 클라이언트는 자신의 충전 요청만 조회 가능
CREATE POLICY "Clients can view own charge requests"
  ON point_charge_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = point_charge_requests.client_id
      AND clients.id = auth.uid()
    )
  );

-- 클라이언트는 자신의 충전 요청만 생성 가능
CREATE POLICY "Clients can create own charge requests"
  ON point_charge_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = point_charge_requests.client_id
      AND clients.id = auth.uid()
    )
  );

-- 관리자는 모든 충전 요청 조회 가능
CREATE POLICY "Admins can view all charge requests"
  ON point_charge_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- 관리자는 모든 충전 요청 업데이트 가능
CREATE POLICY "Admins can update all charge requests"
  ON point_charge_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_point_charge_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_point_charge_requests_updated_at
  BEFORE UPDATE ON point_charge_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_point_charge_requests_updated_at();

-- 거래처별 충전 요청 카운트 추가 (clients 테이블에 컬럼 추가)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pending_charge_requests_count INTEGER DEFAULT 0;

-- 충전 요청 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION update_client_charge_request_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    UPDATE clients 
    SET pending_charge_requests_count = pending_charge_requests_count + 1
    WHERE id = NEW.client_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
      UPDATE clients 
      SET pending_charge_requests_count = GREATEST(0, pending_charge_requests_count - 1)
      WHERE id = NEW.client_id;
    ELSIF OLD.status != 'pending' AND NEW.status = 'pending' THEN
      UPDATE clients 
      SET pending_charge_requests_count = pending_charge_requests_count + 1
      WHERE id = NEW.client_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'pending' THEN
    UPDATE clients 
    SET pending_charge_requests_count = GREATEST(0, pending_charge_requests_count - 1)
    WHERE id = OLD.client_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_charge_request_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON point_charge_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_client_charge_request_count();

-- 기존 데이터에 대한 카운트 초기화
UPDATE clients c
SET pending_charge_requests_count = (
  SELECT COUNT(*)
  FROM point_charge_requests pcr
  WHERE pcr.client_id = c.id AND pcr.status = 'pending'
);













