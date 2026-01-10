-- 카카오맵 리뷰 접수에 가이드 텍스트 컬럼 추가
-- 생성일: 2026-01-10
-- 목적: 신청 시 작성한 가이드를 관리자 페이지에서 확인 가능하도록 함

ALTER TABLE kakaomap_review_submissions
ADD COLUMN IF NOT EXISTS guide_text TEXT;

COMMENT ON COLUMN kakaomap_review_submissions.guide_text IS '리뷰 작성 가이드 (선택)';
