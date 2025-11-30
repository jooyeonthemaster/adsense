/**
 * 통합 접수 타입 - 모든 상품의 필드를 포함
 */
export interface UnifiedSubmission {
  // 공통 필드
  id: string;
  client_id: string;
  company_name: string;
  total_points: number;
  status: string;
  created_at: string;
  type: 'place' | 'receipt' | 'kakaomap' | 'blog' | 'cafe' | 'experience';
  clients?: { company_name: string };

  // 진행률
  progress_percentage?: number;
  completed_count?: number;

  // Place (리워드) 전용
  daily_count?: number;
  total_days?: number;
  current_day?: number;

  // Receipt (영수증 리뷰) 전용
  total_count?: number;
  has_photo?: boolean;
  content_items_count?: number;
  unread_messages_count?: number;
  pending_revision_count?: number;
  actual_count_total?: number;

  // Kakaomap (카카오맵) 전용
  star_rating?: number;
  photo_ratio?: number;

  // Blog (블로그 배포) 전용
  distribution_type?: 'reviewer' | 'video' | 'automation';
  keywords?: string[];

  // Cafe (카페 침투) 전용
  region?: string;
  script_status?: 'pending' | 'writing' | 'completed';
  cafe_details?: Array<{ cafe_name: string; post_count: number }>;

  // Experience (체험단) 전용
  experience_type?: 'blog-experience' | 'xiaohongshu' | 'journalist' | 'influencer';
  team_count?: number;
  bloggers_registered?: boolean;
  bloggers_selected?: boolean;
  schedule_confirmed?: boolean;
  client_confirmed?: boolean;
  all_published?: boolean;
  campaign_completed?: boolean;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: '확인중',
  in_progress: '구동중',
  completed: '완료',
  cancelled: '취소',
  waiting_content: '콘텐츠 대기',
  review: '검토중',
  revision_requested: '수정 요청',
  approved: '승인됨',
  script_writing: '원고 작성중',
  script_completed: '원고 완료',
  as_in_progress: 'AS 진행 중',
};

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  waiting_content: 'outline',
  review: 'default',
  revision_requested: 'destructive',
  approved: 'default',
  script_writing: 'default',
  script_completed: 'secondary',
  as_in_progress: 'default',
};

export const TYPE_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
  cafe: '카페 침투',
  experience: '체험단 마케팅',
};






