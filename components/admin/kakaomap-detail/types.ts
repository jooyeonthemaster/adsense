export interface KakaomapReviewDetail {
  id: string;
  client_id: string;
  submission_number: string;
  company_name: string;
  kakaomap_url: string;
  daily_count: number;
  total_count: number;
  total_days: number;
  has_photo: boolean;
  photo_ratio: number;
  star_rating: string;
  script_type: string;
  guide_text: string | null;
  total_points: number;
  status: string;
  created_at: string;
  business_license_url?: string;
  photo_urls?: string[];
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  };
}

export interface DailyRecord {
  date: string;
  actual_count: number;
  notes?: string;
}
