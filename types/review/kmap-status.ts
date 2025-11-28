export interface KakaomapSubmission {
  id: string;
  company_name: string;
  kakaomap_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  script_confirmed: boolean;
  total_points: number;
  status: 'pending' | 'waiting_content' | 'review' | 'revision_requested' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  start_date?: string;
  content_items_count?: number;
  unread_messages_count?: number;
  actual_count_total?: number;
  progress_percentage?: number;
  uploaded_images?: UploadedImage[];
  uploaded_script?: string;
  messages?: Message[];
}

export interface UploadedImage {
  id: string;
  url: string;
  uploaded_at: string;
  approved: boolean;
  revision_note?: string;
}

export interface Message {
  id: string;
  sender: 'admin' | 'client';
  sender_name: string;
  content: string;
  created_at: string;
}

export interface StatusStats {
  total: number;
  in_progress: number;
  completed: number;
}

