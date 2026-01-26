export interface RewardSubmitFormProps {
  initialPoints: number;
}

// 리워드 매체 타입 정의
export type RewardMediaType = 'twoople' | 'eureka';

// 리워드 매체 설정 인터페이스
export interface RewardMediaConfig {
  id: RewardMediaType;
  name: string;
  icon: string;
  color: string;
  description: string;
  subDescription?: string;
  pricingSlug: string;
}

export interface RewardFormData {
  mediaType: RewardMediaType;
  businessName: string;
  placeUrl: string;
  placeMid: string;
  dailyVolume: number;
  startDate: Date | null;
  operationDays: number;
}
