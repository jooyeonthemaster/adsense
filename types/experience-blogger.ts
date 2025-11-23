// 체험단 블로거 관리 타입 정의

export interface ExperienceBlogger {
  id: string;
  name: string;
  blog_url: string;
  index_score: number;
  selected_by_client: boolean;
  selected_at: string | null;
  visit_date: string | null;
  visit_time: string | null;
  visit_count: number | null;
  schedule_confirmed: boolean;
  client_confirmed: boolean;
  adjustment_requested: boolean;
  adjustment_notes: string | null;
  published: boolean;
  published_url: string | null;
  published_at: string | null;
  keyword_rankings?: { id: string; keyword: string; rank: number }[];
}

export interface ExperienceSubmission {
  id: string;
  company_name: string;
  place_url: string | null;
  experience_type: string;
  team_count: number;
  keywords: string[];
  guide_text: string | null;
  available_days: string[] | null;
  available_time_start: string | null;
  available_time_end: string | null;
  provided_items: string | null;
  image_urls: string[] | null;
  total_points: number;
  status: string;
  bloggers_registered: boolean;
  bloggers_selected: boolean;
  schedule_confirmed: boolean;
  client_confirmed: boolean;
  all_published: boolean;
  campaign_completed: boolean;
  created_at: string;
}

export interface NewBlogger {
  name: string;
  blog_url: string;
  index_score: number;
}

export interface BloggerSchedule {
  blogger_id: string;
  visit_date: string;
  visit_time: string;
  visit_count: number;
}

export interface KeywordRanking {
  keyword: string;
  rank: number;
}

/**
 * 체험단 타입별 워크플로우 설정
 */
export interface WorkflowConfig {
  hasSelection: boolean;           // Step 2: 블로거 선택 단계 존재 여부
  hasClientConfirm: boolean;       // Step 4: 클라이언트 확인 단계 존재 여부
  hasKeywordRanking: boolean;      // Step 6: 키워드 순위 체크 존재 여부
  scheduleAtRegistration: boolean; // Step 1에서 일정 입력 (xiaohongshu, journalist)
  maxTeams?: number;               // 최대 팀 수 제한 (influencer: 10)
}

/**
 * 체험단 타입별 워크플로우 설정
 */
export const WORKFLOW_CONFIG: Record<string, WorkflowConfig> = {
  'blog-experience': {
    hasSelection: true,
    hasClientConfirm: true,
    hasKeywordRanking: true,
    scheduleAtRegistration: false,
  },
  'xiaohongshu': {
    hasSelection: false,
    hasClientConfirm: true,
    hasKeywordRanking: false,
    scheduleAtRegistration: true,
  },
  'journalist': {
    hasSelection: false,
    hasClientConfirm: false,
    hasKeywordRanking: false,
    scheduleAtRegistration: true,
  },
  'influencer': {
    hasSelection: false,
    hasClientConfirm: true,
    hasKeywordRanking: true,
    scheduleAtRegistration: false,
    maxTeams: 10,
  },
};

/**
 * 체험단 타입별 워크플로우 단계 정의
 */
export type WorkflowStep =
  | 'register'           // Step 1: 블로거 등록
  | 'selection'          // Step 2: 블로거 선택 (blog만)
  | 'schedule'           // Step 3: 일정 입력
  | 'client_confirm'     // Step 4: 클라이언트 확인 (journalist 제외)
  | 'publish'            // Step 5: 발행
  | 'keyword_ranking'    // Step 6: 키워드 순위 (blog, influencer)
  | 'complete';          // Step 7: 완료

