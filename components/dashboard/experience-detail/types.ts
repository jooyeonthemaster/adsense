export interface ExperienceSubmission {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string | null;
  experience_type: string;
  team_count: number;
  keywords: string[] | null;
  guide_text: string | null;
  bloggers_registered: boolean;
  bloggers_selected: boolean;
  schedule_confirmed: boolean;
  client_confirmed: boolean;
  all_published: boolean;
  campaign_completed: boolean;
  total_points: number;
  status: string;
  created_at: string;
}

export interface KeywordRanking {
  keyword: string;
  rank: number;
  checked_at: string;
}

export interface ExperienceBlogger {
  id: string;
  name: string;
  blog_url: string;
  index_score: number;
  selected_by_client: boolean;
  visit_date: string | null;
  visit_time: string | null;
  visit_count: number | null;
  client_confirmed: boolean;
  published: boolean;
  published_url: string | null;
  keyword_rankings?: KeywordRanking[];
}

export interface WorkflowStep {
  number: number;
  label: string;
  description: string;
}

export type BloggerSortBy = 'index-high' | 'index-low' | 'name';
export type BloggerFilter = 'all' | '700+' | '800+' | '900+';
export type StepStatus = 'completed' | 'current' | 'upcoming';
