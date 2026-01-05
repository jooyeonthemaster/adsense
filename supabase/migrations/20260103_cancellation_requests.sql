-- ============================================
-- 중단 요청 시스템 (Cancellation Requests)
-- AS 요청과 별도로 관리되는 환불 요청 시스템
-- ============================================

-- 중단 요청 테이블 생성
CREATE TABLE IF NOT EXISTS cancellation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 관계 정보
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  submission_type VARCHAR(50) NOT NULL, -- place, receipt, kakaomap, blog, cafe
  submission_id UUID NOT NULL,

  -- 요청 정보
  reason TEXT, -- 중단 사유 (선택)

  -- 진행 상황 (요청 시점 스냅샷)
  total_count INTEGER NOT NULL DEFAULT 0, -- 총 예정 수량
  completed_count INTEGER NOT NULL DEFAULT 0, -- 완료 수량
  progress_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- 진행률 (%)

  -- 비용 정보
  total_points INTEGER NOT NULL DEFAULT 0, -- 총 결제 포인트
  calculated_refund INTEGER NOT NULL DEFAULT 0, -- 자동 계산된 환불 금액
  final_refund INTEGER, -- 관리자 확정 환불 금액 (NULL이면 미처리)

  -- 상태 관리
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending: 대기, approved: 승인(환불완료), rejected: 거절

  admin_response TEXT, -- 관리자 응답 메시지
  processed_by UUID, -- 처리한 관리자 ID
  processed_at TIMESTAMP WITH TIME ZONE, -- 처리 시간

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 상태 체크 제약 조건
ALTER TABLE cancellation_requests
ADD CONSTRAINT cancellation_requests_status_check
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 인덱스 생성
CREATE INDEX idx_cancellation_requests_client ON cancellation_requests(client_id);
CREATE INDEX idx_cancellation_requests_status ON cancellation_requests(status);
CREATE INDEX idx_cancellation_requests_submission ON cancellation_requests(submission_type, submission_id);
CREATE INDEX idx_cancellation_requests_created ON cancellation_requests(created_at DESC);

-- RLS 정책 활성화
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;

-- 코멘트 추가
COMMENT ON TABLE cancellation_requests IS '중단(환불) 요청 테이블 - AS 요청과 별도 관리';
COMMENT ON COLUMN cancellation_requests.submission_type IS '상품 유형: place, receipt, kakaomap, blog, cafe';
COMMENT ON COLUMN cancellation_requests.progress_rate IS '요청 시점 진행률 (0-100)';
COMMENT ON COLUMN cancellation_requests.calculated_refund IS '시스템 자동 계산 환불 금액';
COMMENT ON COLUMN cancellation_requests.final_refund IS '관리자 확정 환불 금액';

-- ============================================
-- 알림 트리거 함수
-- ============================================

-- 중단 요청 생성 시 관리자 알림
CREATE OR REPLACE FUNCTION notify_cancellation_request_created()
RETURNS trigger AS $$
DECLARE
  client_name TEXT;
BEGIN
  -- 클라이언트 이름 조회
  SELECT company_name INTO client_name
  FROM clients
  WHERE id = NEW.client_id;

  -- 관리자 전체에게 알림
  INSERT INTO notifications (type, title, message, data, recipient_role)
  VALUES (
    'cancellation_request_created',
    '새로운 중단 요청',
    COALESCE(client_name, '알수없음') || '의 중단 요청 (진행률 ' || ROUND(NEW.progress_rate) || '%)',
    json_build_object(
      'cancellation_request_id', NEW.id,
      'client_id', NEW.client_id,
      'submission_type', NEW.submission_type,
      'submission_id', NEW.submission_id,
      'progress_rate', NEW.progress_rate,
      'calculated_refund', NEW.calculated_refund,
      'link', '/admin/as-requests?tab=cancellation'
    ),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 중단 요청 처리 시 거래처 알림
CREATE OR REPLACE FUNCTION notify_cancellation_request_processed()
RETURNS trigger AS $$
BEGIN
  -- 상태가 변경된 경우만
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
    VALUES (
      CASE WHEN NEW.status = 'approved'
        THEN 'cancellation_approved'
        ELSE 'cancellation_rejected'
      END,
      CASE WHEN NEW.status = 'approved'
        THEN '중단 요청이 승인되었습니다'
        ELSE '중단 요청이 거절되었습니다'
      END,
      CASE WHEN NEW.status = 'approved'
        THEN '환불 금액: ' || COALESCE(NEW.final_refund, 0) || 'P가 환불되었습니다.'
        ELSE COALESCE(NEW.admin_response, '중단 요청이 거절되었습니다. 관리자에게 문의하세요.')
      END,
      json_build_object(
        'cancellation_request_id', NEW.id,
        'submission_type', NEW.submission_type,
        'submission_id', NEW.submission_id,
        'final_refund', NEW.final_refund,
        'link', '/dashboard/submissions'
      ),
      NEW.client_id,
      'client'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록
DROP TRIGGER IF EXISTS cancellation_request_created_trigger ON cancellation_requests;
CREATE TRIGGER cancellation_request_created_trigger
AFTER INSERT ON cancellation_requests
FOR EACH ROW EXECUTE FUNCTION notify_cancellation_request_created();

DROP TRIGGER IF EXISTS cancellation_request_processed_trigger ON cancellation_requests;
CREATE TRIGGER cancellation_request_processed_trigger
AFTER UPDATE ON cancellation_requests
FOR EACH ROW EXECUTE FUNCTION notify_cancellation_request_processed();

-- ============================================
-- 완료
-- ============================================
