-- 카카오맵 콘텐츠 아이템에 출처 타입 컬럼 추가
-- 생성일: 2026-01-10
-- 목적: 관리자 페이지 업로드와 데이터 관리 엑셀 업로드 구분하여 리포트 다운로드 제어

ALTER TABLE kakaomap_content_items
ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'admin_upload';

COMMENT ON COLUMN kakaomap_content_items.source_type IS '콘텐츠 출처: admin_upload (관리자 페이지), data_management (데이터 관리 엑셀)';

-- 기존 데이터 처리: 리포트로 사용된 것으로 보이는 데이터는 'data_management'로 변경
-- 조건: review_registered_date가 있는 것 (실제 리포트 데이터)
UPDATE kakaomap_content_items
SET source_type = 'data_management'
WHERE review_registered_date IS NOT NULL;
