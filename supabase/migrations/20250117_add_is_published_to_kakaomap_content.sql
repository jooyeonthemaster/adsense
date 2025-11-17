-- Add is_published column to kakaomap_content_items table
ALTER TABLE kakaomap_content_items
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kakaomap_content_items_is_published
ON kakaomap_content_items(is_published);

-- Create index for filtering by submission and published status
CREATE INDEX IF NOT EXISTS idx_kakaomap_content_items_submission_published
ON kakaomap_content_items(submission_id, is_published);

COMMENT ON COLUMN kakaomap_content_items.is_published IS '콘텐츠 배포 여부 - true면 유저에게 노출됨';
