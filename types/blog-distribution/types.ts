export type DistributionType = 'video' | 'auto' | 'reviewer';

export interface BlogDistributionFormData {
  businessName: string;
  placeUrl: string;
  placeMid: string;
  linkType: 'place' | 'external';
  contentType: 'review' | 'info';
  dailyCount: number;
  startDate: Date | null;
  endDate: Date | null;
  keywords: string;
  guideline: string;
  externalAccountId: string;
  chargeCount: number;
  useExternalAccount: boolean;
  emailMediaConfirmed: boolean; // 이메일로 이미지/영상 전송 확인
}

export interface ServiceConfig {
  id: DistributionType;
  name: string;
  icon: any;
  color: string;
  available: boolean;
  pricePerPost: number;
  description: string;
}

// URL type 파라미터를 DistributionType으로 매핑
export const mapTypeParam = (param: string): DistributionType => {
  const mapping: Record<string, DistributionType> = {
    'video': 'video',
    'auto': 'auto',
    'automation': 'auto',
    'reviewer': 'reviewer',
  };
  return mapping[param] || 'video';
};

// DistributionType을 URL 파라미터로 매핑
export const mapTypeToUrl = (type: DistributionType): string => {
  const mapping: Record<DistributionType, string> = {
    'video': 'video',
    'auto': 'auto',
    'reviewer': 'reviewer',
  };
  return mapping[type] || 'video';
};

// DistributionType을 DB slug로 매핑
export const mapTypeToSlug = (type: DistributionType): string => {
  const mapping: Record<DistributionType, string> = {
    'video': 'video-distribution',
    'auto': 'auto-distribution',
    'reviewer': 'reviewer-distribution',
  };
  return mapping[type];
};














