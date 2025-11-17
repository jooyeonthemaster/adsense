-- Remove minimum 30 count constraint from receipt_review_submissions
-- Allow clients to submit from 1 count (based on client requirements)

ALTER TABLE receipt_review_submissions
DROP CONSTRAINT IF EXISTS receipt_review_submissions_total_count_check;

-- Add new constraint: minimum 1 count
ALTER TABLE receipt_review_submissions
ADD CONSTRAINT receipt_review_submissions_total_count_check CHECK (total_count >= 1);
