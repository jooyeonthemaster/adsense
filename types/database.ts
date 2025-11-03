export type Client = {
  id: string;
  username: string;
  password: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Admin = {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type ClientProductPrice = {
  id: string;
  client_id: string;
  category_id: string;
  price_per_unit: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type SubmissionStatus = 'pending' | 'approved' | 'completed' | 'cancelled';

export type PlaceSubmission = {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_days: number;
  total_points: number;
  status: SubmissionStatus;
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ReceiptReviewSubmission = {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  has_script: boolean;
  guide_text: string | null;
  business_license_url: string | null;
  sample_receipt_url: string | null;
  photo_urls: string[] | null;
  total_points: number;
  status: SubmissionStatus;
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type KakaomapReviewSubmission = {
  id: string;
  client_id: string;
  company_name: string;
  kakaomap_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  text_review_count: number;
  photo_review_count: number;
  photo_urls: string[] | null;
  script_urls: string[] | null;
  total_points: number;
  status: SubmissionStatus;
  script_confirmed: boolean;
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogDistributionType = 'reviewer' | 'video' | 'automation';
export type ContentType = 'review' | 'info';

export type BlogDistributionSubmission = {
  id: string;
  client_id: string;
  distribution_type: BlogDistributionType;
  content_type: ContentType;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  keywords: string[] | null;
  guide_text: string | null;
  photo_urls: string[] | null;
  script_urls: string[] | null;
  account_id: string | null;
  charge_count: number | null;
  total_points: number;
  status: SubmissionStatus;
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionType = 'charge' | 'deduct' | 'refund';

export type PointTransaction = {
  id: string;
  client_id: string;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

export type Report = {
  id: string;
  submission_type: string;
  submission_id: string;
  file_url: string;
  file_name: string;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type ASRequestStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

export type ASRequest = {
  id: string;
  client_id: string;
  submission_type: string;
  submission_id: string;
  missing_rate: number;
  description: string;
  status: ASRequestStatus;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};
