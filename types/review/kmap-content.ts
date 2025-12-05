export interface ContentItem {
  id: string;
  upload_order: number;
  image_url?: string;
  script_text?: string;
  review_status: 'pending' | 'approved' | 'revision_requested';
  has_been_revised: boolean;
  created_at: string;
}

export interface KmapSubmission {
  id: string;
  company_name: string;
  kakaomap_url: string;
  total_count: number;
}

export interface Feedback {
  id: string;
  message: string;
  sender_type: 'admin' | 'client';
  sender_name: string;
  created_at: string;
}

export type ContentFilter = 'all' | 'pending' | 'approved' | 'revised';











