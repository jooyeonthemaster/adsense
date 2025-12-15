export interface BlogDistributionDetail {
  id: string;
  client_id: string;
  submission_number: string;
  company_name: string;
  distribution_type: string;
  content_type: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  total_days: number;
  start_date: string | null;
  end_date: string | null;
  keywords: string[] | null;
  guide_text: string | null;
  account_id: string | null;
  charge_count: number | null;
  total_points: number;
  status: string;
  created_at: string;
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  };
}

export interface DailyRecord {
  record_date: string;
  completed_count: number;
  notes?: string;
}

export interface BlogContentItem {
  id: string;
  submission_id: string;
  upload_order: number;
  blog_url: string | null;
  blog_title: string | null;
  keyword: string | null;
  published_date: string | null;
  notes: string | null;
  status: string | null;
  blog_id: string | null;
  created_at: string;
}
