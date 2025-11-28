-- Add image_urls column to experience_submissions table
-- For journalist (실계정 기자단) service: stores uploaded image URLs

ALTER TABLE experience_submissions
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN experience_submissions.image_urls IS 'Journalist service: Array of uploaded image URLs from client submission';
