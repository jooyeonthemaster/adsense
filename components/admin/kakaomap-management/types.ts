export interface KakaomapSubmission {
  id: string;
  submission_number: string;
  company_name: string;
  kakaomap_url: string;
  total_count: number;
  daily_count: number;
  has_photo: boolean;
  photo_ratio: number;
  star_rating: string;
  script_type: string;
  total_points: number;
  status: string;
  created_at: string;
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  };
  content_items_count: number;
  completed_count: number;
  unread_messages_count: number;
  pending_revision_count: number;
  actual_count_total: number;
}

export interface GroupedData {
  name: string;
  items: KakaomapSubmission[];
  totalCost: number;
  count: number;
  inProgress: number;
  completed: number;
  needsUpload: number;
  unreadMessages: number;
}

export interface KakaomapStats {
  total: number;
  needs_upload: number;
  needs_review: number;
  in_progress: number;
  completed: number;
  total_cost: number;
  unread_messages: number;
}

export type GroupByType = 'list' | 'client';
export type ContentFilter = 'all' | 'needs_upload' | 'needs_review' | 'has_messages' | 'has_revision';
