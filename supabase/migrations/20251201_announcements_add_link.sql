-- ============================================
-- Add link fields to announcements table
-- 2025-12-01
-- 목적: 공지사항에 링크 첨부 기능 추가
-- ============================================

-- 링크 URL 컬럼 추가
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_url TEXT;

-- 링크 텍스트 컬럼 추가 (버튼/링크에 표시될 텍스트)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text VARCHAR(100);

-- 코멘트 추가
COMMENT ON COLUMN announcements.link_url IS '공지사항에 첨부할 외부/내부 링크 URL';
COMMENT ON COLUMN announcements.link_text IS '링크 버튼에 표시될 텍스트 (예: 자세히 보기, 바로가기)';
