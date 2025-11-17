-- Add available schedule fields to experience_submissions
ALTER TABLE experience_submissions
ADD COLUMN IF NOT EXISTS available_days TEXT[],
ADD COLUMN IF NOT EXISTS available_time_start VARCHAR(20),
ADD COLUMN IF NOT EXISTS available_time_end VARCHAR(20);

COMMENT ON COLUMN experience_submissions.available_days IS 'Client preferred visit days (e.g., [월, 화, 수])';
COMMENT ON COLUMN experience_submissions.available_time_start IS 'Client preferred visit start time (e.g., 11:00)';
COMMENT ON COLUMN experience_submissions.available_time_end IS 'Client preferred visit end time (e.g., 21:00)';
