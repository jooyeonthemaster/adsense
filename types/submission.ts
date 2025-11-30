// Submission types for all product categories

export type SubmissionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'as_in_progress';

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

// Unified submission type for all products view
export type ProductType = 'place' | 'receipt' | 'kakaomap' | 'blog' | 'cafe' | 'experience';

export interface UnifiedSubmission {
  id: string;
  product_type: ProductType;
  company_name: string;
  status: SubmissionStatus;
  total_points: number;
  created_at: string;
  updated_at: string;

  // Product-specific fields
  place_url?: string;
  place_mid?: string;
  daily_count?: number;
  total_days?: number;
  current_day?: number;
  total_count?: number;

  // Blog-specific
  distribution_type?: 'reviewer' | 'video' | 'automation';
  keywords?: string[];

  // Cafe-specific
  cafe_list?: string[];
  has_photo?: boolean;
  script_status?: string;
  script_url?: string;

  // Experience-specific
  experience_type?: string;
  team_count?: number;
  bloggers_registered?: boolean;
  bloggers_selected?: boolean;
  schedule_confirmed?: boolean;
  client_confirmed?: boolean;
  all_published?: boolean;
  campaign_completed?: boolean;

  // Common optional fields
  notes?: string;
  start_date?: string;
}

export interface AllSubmissionsStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total_cost: number;
  by_product: {
    place: number;
    receipt: number;
    kakaomap: number;
    blog: number;
    cafe: number;
    experience: number;
  };
}

export interface AllSubmissionsResponse {
  submissions: UnifiedSubmission[];
  stats: AllSubmissionsStats;
}
