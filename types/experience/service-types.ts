export type ServiceType = 'blog' | 'xiaohongshu' | 'reporter' | 'influencer';

export interface KeywordPair {
  main: string;
  sub: string;
}

export interface ServiceConfig {
  id: ServiceType;
  name: string;
  icon: any; // LucideIcon type
  color: string;
  available: boolean;
  pricePerTeam: number;
  description: string;
}

export interface ExperienceFormData {
  businessName: string;
  placeUrl: string;
  placeMid: string;
  providedItems: string;
  teamCount: number;
  availableDays: string[];
  availableTimeStart: string;
  availableTimeEnd: string;
  guideline: string;
  keywords: KeywordPair[];
  // 실계정 기자단 전용
  publishDates: Date[];
  progressKeyword: string;
  hasImage: boolean;
  emailImageConfirmed: boolean; // 이메일로 이미지 전송 확인
  email: string;
  images: File[];
}

// URL service 파라미터를 ServiceType으로 매핑
export const mapServiceParam = (param: string): ServiceType => {
  const mapping: Record<string, ServiceType> = {
    'blog': 'blog',
    'xiaohongshu': 'xiaohongshu',
    'journalist': 'reporter',
    'reporter': 'reporter',
    'influencer': 'influencer',
  };
  return mapping[param] || 'blog';
};

// ServiceType을 URL 파라미터로 매핑
export const mapServiceToUrl = (service: ServiceType): string => {
  const mapping: Record<ServiceType, string> = {
    'blog': 'blog',
    'xiaohongshu': 'xiaohongshu',
    'reporter': 'journalist',
    'influencer': 'influencer',
  };
  return mapping[service] || 'blog';
};

// ServiceType을 DB slug로 매핑
export const mapServiceToSlug = (service: ServiceType): string => {
  const mapping: Record<ServiceType, string> = {
    'blog': 'blog-experience',
    'xiaohongshu': 'xiaohongshu',
    'reporter': 'journalist',
    'influencer': 'influencer',
  };
  return mapping[service];
};











