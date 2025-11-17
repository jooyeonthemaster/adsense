-- ============================================
-- Cafe Marketing RLS Policies
-- 2025-01-18
-- 목적: cafe_marketing_submissions 테이블에 RLS 정책 추가
-- ============================================

-- RLS 활성화
ALTER TABLE cafe_marketing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_marketing_daily_records ENABLE ROW LEVEL SECURITY;

-- ====================
-- cafe_marketing_submissions 정책
-- ====================

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "Admins can access all cafe marketing submissions"
  ON cafe_marketing_submissions FOR ALL
  USING (true);

-- 클라이언트는 자신의 데이터만 조회 가능
CREATE POLICY "Clients can view their cafe marketing submissions"
  ON cafe_marketing_submissions FOR SELECT
  USING (client_id = auth.uid());

-- 클라이언트는 자신의 데이터만 생성 가능
CREATE POLICY "Clients can create their cafe marketing submissions"
  ON cafe_marketing_submissions FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- ====================
-- cafe_marketing_daily_records 정책
-- ====================

-- 관리자는 모든 일일 기록 접근 가능
CREATE POLICY "Admins can access all cafe marketing daily records"
  ON cafe_marketing_daily_records FOR ALL
  USING (true);

-- 클라이언트는 자신의 submission에 대한 일일 기록만 조회 가능
CREATE POLICY "Clients can view their cafe marketing daily records"
  ON cafe_marketing_daily_records FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM cafe_marketing_submissions WHERE client_id = auth.uid()
    )
  );

SELECT '=== Cafe Marketing RLS Policies Created ===' AS info;
