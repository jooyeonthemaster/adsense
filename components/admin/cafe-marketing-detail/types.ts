export interface CafeMarketingDetail {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string | null;
  content_type: 'review' | 'info';
  service_type?: 'cafe' | 'community';
  region: string;
  cafe_details: Array<{ name: string; count: number }>;
  total_count: number;
  has_photo: boolean;
  guideline: string | null;
  photo_urls: string[] | null;
  script_status: 'pending' | 'writing' | 'completed';
  script_url: string | null;
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

export interface ContentItem {
  id: string;
  submission_id: string;
  upload_order: number;
  post_title: string | null;
  published_date: string | null;
  status: string | null;
  post_url: string | null;
  writer_id: string | null;
  cafe_name: string | null;
  notes: string | null;
  created_at: string;
}
