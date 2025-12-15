import { LucideIcon } from 'lucide-react';

// 리뷰 마케팅 서비스 타입
export type ReviewType = 'visitor' | 'kmap';

// 서비스 설정 타입
export interface ReviewServiceConfig {
  id: ReviewType;
  name: string;
  icon: LucideIcon;
  color: string;
  available: boolean;
  pricePerUnit: number;
  description: string;
  minCount: number;
  productGuideKey: string;
  priceKey: string;
}

// URL 파라미터 매핑
export function mapTypeParam(param: string | undefined): ReviewType {
  switch (param) {
    case 'visitor':
    case 'naver':
    case 'receipt':
      return 'visitor';
    case 'kmap':
    case 'kakao':
    case 'kakaomap':
      return 'kmap';
    default:
      return 'visitor';
  }
}

// 타입을 URL 경로로 변환
export function mapTypeToUrl(type: ReviewType): string {
  switch (type) {
    case 'visitor':
      return 'visitor';
    case 'kmap':
      return 'kmap';
    default:
      return 'visitor';
  }
}

// 타입을 slug로 변환 (가격 조회용)
export function mapTypeToSlug(type: ReviewType): string {
  switch (type) {
    case 'visitor':
      return 'receipt-review';
    case 'kmap':
      return 'kakaomap-review';
    default:
      return 'receipt-review';
  }
}

// 네이버 영수증 리뷰 폼 데이터
export interface VisitorFormData {
  businessName: string;
  placeUrl: string;
  placeMid: string;
  dailyCount: number;
  startDate: Date | null;
  endDate: Date | null;
  photoOption: 'with' | 'without';
  scriptOption: 'custom' | 'ai';
  guideline: string;
  emailDocConfirmed: boolean;
}

// 카카오맵 리뷰 폼 데이터
export interface KmapFormData {
  businessName: string;
  kmapUrl: string;
  dailyCount: number;
  startDate: Date | null;
  endDate: Date | null;
  hasPhoto: boolean;
  emailImageConfirmed: boolean;
  scriptOption: 'custom' | 'ai';
  photoRatio: number;
  starRating: 'mixed' | 'five' | 'four';
  guideline: string;
}
