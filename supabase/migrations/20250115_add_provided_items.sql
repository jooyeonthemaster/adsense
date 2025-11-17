-- Add provided_items field to experience_submissions
ALTER TABLE experience_submissions
ADD COLUMN IF NOT EXISTS provided_items TEXT;

COMMENT ON COLUMN experience_submissions.provided_items IS 'Items/services provided to experience team (e.g., 2인 식사권, 제품 1개 등)';
