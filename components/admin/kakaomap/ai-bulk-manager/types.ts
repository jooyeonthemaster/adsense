import {
  BusinessType,
  GeneratedReview,
  RatioSliderConfig,
  StoreInfo,
  DEFAULT_LENGTH_RATIOS,
  DEFAULT_TONE_RATIOS,
  DEFAULT_EMOJI_RATIOS,
  DEFAULT_STORE_INFO,
} from '@/types/review/ai-generation';

// 프로세스 단계
export type ProcessStep =
  | 'idle'        // 대기 중
  | 'config'      // 설정 중
  | 'generating'  // 생성 중
  | 'preview'     // 미리보기
  | 'uploading'   // 업로드 중
  | 'publishing'; // 검수 요청 중

// 정렬 옵션
export type SortBy = 'remaining' | 'created' | 'company';

// AI 생성 대기 접수건 요약 정보
export interface AISubmissionSummary {
  id: string;
  submission_number: string;
  company_name: string;
  client_name: string;
  client_id: string;
  total_count: number;
  content_items_count: number;
  remaining_count: number;
  created_at: string;
  status: string;
  has_photo: boolean;
  photo_ratio: number;
  star_rating: string;
}

// AI 설정 상태
export interface AIConfigState {
  keyword: string;
  count: number;
  businessType: BusinessType;
  lengthRatios: RatioSliderConfig[];
  toneRatios: RatioSliderConfig[];
  emojiRatios: RatioSliderConfig[];
  customPrompt: string;
  storeInfo: StoreInfo;
}

// 각 접수건별 프로세스 상태
export interface SubmissionProcessState {
  step: ProcessStep;
  isExpanded: boolean;

  // 생성 상태
  isGenerating: boolean;
  generationProgress: number;
  generatedReviews: GeneratedReview[];
  generationError: string | null;

  // 설정
  config: AIConfigState;

  // 액션 상태
  isUploading: boolean;
  isPublishing: boolean;
  isSaving: boolean;
}

// 전체 매니저 상태
export interface AIBulkManagerState {
  isLoading: boolean;
  submissions: AISubmissionSummary[];
  submissionStates: Map<string, SubmissionProcessState>;

  // 필터
  clientFilter: string;
  sortBy: SortBy;
}

// 통계 정보
export interface AIBulkStats {
  totalSubmissions: number;
  totalRemaining: number;
  inProgress: number;
  byClient: Record<string, { count: number; remaining: number }>;
}

// 기본 설정 생성 헬퍼
export function createDefaultConfig(
  companyName: string,
  remainingCount: number
): AIConfigState {
  const count = Math.max(1, Math.min(10, remainingCount));

  return {
    keyword: companyName,
    count,
    businessType: 'general',
    lengthRatios: recalculateRatios(DEFAULT_LENGTH_RATIOS, count),
    toneRatios: recalculateRatios(DEFAULT_TONE_RATIOS, count),
    emojiRatios: recalculateRatios(DEFAULT_EMOJI_RATIOS, count),
    customPrompt: '',
    storeInfo: { ...DEFAULT_STORE_INFO, name: companyName },
  };
}

// 기본 프로세스 상태 생성 헬퍼
export function createDefaultProcessState(
  submission: AISubmissionSummary
): SubmissionProcessState {
  return {
    step: 'idle',
    isExpanded: false,
    isGenerating: false,
    generationProgress: 0,
    generatedReviews: [],
    generationError: null,
    config: createDefaultConfig(submission.company_name, submission.remaining_count),
    isUploading: false,
    isPublishing: false,
    isSaving: false,
  };
}

// 비율 재계산 헬퍼
export function recalculateRatios(
  items: RatioSliderConfig[],
  newTotalCount: number
): RatioSliderConfig[] {
  if (newTotalCount <= 0) {
    return items.map((item) => ({ ...item, count: 0 }));
  }

  const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
  const result: RatioSliderConfig[] = [];
  let assignedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i === items.length - 1) {
      result.push({ ...item, count: Math.max(0, newTotalCount - assignedCount) });
    } else {
      const calculatedCount = Math.round((item.percentage / totalPercentage) * newTotalCount);
      result.push({ ...item, count: calculatedCount });
      assignedCount += calculatedCount;
    }
  }

  return result;
}

// 상태별 표시 설정
export const STEP_CONFIG: Record<ProcessStep, { label: string; color: string; icon: string }> = {
  idle: { label: '대기 중', color: 'bg-slate-100 text-slate-700', icon: 'circle' },
  config: { label: '설정 중', color: 'bg-blue-100 text-blue-700', icon: 'settings' },
  generating: { label: '생성 중', color: 'bg-amber-100 text-amber-700', icon: 'loader' },
  preview: { label: '미리보기', color: 'bg-green-100 text-green-700', icon: 'eye' },
  uploading: { label: '업로드 중', color: 'bg-blue-100 text-blue-700', icon: 'upload' },
  publishing: { label: '검수 요청 중', color: 'bg-purple-100 text-purple-700', icon: 'send' },
};
