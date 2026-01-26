import { Camera, MapPin } from 'lucide-react';
import type { ReviewType, ReviewServiceConfig } from '@/types/review-marketing/types';

// 서비스 목록 생성 함수
export function createServices(pricing: Record<string, number>): ReviewServiceConfig[] {
  return [
    {
      id: 'visitor',
      name: '네이버 영수증',
      icon: Camera,
      color: 'bg-sky-500',
      available: !!pricing['receipt-review'],
      pricePerUnit: pricing['receipt-review'] || 0,
      description: '영수증 인증 리뷰로 높은 신뢰도',
      minCount: 30,
      productGuideKey: 'receipt-review',
      priceKey: 'receipt-review',
    },
    {
      id: 'kmap',
      name: '카카오맵',
      icon: MapPin,
      color: 'bg-amber-500',
      available: !!pricing['kakaomap-review'],
      pricePerUnit: pricing['kakaomap-review'] || 0,
      description: '카카오맵 플랫폼 리뷰 마케팅',
      minCount: 10,
      productGuideKey: 'kakaomap-review',
      priceKey: 'kakaomap-review',
    },
  ];
}

// 초기 방문자 폼 데이터
export const INITIAL_VISITOR_FORM = {
  businessName: '',
  placeUrl: '',
  placeMid: '',
  dailyCount: 10,
  startDate: null,
  operationDays: 3,
  photoOption: 'with' as const,
  scriptOption: 'custom' as const,
  guideline: '',
  emailDocConfirmed: false,
};

// 초기 카카오맵 폼 데이터
export const INITIAL_KMAP_FORM = {
  businessName: '',
  kmapUrl: '',
  dailyCount: 10,
  startDate: null,
  operationDays: 3,
  hasPhoto: false,
  emailImageConfirmed: false,
  scriptOption: 'custom' as const,
  photoRatio: 50,
  starRating: 'mixed' as const,
  guideline: '',
};

// 이메일 주소
export const SUPPORT_EMAIL = 'sense-ad@naver.com';
