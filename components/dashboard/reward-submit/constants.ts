import type { RewardFormData, RewardMediaConfig } from './types';

// 리워드 매체 설정
export const REWARD_MEDIA_CONFIG: RewardMediaConfig[] = [
  {
    id: 'twoople',
    name: '투플 (Twoople)',
    icon: '📱',
    color: 'bg-sky-500',
    description: '실사용자 방문 유도를 통한 네이버 플레이스 조회수 증대',
    subDescription: '리워드 기반의 프리미엄 마케팅 플랫폼',
    pricingSlug: 'twoople-reward',
  },
  {
    id: 'eureka',
    name: '유레카 (Eureka)',
    icon: '💡',
    color: 'bg-amber-500',
    description: '유레카 기반의 네이버 플레이스 조회수 증대',
    subDescription: '고효율 리워드 마케팅 플랫폼',
    pricingSlug: 'eureka-reward',
  },
];

export const INITIAL_FORM_DATA: RewardFormData = {
  mediaType: 'twoople',
  businessName: '',
  placeUrl: '',
  placeMid: '',
  dailyVolume: 100,
  startDate: null,
  endDate: null,
};

export const MIN_DAILY_VOLUME = 100;
export const MIN_OPERATION_DAYS = 3;
export const MAX_OPERATION_DAYS = 7;
