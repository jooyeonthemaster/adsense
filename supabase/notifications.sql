-- ============================================
-- 실시간 알림 시스템
-- ============================================

-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  recipient_id UUID, -- NULL이면 전체 관리자/거래처
  recipient_role VARCHAR(20) NOT NULL, -- admin or client
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_role ON notifications(recipient_role, read);

-- RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 트리거 함수: 새 접수 생성 알림 (관리자용)
-- ============================================
CREATE OR REPLACE FUNCTION notify_submission_created()
RETURNS trigger AS $$
DECLARE
  product_name TEXT;
BEGIN
  -- 상품 타입별 이름 설정
  CASE TG_TABLE_NAME
    WHEN 'place_submissions' THEN product_name := '플레이스 유입';
    WHEN 'receipt_review_submissions' THEN product_name := '영수증 리뷰';
    WHEN 'kakaomap_review_submissions' THEN product_name := '카카오맵 리뷰';
    WHEN 'blog_distribution_submissions' THEN product_name := '블로그 배포';
    ELSE product_name := '상품';
  END CASE;

  -- 관리자 전체에게 알림
  INSERT INTO notifications (type, title, message, data, recipient_role)
  VALUES (
    'submission_created',
    '새로운 접수',
    NEW.company_name || '의 ' || product_name || ' 접수가 등록되었습니다',
    json_build_object(
      'submission_id', NEW.id,
      'client_id', NEW.client_id,
      'submission_type', TG_TABLE_NAME,
      'company_name', NEW.company_name,
      'total_points', NEW.total_points
    ),
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거 함수: 접수 상태 변경 알림 (거래처용)
-- ============================================
CREATE OR REPLACE FUNCTION notify_submission_status_changed()
RETURNS trigger AS $$
DECLARE
  product_name TEXT;
  status_text TEXT;
BEGIN
  -- 상태가 변경되지 않았으면 알림 X
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- 상품 타입별 이름 설정
  CASE TG_TABLE_NAME
    WHEN 'place_submissions' THEN product_name := '플레이스 유입';
    WHEN 'receipt_review_submissions' THEN product_name := '영수증 리뷰';
    WHEN 'kakaomap_review_submissions' THEN product_name := '카카오맵 리뷰';
    WHEN 'blog_distribution_submissions' THEN product_name := '블로그 배포';
    ELSE product_name := '상품';
  END CASE;

  -- 상태별 텍스트
  CASE NEW.status
    WHEN 'pending' THEN status_text := '대기';
    WHEN 'approved' THEN status_text := '승인';
    WHEN 'completed' THEN status_text := '완료';
    WHEN 'cancelled' THEN status_text := '취소';
    ELSE status_text := NEW.status;
  END CASE;

  -- 해당 거래처에게 알림
  INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
  VALUES (
    'submission_status_changed',
    '접수 상태 변경',
    product_name || ' 접수가 ' || status_text || ' 되었습니다',
    json_build_object(
      'submission_id', NEW.id,
      'submission_type', TG_TABLE_NAME,
      'old_status', OLD.status,
      'new_status', NEW.status
    ),
    NEW.client_id,
    'client'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거 함수: 포인트 충전 알림 (거래처용)
-- ============================================
CREATE OR REPLACE FUNCTION notify_points_charged()
RETURNS trigger AS $$
BEGIN
  -- 충전인 경우만
  IF NEW.transaction_type = 'charge' THEN
    INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
    VALUES (
      'points_charged',
      '포인트 충전',
      NEW.amount || ' 포인트가 충전되었습니다. 잔액: ' || NEW.balance_after,
      json_build_object(
        'transaction_id', NEW.id,
        'amount', NEW.amount,
        'balance_after', NEW.balance_after
      ),
      NEW.client_id,
      'client'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거 함수: 포인트 부족 알림 (거래처용)
-- ============================================
CREATE OR REPLACE FUNCTION notify_points_low()
RETURNS trigger AS $$
BEGIN
  -- 포인트가 1000 이하로 떨어진 경우 (이전에는 1000 초과)
  IF NEW.points <= 1000 AND OLD.points > 1000 THEN
    INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
    VALUES (
      'points_low',
      '포인트 부족',
      '포인트 잔액이 부족합니다. 현재 잔액: ' || NEW.points,
      json_build_object(
        'client_id', NEW.id,
        'points', NEW.points
      ),
      NEW.id,
      'client'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거 함수: AS 신청 알림 (관리자용)
-- ============================================
CREATE OR REPLACE FUNCTION notify_as_request_created()
RETURNS trigger AS $$
BEGIN
  -- 관리자 전체에게 알림
  INSERT INTO notifications (type, title, message, data, recipient_role)
  VALUES (
    'as_request_created',
    '새로운 AS 신청',
    '부족률 ' || NEW.missing_rate || '%의 AS 신청이 접수되었습니다',
    json_build_object(
      'as_request_id', NEW.id,
      'client_id', NEW.client_id,
      'submission_type', NEW.submission_type,
      'missing_rate', NEW.missing_rate
    ),
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거 함수: AS 처리 완료 알림 (거래처용)
-- ============================================
CREATE OR REPLACE FUNCTION notify_as_request_resolved()
RETURNS trigger AS $$
BEGIN
  -- 상태가 resolved로 변경된 경우만
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
    VALUES (
      'as_request_resolved',
      'AS 처리 완료',
      'AS 신청이 처리되었습니다',
      json_build_object(
        'as_request_id', NEW.id,
        'resolution_notes', NEW.resolution_notes
      ),
      NEW.client_id,
      'client'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거 등록: 플레이스 접수
-- ============================================

-- 새 접수 생성 알림
CREATE TRIGGER place_submission_created_trigger
AFTER INSERT ON place_submissions
FOR EACH ROW EXECUTE FUNCTION notify_submission_created();

-- 상태 변경 알림
CREATE TRIGGER place_submission_status_changed_trigger
AFTER UPDATE ON place_submissions
FOR EACH ROW EXECUTE FUNCTION notify_submission_status_changed();

-- ============================================
-- 트리거 등록: 영수증 리뷰 접수
-- ============================================

CREATE TRIGGER receipt_submission_created_trigger
AFTER INSERT ON receipt_review_submissions
FOR EACH ROW EXECUTE FUNCTION notify_submission_created();

CREATE TRIGGER receipt_submission_status_changed_trigger
AFTER UPDATE ON receipt_review_submissions
FOR EACH ROW EXECUTE FUNCTION notify_submission_status_changed();

-- ============================================
-- 트리거 등록: 카카오맵 리뷰 접수
-- ============================================

CREATE TRIGGER kakaomap_submission_created_trigger
AFTER INSERT ON kakaomap_review_submissions
FOR EACH ROW EXECUTE FUNCTION notify_submission_created();

CREATE TRIGGER kakaomap_submission_status_changed_trigger
AFTER UPDATE ON kakaomap_review_submissions
FOR EACH ROW EXECUTE FUNCTION notify_submission_status_changed();

-- ============================================
-- 트리거 등록: 블로그 배포 접수
-- ============================================

CREATE TRIGGER blog_submission_created_trigger
AFTER INSERT ON blog_distribution_submissions
FOR EACH ROW EXECUTE FUNCTION notify_submission_created();

CREATE TRIGGER blog_submission_status_changed_trigger
AFTER UPDATE ON blog_distribution_submissions
FOR EACH ROW EXECUTE FUNCTION notify_submission_status_changed();

-- ============================================
-- 트리거 등록: 포인트 거래
-- ============================================

CREATE TRIGGER points_charged_trigger
AFTER INSERT ON point_transactions
FOR EACH ROW EXECUTE FUNCTION notify_points_charged();

-- ============================================
-- 트리거 등록: 거래처 포인트 변경
-- ============================================

CREATE TRIGGER points_low_trigger
AFTER UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION notify_points_low();

-- ============================================
-- 트리거 등록: AS 신청
-- ============================================

CREATE TRIGGER as_request_created_trigger
AFTER INSERT ON as_requests
FOR EACH ROW EXECUTE FUNCTION notify_as_request_created();

CREATE TRIGGER as_request_resolved_trigger
AFTER UPDATE ON as_requests
FOR EACH ROW EXECUTE FUNCTION notify_as_request_resolved();

-- ============================================
-- 완료
-- ============================================
