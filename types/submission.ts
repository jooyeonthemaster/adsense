// Submission types for all product categories

export type SubmissionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface PlaceSubmission {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_days: number;
  total_points: number;
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  type: 'place';
}

export interface ReceiptSubmission {
  id: string;
  client_id: string;
  company_name: string;
  naver_place_url: string;
  total_count: number;
  total_points: number;
  business_license_url: string | null;
  photo_urls: string[] | null;
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  type: 'receipt';
}

export interface KakaomapSubmission {
  id: string;
  client_id: string;
  company_name: string;
  kakao_place_url: string;
  total_count: number;
  total_points: number;
  script: string | null;
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  type: 'kakaomap';
}

export interface BlogSubmission {
  id: string;
  client_id: string;
  company_name: string;
  blog_type: 'reviewer' | 'video' | 'automation';
  blog_url: string | null;
  daily_count: number;
  total_days: number;
  total_count: number;
  total_points: number;
  keywords: string | null;
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  type: 'blog';
}

export interface DynamicSubmission {
  id: string;
  client_id: string;
  category_id: string;
  company_name: string;
  form_data: Record<string, any>;
  total_points: number;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  type: 'dynamic';
  product_categories?: {
    name: string;
    slug: string;
  };
}

export type AnySubmission =
  | PlaceSubmission
  | ReceiptSubmission
  | KakaomapSubmission
  | BlogSubmission
  | DynamicSubmission;

export interface SubmissionsResponse {
  submissions: AnySubmission[];
}
