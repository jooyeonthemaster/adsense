-- Experience Marketing Bloggers Table
-- Manages blogger information for experience marketing campaigns

CREATE TABLE IF NOT EXISTS experience_bloggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL,

  -- Blogger Information (Step 1: Admin registers)
  name VARCHAR(100) NOT NULL,
  blog_url TEXT NOT NULL,
  index_score INTEGER NOT NULL CHECK (index_score >= 0),

  -- Client Selection (Step 2: Client selects)
  selected_by_client BOOLEAN DEFAULT false,
  selected_at TIMESTAMP WITH TIME ZONE,

  -- Visit Schedule (Step 3: Admin inputs schedule)
  visit_date DATE,
  visit_time VARCHAR(20),
  visit_count INTEGER CHECK (visit_count > 0),
  schedule_confirmed BOOLEAN DEFAULT false,
  schedule_confirmed_at TIMESTAMP WITH TIME ZONE,

  -- Client Confirmation (Step 4: Client confirms or requests adjustment)
  client_confirmed BOOLEAN DEFAULT false,
  client_confirmed_at TIMESTAMP WITH TIME ZONE,
  adjustment_requested BOOLEAN DEFAULT false,
  adjustment_notes TEXT,

  -- Publishing Status (Step 5: Blogger publishes content)
  published BOOLEAN DEFAULT false,
  published_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keyword Rankings Table
-- Tracks keyword rankings for published content (Step 6)
CREATE TABLE IF NOT EXISTS experience_keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blogger_id UUID NOT NULL REFERENCES experience_bloggers(id) ON DELETE CASCADE,

  keyword VARCHAR(200) NOT NULL,
  rank INTEGER NOT NULL CHECK (rank > 0),

  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experience Submissions Table Extension
-- Add columns to track the overall campaign status
CREATE TABLE IF NOT EXISTS experience_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,

  -- Basic Information
  company_name VARCHAR(200) NOT NULL,
  place_url TEXT,

  -- Campaign Details
  experience_type VARCHAR(50) NOT NULL CHECK (experience_type IN ('blog-experience', 'xiaohongshu', 'journalist', 'influencer')),
  team_count INTEGER NOT NULL CHECK (team_count > 0),
  keywords TEXT[], -- Array of target keywords
  guide_text TEXT,

  -- Workflow Status
  bloggers_registered BOOLEAN DEFAULT false, -- Admin registered blogger list
  bloggers_selected BOOLEAN DEFAULT false,   -- Client selected bloggers
  schedule_confirmed BOOLEAN DEFAULT false,  -- Admin added schedule
  client_confirmed BOOLEAN DEFAULT false,    -- Client confirmed final details
  all_published BOOLEAN DEFAULT false,       -- All bloggers published content
  campaign_completed BOOLEAN DEFAULT false,  -- All publish links filled (Step 7)

  -- Pricing
  total_points INTEGER NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_experience_bloggers_submission ON experience_bloggers(submission_id);
CREATE INDEX IF NOT EXISTS idx_experience_bloggers_selected ON experience_bloggers(selected_by_client);
CREATE INDEX IF NOT EXISTS idx_experience_bloggers_published ON experience_bloggers(published);
CREATE INDEX IF NOT EXISTS idx_experience_keyword_rankings_blogger ON experience_keyword_rankings(blogger_id);
CREATE INDEX IF NOT EXISTS idx_experience_submissions_client ON experience_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_experience_submissions_status ON experience_submissions(status);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_experience_bloggers_updated_at ON experience_bloggers;
CREATE TRIGGER update_experience_bloggers_updated_at BEFORE UPDATE ON experience_bloggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_experience_keyword_rankings_updated_at ON experience_keyword_rankings;
CREATE TRIGGER update_experience_keyword_rankings_updated_at BEFORE UPDATE ON experience_keyword_rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_experience_submissions_updated_at ON experience_submissions;
CREATE TRIGGER update_experience_submissions_updated_at BEFORE UPDATE ON experience_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE experience_bloggers IS 'Blogger information for experience marketing campaigns with full workflow tracking';
COMMENT ON TABLE experience_keyword_rankings IS 'Keyword ranking data for published blogger content';
COMMENT ON TABLE experience_submissions IS 'Main experience marketing submissions with campaign workflow status';

COMMENT ON COLUMN experience_bloggers.selected_by_client IS 'Step 2: Client checkbox selection';
COMMENT ON COLUMN experience_bloggers.schedule_confirmed IS 'Step 3: Admin added visit schedule';
COMMENT ON COLUMN experience_bloggers.client_confirmed IS 'Step 4: Client confirmed or requested adjustment';
COMMENT ON COLUMN experience_bloggers.published IS 'Step 5: Blogger published content';
COMMENT ON COLUMN experience_submissions.campaign_completed IS 'Step 7: All publish links filled, campaign ends';
