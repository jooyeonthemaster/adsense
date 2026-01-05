// 카카오맵 리뷰 상태 관련 타입 정의

export interface StatusStats {
  total: number;
  in_progress: number;
  completed: number;
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
  sender_type: 'client' | 'admin';
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
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
  status: string;
  created_at: string;
  updated_at: string;
  type: 'kakaomap';

  // 추가 필드
  completed_count?: number;
  has_photo?: boolean;
  script_confirmed?: boolean;
  uploaded_images?: UploadedImage[];
  uploaded_script?: string;
}