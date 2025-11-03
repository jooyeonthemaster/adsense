-- ============================================
-- AS 요청 테이블에 expected_count, actual_count 컬럼 추가
-- ============================================

-- 1. expected_count 컬럼 추가 (예정 수량)
ALTER TABLE as_requests
  ADD COLUMN IF NOT EXISTS expected_count INTEGER;

-- 2. actual_count 컬럼 추가 (실제 달성 수량)
ALTER TABLE as_requests
  ADD COLUMN IF NOT EXISTS actual_count INTEGER;

-- 3. 기존 데이터에 대한 처리 (NULL 값이 있을 경우 0으로 설정)
UPDATE as_requests
  SET expected_count = 0
  WHERE expected_count IS NULL;

UPDATE as_requests
  SET actual_count = 0
  WHERE actual_count IS NULL;

-- 4. NOT NULL 제약조건 추가
ALTER TABLE as_requests
  ALTER COLUMN expected_count SET NOT NULL;

ALTER TABLE as_requests
  ALTER COLUMN actual_count SET NOT NULL;

-- 5. CHECK 제약조건 추가 (예정 수량은 실제 수량보다 커야 함)
ALTER TABLE as_requests
  ADD CONSTRAINT check_counts_valid
  CHECK (expected_count > 0 AND actual_count >= 0 AND expected_count >= actual_count);

-- 6. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_as_requests_counts
  ON as_requests(expected_count, actual_count);

-- 완료
COMMENT ON COLUMN as_requests.expected_count IS '예정 수량 (접수 시 계획된 목표 수량)';
COMMENT ON COLUMN as_requests.actual_count IS '실제 달성 수량 (AS 신청 시점의 실제 완료 수량)';