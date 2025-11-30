// AI 리뷰 생성 관련 타입 정의

// ============================================
// 비율 설정 타입
// ============================================

export interface RatioSetting {
  value: string;
  percentage: number;
}

// 글자수 옵션
export type LengthOption = 'short' | 'medium' | 'long';

export const LENGTH_OPTIONS: Record<LengthOption, { label: string; range: string; min: number; max: number }> = {
  short: { label: '짧은', range: '100-200자', min: 100, max: 200 },
  medium: { label: '중간', range: '200-400자', min: 200, max: 400 },
  long: { label: '긴', range: '400-600자', min: 400, max: 600 },
};

// 말투 타겟
export type ToneTarget = '20s' | '30s' | '40s' | '50s' | 'mz';

export const TONE_OPTIONS: Record<ToneTarget, { label: string; description: string }> = {
  '20s': { label: '20대', description: '친근하고 캐주얼한 말투, 신조어 사용' },
  '30s': { label: '30대', description: '자연스럽고 균형 잡힌 말투' },
  '40s': { label: '40대', description: '차분하고 신뢰감 있는 말투' },
  '50s': { label: '50대', description: '정중하고 격식 있는 말투' },
  'mz': { label: 'MZ세대', description: '트렌디하고 감각적인 말투, 밈 활용' },
};

// 이모티콘 여부
export type EmojiOption = 'with' | 'without';

export const EMOJI_OPTIONS: Record<EmojiOption, { label: string; description: string }> = {
  with: { label: '포함', description: '적절한 이모티콘/이모지 사용' },
  without: { label: '미포함', description: '텍스트만 사용' },
};

// ============================================
// 매장 정보 타입
// ============================================

export interface StoreInfo {
  // 기본 정보
  name: string;
  address?: string;
  phone?: string;

  // 메뉴/서비스 정보 (음식점, 카페 등)
  menu_items?: string; // 대표 메뉴들 (줄바꿈으로 구분)
  price_range?: string; // 가격대 (예: "1만원~2만원", "저렴", "고급")

  // 분위기/특징
  atmosphere?: string; // 분위기 설명 (예: "아늑한", "모던한", "가족적인")
  highlights?: string; // 특장점 (줄바꿈으로 구분)

  // 키워드 설정
  must_include_keywords?: string; // 반드시 포함할 키워드 (쉼표로 구분)
  avoid_keywords?: string; // 피해야 할 키워드 (쉼표로 구분)

  // 추가 정보
  additional_info?: string; // 기타 참고 정보
}

// 매장 정보 폼 필드 설정
export const STORE_INFO_FIELDS = {
  menu_items: {
    label: '대표 메뉴/서비스',
    placeholder: '예:\n한우 투뿔 등심 200g - 45,000원\n한우 육회 - 25,000원\n된장찌개 - 8,000원',
    description: '대표 메뉴나 서비스를 줄바꿈으로 구분하여 입력',
    rows: 4,
  },
  price_range: {
    label: '가격대',
    placeholder: '예: 1인 3만원~5만원대',
    description: '대략적인 가격대',
    rows: 1,
  },
  atmosphere: {
    label: '분위기/컨셉',
    placeholder: '예: 고급스럽고 조용한 분위기, 가족 모임에 적합',
    description: '매장 분위기나 컨셉',
    rows: 2,
  },
  highlights: {
    label: '특장점/강점',
    placeholder: '예:\n신선한 한우만 사용\n30년 전통\n무료 주차 가능',
    description: '매장의 특장점을 줄바꿈으로 구분',
    rows: 3,
  },
  must_include_keywords: {
    label: '반드시 포함할 키워드',
    placeholder: '예: 신선한, 투뿔, 가성비, 친절한',
    description: '리뷰에 반드시 포함할 키워드 (쉼표 구분)',
    rows: 1,
  },
  avoid_keywords: {
    label: '피해야 할 키워드',
    placeholder: '예: 비싸다, 줄서서, 협찬',
    description: '리뷰에서 피해야 할 표현 (쉼표 구분)',
    rows: 1,
  },
  additional_info: {
    label: '기타 참고 정보',
    placeholder: '예: 점심 특선 메뉴 있음, 단체석 예약 가능',
    description: 'AI가 참고할 추가 정보',
    rows: 2,
  },
} as const;

// 매장 정보 기본값
export const DEFAULT_STORE_INFO: StoreInfo = {
  name: '',
  address: '',
  phone: '',
  menu_items: '',
  price_range: '',
  atmosphere: '',
  highlights: '',
  must_include_keywords: '',
  avoid_keywords: '',
  additional_info: '',
};

// ============================================
// 업종 타입
// ============================================

export type BusinessType =
  | 'restaurant'      // 음식점
  | 'cafe'            // 카페
  | 'beauty'          // 미용실/네일샵
  | 'hospital'        // 병원/의원
  | 'fitness'         // 헬스/피트니스
  | 'accommodation'   // 숙박
  | 'retail'          // 소매/쇼핑
  | 'education'       // 교육/학원
  | 'pet'             // 펫샵/동물병원
  | 'auto'            // 자동차/정비
  | 'general';        // 일반 업종

export const BUSINESS_TYPE_OPTIONS: Record<BusinessType, { label: string; icon: string }> = {
  restaurant: { label: '음식점', icon: '🍽️' },
  cafe: { label: '카페', icon: '☕' },
  beauty: { label: '미용실/네일샵', icon: '💇' },
  hospital: { label: '병원/의원', icon: '🏥' },
  fitness: { label: '헬스/피트니스', icon: '💪' },
  accommodation: { label: '숙박', icon: '🏨' },
  retail: { label: '소매/쇼핑', icon: '🛍️' },
  education: { label: '교육/학원', icon: '📚' },
  pet: { label: '펫샵/동물병원', icon: '🐾' },
  auto: { label: '자동차/정비', icon: '🚗' },
  general: { label: '일반 업종', icon: '🏢' },
};

// ============================================
// AI 생성 요청/응답 타입
// ============================================

export interface AIReviewGenerateRequest {
  submission_id: string;
  keyword: string;                    // 업체명/키워드
  count: number;                      // 생성 수량
  business_type: BusinessType;        // 업종

  length_ratios: RatioSetting[];      // 글자수 비율
  tone_ratios: RatioSetting[];        // 말투 비율
  emoji_ratios: RatioSetting[];       // 이모티콘 비율

  custom_prompt?: string;             // 커스텀 프롬프트 (선택)
  store_info?: StoreInfo;             // 매장 정보 (선택)
}

// 생성된 리뷰 (미리보기용)
export interface GeneratedReview {
  id: string;                         // 임시 ID (UUID)
  script_text: string;                // 생성된 원고
  length_type: LengthOption;          // 글자수 타입
  tone_type: ToneTarget;              // 말투 타입
  has_emoji: boolean;                 // 이모티콘 포함 여부
  char_count: number;                 // 실제 글자수
  selected: boolean;                  // 저장 선택 여부
  isRegenerating?: boolean;           // 재생성 중 여부
}

export interface AIReviewGenerateResponse {
  success: boolean;
  reviews: GeneratedReview[];
  generation_stats: {
    total_requested: number;
    total_generated: number;
    by_length: Record<LengthOption, number>;
    by_tone: Record<ToneTarget, number>;
    by_emoji: Record<EmojiOption, number>;
  };
  error?: string;
}

// ============================================
// 프롬프트 관리 타입
// ============================================

export interface BusinessPrompt {
  id: string;
  business_type: BusinessType;
  business_name: string;
  base_prompt: string;
  is_system_default: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PromptUpdateRequest {
  business_type: BusinessType;
  base_prompt: string;
}

// ============================================
// UI 상태 타입
// ============================================

export interface RatioSliderConfig {
  id: string;
  value: string;
  label: string;
  description?: string;
  percentage: number;
  color?: string;
}

export interface GeneratorFormState {
  keyword: string;
  count: number;
  businessType: BusinessType;
  lengthRatios: RatioSliderConfig[];
  toneRatios: RatioSliderConfig[];
  emojiRatios: RatioSliderConfig[];
  customPrompt: string;
  useCustomPrompt: boolean;
}

export type GeneratorStep = 'config' | 'generating' | 'preview' | 'saving';

export interface GeneratorUIState {
  step: GeneratorStep;
  isLoading: boolean;
  error: string | null;
  generatedReviews: GeneratedReview[];
  selectedCount: number;
  progress: {
    current: number;
    total: number;
    message: string;
  };
}

// ============================================
// 기본값 설정
// ============================================

export const DEFAULT_LENGTH_RATIOS: RatioSliderConfig[] = [
  { id: 'short', value: 'short', label: '짧은 (100-200자)', percentage: 30, color: '#10b981' },
  { id: 'medium', value: 'medium', label: '중간 (200-400자)', percentage: 50, color: '#3b82f6' },
  { id: 'long', value: 'long', label: '긴 (400-600자)', percentage: 20, color: '#8b5cf6' },
];

export const DEFAULT_TONE_RATIOS: RatioSliderConfig[] = [
  { id: '20s', value: '20s', label: '20대', description: '친근하고 캐주얼', percentage: 20, color: '#f43f5e' },
  { id: '30s', value: '30s', label: '30대', description: '자연스럽고 균형', percentage: 30, color: '#f97316' },
  { id: '40s', value: '40s', label: '40대', description: '차분하고 신뢰감', percentage: 25, color: '#eab308' },
  { id: '50s', value: '50s', label: '50대', description: '정중하고 격식', percentage: 15, color: '#22c55e' },
  { id: 'mz', value: 'mz', label: 'MZ세대', description: '트렌디하고 감각적', percentage: 10, color: '#06b6d4' },
];

export const DEFAULT_EMOJI_RATIOS: RatioSliderConfig[] = [
  { id: 'with', value: 'with', label: '이모티콘 포함', percentage: 60, color: '#f59e0b' },
  { id: 'without', value: 'without', label: '이모티콘 미포함', percentage: 40, color: '#6b7280' },
];
