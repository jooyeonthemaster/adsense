-- ============================================
-- 알림 상태값 한글 변환 개선
-- 2026-01-03
-- 목적: 알림 메시지에 영어 상태값이 노출되는 문제 수정
-- ============================================

-- ======================
-- 1. 공통 접수 상태 변경 알림 트리거 업데이트
-- (place, receipt, kakaomap, blog)
-- ======================

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

  -- 상태별 한글 텍스트 (모든 상태 포함)
  CASE NEW.status
    -- 공통 상태
    WHEN 'pending' THEN status_text := '대기';
    WHEN 'approved' THEN status_text := '승인';
    WHEN 'in_progress' THEN status_text := '진행중';
    WHEN 'completed' THEN status_text := '완료';
    WHEN 'cancelled' THEN status_text := '취소';
    -- 카카오맵/리뷰 관련
    WHEN 'waiting_content' THEN status_text := '콘텐츠 대기중';
    WHEN 'review' THEN status_text := '검수중';
    WHEN 'revision_requested' THEN status_text := '수정 요청';
    WHEN 'as_in_progress' THEN status_text := 'AS 진행중';
    -- 중단 관련
    WHEN 'cancellation_requested' THEN status_text := '중단요청';
    WHEN 'cancellation_approved' THEN status_text := '중단승인';
    -- 기타 (fallback은 한글로 표시)
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

-- ======================
-- 2. 체험단 마케팅 상태 변경 알림 트리거 업데이트
-- ======================

CREATE OR REPLACE FUNCTION notify_experience_submission_status_changed()
RETURNS trigger AS $$
DECLARE
  status_text TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- 상태별 한글 텍스트
  CASE NEW.status
    WHEN 'pending' THEN status_text := '대기';
    WHEN 'in_progress' THEN status_text := '진행중';
    WHEN 'completed' THEN status_text := '완료';
    WHEN 'cancelled' THEN status_text := '취소';
    WHEN 'cancellation_requested' THEN status_text := '중단요청';
    WHEN 'cancellation_approved' THEN status_text := '중단승인';
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

-- ======================
-- 3. 카페침투 마케팅 상태 변경 알림 트리거 업데이트
-- ======================

CREATE OR REPLACE FUNCTION notify_cafe_submission_status_changed()
RETURNS trigger AS $$
DECLARE
  status_text TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- 상태별 한글 텍스트
  CASE NEW.status
    WHEN 'pending' THEN status_text := '대기';
    WHEN 'approved' THEN status_text := '승인';
    WHEN 'script_writing' THEN status_text := '원고 작성중';
    WHEN 'script_completed' THEN status_text := '원고 작성완료';
    WHEN 'in_progress' THEN status_text := '진행중';
    WHEN 'completed' THEN status_text := '완료';
    WHEN 'cancelled' THEN status_text := '취소';
    WHEN 'cancellation_requested' THEN status_text := '중단요청';
    WHEN 'cancellation_approved' THEN status_text := '중단승인';
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

-- ======================
-- 완료
-- ======================

SELECT '=== Notification Status Labels Fixed ===' AS info;
