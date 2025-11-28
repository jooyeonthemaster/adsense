-- ============================================
-- Announcements and Complete Notification System
-- 2025-11-23
-- 목적: 공지사항 테이블 추가 및 누락된 알림 트리거 완성
-- ============================================

-- ======================
-- 1. 공지사항 테이블 생성
-- ======================

-- 기존 테이블이 있으면 삭제
DROP TABLE IF EXISTS announcements CASCADE;

-- 새로 생성
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (target_audience IN ('all', 'client', 'admin')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX idx_announcements_active ON announcements(is_active, created_at DESC);
CREATE INDEX idx_announcements_target ON announcements(target_audience, is_active);
CREATE INDEX idx_announcements_priority ON announcements(priority);

-- RLS 비활성화 (다른 submission 테이블들과 동일하게 API에서 권한 체크)
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- ======================
-- 2. 체험단 마케팅 알림 트리거
-- ======================

-- 새 접수 생성 알림
CREATE OR REPLACE FUNCTION notify_experience_submission_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (type, title, message, data, recipient_role)
  VALUES (
    'submission_created',
    '새로운 접수',
    NEW.company_name || '의 체험단 마케팅 접수가 등록되었습니다',
    json_build_object(
      'submission_id', NEW.id,
      'client_id', NEW.client_id,
      'submission_type', 'experience_submissions',
      'experience_type', NEW.experience_type,
      'company_name', NEW.company_name,
      'total_points', NEW.total_points
    ),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS experience_submission_created_trigger ON experience_submissions;
CREATE TRIGGER experience_submission_created_trigger
AFTER INSERT ON experience_submissions
FOR EACH ROW EXECUTE FUNCTION notify_experience_submission_created();

-- 상태 변경 알림
CREATE OR REPLACE FUNCTION notify_experience_submission_status_changed()
RETURNS trigger AS $$
DECLARE
  status_text TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'pending' THEN status_text := '대기';
    WHEN 'in_progress' THEN status_text := '진행중';
    WHEN 'completed' THEN status_text := '완료';
    WHEN 'cancelled' THEN status_text := '취소';
    ELSE status_text := NEW.status;
  END CASE;

  INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
  VALUES (
    'submission_status_changed',
    '접수 상태 변경',
    '체험단 마케팅 접수가 ' || status_text || ' 되었습니다',
    json_build_object(
      'submission_id', NEW.id,
      'submission_type', 'experience_submissions',
      'old_status', OLD.status,
      'new_status', NEW.status
    ),
    NEW.client_id,
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS experience_submission_status_changed_trigger ON experience_submissions;
CREATE TRIGGER experience_submission_status_changed_trigger
AFTER UPDATE ON experience_submissions
FOR EACH ROW EXECUTE FUNCTION notify_experience_submission_status_changed();

-- ======================
-- 3. 카페침투 마케팅 알림 트리거
-- ======================

-- 새 접수 생성 알림
CREATE OR REPLACE FUNCTION notify_cafe_submission_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (type, title, message, data, recipient_role)
  VALUES (
    'submission_created',
    '새로운 접수',
    NEW.company_name || '의 카페침투 마케팅 접수가 등록되었습니다',
    json_build_object(
      'submission_id', NEW.id,
      'client_id', NEW.client_id,
      'submission_type', 'cafe_marketing_submissions',
      'company_name', NEW.company_name,
      'total_points', NEW.total_points
    ),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cafe_submission_created_trigger ON cafe_marketing_submissions;
CREATE TRIGGER cafe_submission_created_trigger
AFTER INSERT ON cafe_marketing_submissions
FOR EACH ROW EXECUTE FUNCTION notify_cafe_submission_created();

-- 상태 변경 알림
CREATE OR REPLACE FUNCTION notify_cafe_submission_status_changed()
RETURNS trigger AS $$
DECLARE
  status_text TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'pending' THEN status_text := '대기';
    WHEN 'approved' THEN status_text := '승인';
    WHEN 'script_writing' THEN status_text := '원고 작성중';
    WHEN 'script_completed' THEN status_text := '원고 작성완료';
    WHEN 'in_progress' THEN status_text := '진행중';
    WHEN 'completed' THEN status_text := '완료';
    WHEN 'cancelled' THEN status_text := '취소';
    ELSE status_text := NEW.status;
  END CASE;

  INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
  VALUES (
    'submission_status_changed',
    '접수 상태 변경',
    '카페침투 마케팅 접수가 ' || status_text || ' 되었습니다',
    json_build_object(
      'submission_id', NEW.id,
      'submission_type', 'cafe_marketing_submissions',
      'old_status', OLD.status,
      'new_status', NEW.status
    ),
    NEW.client_id,
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cafe_submission_status_changed_trigger ON cafe_marketing_submissions;
CREATE TRIGGER cafe_submission_status_changed_trigger
AFTER UPDATE ON cafe_marketing_submissions
FOR EACH ROW EXECUTE FUNCTION notify_cafe_submission_status_changed();

-- ======================
-- 4. 일별 유입/작업 기록 알림 트리거
-- ======================

-- 리워드 일별 기록 알림
CREATE OR REPLACE FUNCTION notify_place_daily_record()
RETURNS trigger AS $$
DECLARE
  v_client_id UUID;
  v_company_name VARCHAR(200);
BEGIN
  SELECT client_id, company_name INTO v_client_id, v_company_name
  FROM place_submissions WHERE id = NEW.submission_id;

  INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
  VALUES (
    'daily_record_updated',
    '리워드 일별 유입 기록',
    v_company_name || ' - ' || TO_CHAR(NEW.date, 'YYYY-MM-DD') || ' 일자 유입 ' || NEW.actual_count || '건 기록되었습니다',
    json_build_object(
      'submission_id', NEW.submission_id,
      'submission_type', 'place_submissions',
      'date', NEW.date,
      'count', NEW.actual_count
    ),
    v_client_id,
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS place_daily_record_trigger ON place_submissions_daily_records;
CREATE TRIGGER place_daily_record_trigger
AFTER INSERT ON place_submissions_daily_records
FOR EACH ROW EXECUTE FUNCTION notify_place_daily_record();

-- 방문자 리뷰 일별 기록 알림
CREATE OR REPLACE FUNCTION notify_receipt_daily_record()
RETURNS trigger AS $$
DECLARE
  v_client_id UUID;
  v_company_name VARCHAR(200);
BEGIN
  SELECT client_id, company_name INTO v_client_id, v_company_name
  FROM receipt_review_submissions WHERE id = NEW.submission_id;

  INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
  VALUES (
    'daily_record_updated',
    '방문자 리뷰 일별 작업 기록',
    v_company_name || ' - ' || TO_CHAR(NEW.date, 'YYYY-MM-DD') || ' 일자 리뷰 ' || NEW.actual_count || '건 작성되었습니다',
    json_build_object(
      'submission_id', NEW.submission_id,
      'submission_type', 'receipt_review_submissions',
      'date', NEW.date,
      'count', NEW.actual_count
    ),
    v_client_id,
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS receipt_daily_record_trigger ON receipt_review_daily_records;
CREATE TRIGGER receipt_daily_record_trigger
AFTER INSERT ON receipt_review_daily_records
FOR EACH ROW EXECUTE FUNCTION notify_receipt_daily_record();

-- K맵 리뷰 일별 기록 알림
CREATE OR REPLACE FUNCTION notify_kakaomap_daily_record()
RETURNS trigger AS $$
DECLARE
  v_client_id UUID;
  v_company_name VARCHAR(200);
BEGIN
  SELECT client_id, company_name INTO v_client_id, v_company_name
  FROM kakaomap_review_submissions WHERE id = NEW.submission_id;

  INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
  VALUES (
    'daily_record_updated',
    'K맵 리뷰 일별 작업 기록',
    v_company_name || ' - ' || TO_CHAR(NEW.date, 'YYYY-MM-DD') || ' 일자 리뷰 ' || NEW.actual_count || '건 작성되었습니다',
    json_build_object(
      'submission_id', NEW.submission_id,
      'submission_type', 'kakaomap_review_submissions',
      'date', NEW.date,
      'count', NEW.actual_count
    ),
    v_client_id,
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kakaomap_daily_record_trigger ON kakaomap_review_daily_records;
CREATE TRIGGER kakaomap_daily_record_trigger
AFTER INSERT ON kakaomap_review_daily_records
FOR EACH ROW EXECUTE FUNCTION notify_kakaomap_daily_record();

-- 블로그 배포 일별 기록 알림
CREATE OR REPLACE FUNCTION notify_blog_daily_record()
RETURNS trigger AS $$
DECLARE
  v_client_id UUID;
  v_company_name VARCHAR(200);
BEGIN
  SELECT client_id, company_name INTO v_client_id, v_company_name
  FROM blog_distribution_submissions WHERE id = NEW.submission_id;

  INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
  VALUES (
    'daily_record_updated',
    '블로그 배포 일별 작업 기록',
    v_company_name || ' - ' || TO_CHAR(NEW.record_date, 'YYYY-MM-DD') || ' 일자 배포 ' || NEW.completed_count || '건 완료되었습니다',
    json_build_object(
      'submission_id', NEW.submission_id,
      'submission_type', 'blog_distribution_submissions',
      'date', NEW.record_date,
      'count', NEW.completed_count
    ),
    v_client_id,
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_daily_record_trigger ON blog_distribution_daily_records;
CREATE TRIGGER blog_daily_record_trigger
AFTER INSERT ON blog_distribution_daily_records
FOR EACH ROW EXECUTE FUNCTION notify_blog_daily_record();

-- 카페침투 일별 기록 알림
CREATE OR REPLACE FUNCTION notify_cafe_daily_record()
RETURNS trigger AS $$
DECLARE
  v_client_id UUID;
  v_company_name VARCHAR(200);
BEGIN
  SELECT client_id, company_name INTO v_client_id, v_company_name
  FROM cafe_marketing_submissions WHERE id = NEW.submission_id;

  INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
  VALUES (
    'daily_record_updated',
    '카페침투 일별 작업 기록',
    v_company_name || ' - ' || TO_CHAR(NEW.record_date, 'YYYY-MM-DD') || ' 일자 발행 ' || NEW.completed_count || '건 완료되었습니다',
    json_build_object(
      'submission_id', NEW.submission_id,
      'submission_type', 'cafe_marketing_submissions',
      'date', NEW.record_date,
      'count', NEW.completed_count
    ),
    v_client_id,
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cafe_daily_record_trigger ON cafe_marketing_daily_records;
CREATE TRIGGER cafe_daily_record_trigger
AFTER INSERT ON cafe_marketing_daily_records
FOR EACH ROW EXECUTE FUNCTION notify_cafe_daily_record();

-- ======================
-- 5. 포인트 충전 요청 알림 (이미 존재하는 테이블 확인)
-- ======================

-- 포인트 충전 요청 생성 알림 (관리자에게)
CREATE OR REPLACE FUNCTION notify_charge_request_created()
RETURNS trigger AS $$
DECLARE
  v_company_name VARCHAR(200);
BEGIN
  SELECT company_name INTO v_company_name
  FROM clients WHERE id = NEW.client_id;

  INSERT INTO notifications (type, title, message, data, recipient_role)
  VALUES (
    'charge_request_created',
    '포인트 충전 요청',
    v_company_name || '에서 ' || NEW.amount || ' 포인트 충전을 요청했습니다',
    json_build_object(
      'charge_request_id', NEW.id,
      'client_id', NEW.client_id,
      'company_name', v_company_name,
      'requested_amount', NEW.amount
    ),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 포인트 충전 요청 상태 변경 알림 (거래처에게)
CREATE OR REPLACE FUNCTION notify_charge_request_status_changed()
RETURNS trigger AS $$
DECLARE
  status_text TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'pending' THEN status_text := '대기중';
    WHEN 'approved' THEN status_text := '승인됨';
    WHEN 'rejected' THEN status_text := '거절됨';
    ELSE status_text := NEW.status;
  END CASE;

  INSERT INTO notifications (type, title, message, data, recipient_id, recipient_role)
  VALUES (
    'charge_request_status_changed',
    '포인트 충전 요청 처리',
    '포인트 충전 요청이 ' || status_text,
    json_build_object(
      'charge_request_id', NEW.id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'requested_amount', NEW.amount,
      'rejection_reason', NEW.rejection_reason
    ),
    NEW.client_id,
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 테이블이 존재하는 경우에만 트리거 생성
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_charge_requests') THEN
    DROP TRIGGER IF EXISTS charge_request_created_trigger ON point_charge_requests;
    CREATE TRIGGER charge_request_created_trigger
    AFTER INSERT ON point_charge_requests
    FOR EACH ROW EXECUTE FUNCTION notify_charge_request_created();

    DROP TRIGGER IF EXISTS charge_request_status_changed_trigger ON point_charge_requests;
    CREATE TRIGGER charge_request_status_changed_trigger
    AFTER UPDATE ON point_charge_requests
    FOR EACH ROW EXECUTE FUNCTION notify_charge_request_status_changed();
  END IF;
END $$;

-- ======================
-- 6. 완료
-- ======================

SELECT '=== Announcements and Notification Triggers Completed ===' AS info;

SELECT COUNT(*) AS "공지사항 테이블 생성" FROM information_schema.tables WHERE table_name = 'announcements';
SELECT COUNT(*) AS "알림 트리거 생성" FROM information_schema.triggers WHERE trigger_name LIKE '%notification%' OR trigger_name LIKE '%notify%';

