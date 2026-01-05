-- ============================================
-- Tax Invoice Requests System
-- 2026-01-05
-- 목적: 세금계산서 발행 요청 관리
-- ============================================

-- ======================
-- 1. 세금계산서 발행 요청 테이블 생성
-- ======================

CREATE TABLE IF NOT EXISTS tax_invoice_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES point_transactions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  reject_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(transaction_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tax_invoice_requests_client ON tax_invoice_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_tax_invoice_requests_status ON tax_invoice_requests(status);
CREATE INDEX IF NOT EXISTS idx_tax_invoice_requests_created ON tax_invoice_requests(created_at DESC);

COMMENT ON TABLE tax_invoice_requests IS '세금계산서 발행 요청';
COMMENT ON COLUMN tax_invoice_requests.client_id IS '요청한 클라이언트 ID';
COMMENT ON COLUMN tax_invoice_requests.transaction_id IS '관련 포인트 거래 ID';
COMMENT ON COLUMN tax_invoice_requests.amount IS '세금계산서 발행 금액';
COMMENT ON COLUMN tax_invoice_requests.status IS '요청 상태 (pending: 대기, completed: 발행완료, rejected: 거부)';
COMMENT ON COLUMN tax_invoice_requests.reject_reason IS '거부 사유';
COMMENT ON COLUMN tax_invoice_requests.completed_at IS '처리 완료 일시';
COMMENT ON COLUMN tax_invoice_requests.completed_by IS '처리한 관리자 ID';

-- ======================
-- 2. 자동 updated_at 트리거
-- ======================

CREATE OR REPLACE FUNCTION update_tax_invoice_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tax_invoice_requests_updated_at ON tax_invoice_requests;
CREATE TRIGGER trigger_tax_invoice_requests_updated_at
  BEFORE UPDATE ON tax_invoice_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_invoice_requests_updated_at();

-- ======================
-- 3. RLS 비활성화 (API에서 권한 체크)
-- ======================

ALTER TABLE tax_invoice_requests DISABLE ROW LEVEL SECURITY;

-- ======================
-- 4. 완료
-- ======================

SELECT '=== Tax Invoice Requests System Created ===' AS info;
