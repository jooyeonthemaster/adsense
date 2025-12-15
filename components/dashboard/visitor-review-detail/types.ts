export interface ContentItemExtended {
  id: string;
  upload_order: number;
  script_text: string | null;
  review_registered_date: string | null;
  receipt_date: string | null;
  review_status: string;
  review_link: string | null;
  review_id: string | null;
  created_at: string;
}

export interface ReceiptReviewDetail {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  has_script: boolean;
  guide_text: string | null;
  total_points: number;
  status: string;
  created_at: string;
  business_license_url?: string;
  photo_urls?: string[];
  actual_count_total?: number;
  progress_percentage?: number;
}

export interface DailyRecord {
  date: string;
  actual_count: number;
  notes?: string;
}
