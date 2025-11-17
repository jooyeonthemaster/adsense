-- ============================================
-- Cafe Marketing Disable RLS
-- 2025-01-18
-- 목적: cafe_marketing_submissions 테이블의 RLS 비활성화
--       (다른 메인 submission 테이블들과 동일하게 RLS 없이 운영)
-- ============================================

-- RLS 비활성화 (다른 submission 테이블들과 동일하게)
ALTER TABLE cafe_marketing_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_marketing_daily_records DISABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Admins can access all cafe marketing submissions" ON cafe_marketing_submissions;
DROP POLICY IF EXISTS "Clients can view their cafe marketing submissions" ON cafe_marketing_submissions;
DROP POLICY IF EXISTS "Clients can create their cafe marketing submissions" ON cafe_marketing_submissions;
DROP POLICY IF EXISTS "Admins can access all cafe marketing daily records" ON cafe_marketing_daily_records;
DROP POLICY IF EXISTS "Clients can view their cafe marketing daily records" ON cafe_marketing_daily_records;

SELECT '=== Cafe Marketing RLS Disabled (Following Other Submission Tables Pattern) ===' AS info;
