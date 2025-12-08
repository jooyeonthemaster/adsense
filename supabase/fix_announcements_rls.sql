-- ============================================
-- Fix Announcements RLS
-- 목적: announcements 테이블 RLS 비활성화 및 정책 제거
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admins can do everything on announcements" ON announcements;
DROP POLICY IF EXISTS "Clients can view active announcements" ON announcements;

-- RLS 비활성화 (API에서 권한 체크)
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- notifications 테이블도 RLS 비활성화 (API에서 권한 체크)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

SELECT '=== Announcements and Notifications RLS Disabled ===' AS info;












