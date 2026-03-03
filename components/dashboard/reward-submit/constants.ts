import type { RewardFormData, RewardMediaConfig } from './types';

// 리워드 매체 설정
export const REWARD_MEDIA_CONFIG: RewardMediaConfig[] = [
  {
    id: 'twoople',
    name: '투플 (Twoople)',
    icon: '/reward logo/twoppl.svg',
    color: 'bg-white border border-sky-100',
    description: '검색기 미션, 저장하기 미션 등 여러 경로의 미션이 다원화 된 리워드입니다.',
    subDescription: '유입 키워드는 자체 분할 셋팅 됩니다.',
    pricingSlug: 'twoople-reward',
  },
  {
    id: 'eureka',
    name: '블루 (Blue)',
    icon: '/reward logo/blue.svg',
    color: 'bg-white border border-blue-100',
    description: '일반키워드 전용 리워드 입니다. 일반키워드의 알고리즘에 중요한 체류시간, 위치값 등을 제어한 방식으로 유입 키워드는 자체 분할 셋팅 됩니다.',
    subDescription: '',
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
  operationDays: 3,
};

export const MIN_DAILY_VOLUME = 100;
export const MIN_OPERATION_DAYS = 3;
export const MAX_OPERATION_DAYS = 7;
