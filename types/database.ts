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
  auto_distribution_approved: boolean;
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

export type KakaomapReviewStatus =
  | 'pending'
  | 'waiting_content'
  | 'review'
  | 'revision_requested'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type StarRating = 'mixed' | 'five' | 'four';
export type ScriptType = 'custom' | 'provided';

export type KakaomapReviewSubmission = {
  id: string;
  client_id: string;
  company_name: string;
  kakaomap_url: string;
  daily_count: number;
  total_count: number;
  total_days: number;
  has_photo: boolean;
  photo_ratio: number;
  star_rating: StarRating;
  script_type: ScriptType;
  text_review_count: number;
  photo_review_count: number;
  photo_urls: string[] | null;
  script_urls: string[] | null;
  total_points: number;
  status: KakaomapReviewStatus;
  script_confirmed: boolean;
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentItemStatus = 'pending' | 'approved' | 'rejected';

export type KakaomapContentItem = {
  id: string;
  submission_id: string;
  image_url: string | null;
  script_text: string | null;
  file_name: string | null;
  file_size: number | null;
  status: ContentItemStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  upload_order: number;
  created_at: string;
  updated_at: string;
};

export type RevisionRequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export type KakaomapRevisionRequest = {
  id: string;
  submission_id: string;
  requested_by: string;
  request_content: string;
  request_reason: string | null;
  status: RevisionRequestStatus;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageSenderType = 'admin' | 'client';

export type KakaomapMessage = {
  id: string;
  submission_id: string;
  sender_type: MessageSenderType;
  sender_id: string;
  sender_name: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  is_read: boolean;
  read_at: string | null;
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

export type BlogDistributionDailyRecord = {
  id: string;
  submission_id: string;
  record_date: string;
  completed_count: number;
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

// Experience Marketing Types
export type ExperienceType = 'blog-experience' | 'xiaohongshu' | 'journalist' | 'influencer';

export type ExperienceSubmission = {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string | null;
  experience_type: ExperienceType;
  team_count: number;
  keywords: string[] | null;
  guide_text: string | null;
  available_days: string[] | null;
  available_time_start: string | null;
  available_time_end: string | null;
  provided_items: string | null;
  bloggers_registered: boolean;
  bloggers_selected: boolean;
  schedule_confirmed: boolean;
  client_confirmed: boolean;
  all_published: boolean;
  campaign_completed: boolean;
  total_points: number;
  status: SubmissionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ExperienceBlogger = {
  id: string;
  submission_id: string;
  name: string;
  blog_url: string;
  index_score: number;
  selected_by_client: boolean;
  selected_at: string | null;
  visit_date: string | null;
  visit_time: string | null;
  visit_count: number | null;
  schedule_confirmed: boolean;
  schedule_confirmed_at: string | null;
  client_confirmed: boolean;
  client_confirmed_at: string | null;
  adjustment_requested: boolean;
  adjustment_notes: string | null;
  published: boolean;
  published_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ExperienceKeywordRanking = {
  id: string;
  blogger_id: string;
  keyword: string;
  rank: number;
  checked_at: string;
  created_at: string;
  updated_at: string;
};

export type ExperienceBloggerWithRankings = ExperienceBlogger & {
  keyword_rankings?: ExperienceKeywordRanking[];
};

// Cafe Marketing Types
export type CafeMarketingStatus =
  | 'pending'           // 확인중
  | 'approved'          // 접수완료
  | 'script_writing'    // 원고작성중
  | 'script_completed'  // 원고작업완료
  | 'in_progress'       // 구동중
  | 'completed'         // 완료
  | 'cancelled';        // 중단

export type CafeScriptStatus =
  | 'pending'    // 대기중
  | 'writing'    // 작성중
  | 'completed'; // 완료

export type CafeDetail = {
  name: string;
  count: number;
};

export type CafeMarketingSubmission = {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string | null;
  content_type: ContentType; // 'review' | 'info'
  region: string;
  cafe_details: CafeDetail[]; // 카페별 발행 건수
  total_count: number; // 총 발행 건수
  has_photo: boolean;
  guideline: string | null;
  photo_urls: string[] | null;
  script_status: CafeScriptStatus;
  script_url: string | null;
  total_points: number;
  status: CafeMarketingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CafeMarketingDailyRecord = {
  id: string;
  submission_id: string;
  record_date: string;
  completed_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
