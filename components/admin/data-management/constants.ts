import type { CategoryType, ProductType, ProductConfig } from './types';

// 카테고리별 포함 상품 매핑
export const CATEGORY_PRODUCTS: Record<CategoryType, ProductType[]> = {
  all: ['kakaomap', 'receipt', 'blog_reviewer', 'blog_video', 'blog_automation', 'cafe', 'community'],
  review: ['kakaomap', 'receipt'],
  blog: ['blog_reviewer', 'blog_video', 'blog_automation'],
  cafe: ['cafe', 'community'],
};

// 카테고리별 템플릿 파일명
export const CATEGORY_TEMPLATE_NAME: Record<CategoryType, string> = {
  all: '일별유입기록_통합_템플릿.xlsx',
  review: '일별유입기록_리뷰마케팅_템플릿.xlsx',
  blog: '일별유입기록_블로그배포_템플릿.xlsx',
  cafe: '일별유입기록_카페침투_템플릿.xlsx',
};

// 상품 타입 매핑 - 블로그 배포는 콘텐츠 아이템 테이블 사용
export const PRODUCT_CONFIG: Record<ProductType, ProductConfig> = {
  kakaomap: { name: 'K맵 리뷰', prefix: 'KM', tableName: 'kakaomap_review_daily_records' },
  receipt: { name: '방문자 리뷰', prefix: 'RR', tableName: 'receipt_review_daily_records' },
  blog_reviewer: {
    name: '리뷰어 배포',
    prefix: 'BD',
    tableName: 'blog_content_items',
    distributionType: 'reviewer',
  },
  blog_video: {
    name: '영상 배포',
    prefix: 'BD',
    tableName: 'blog_content_items',
    distributionType: 'video',
  },
  blog_automation: {
    name: '자동화 배포',
    prefix: 'BD',
    tableName: 'blog_content_items',
    distributionType: 'automation',
  },
  cafe: {
    name: '카페 침투',
    prefix: 'CM',
    tableName: 'cafe_content_items',
    distributionType: 'cafe',
  },
  community: {
    name: '커뮤니티 마케팅',
    prefix: 'CM',
    tableName: 'cafe_content_items',
    distributionType: 'community',
  },
};

// 시트 이름으로 상품 타입 매핑 - 블로그 배포는 3개 서브타입
export const SHEET_NAME_MAP: Record<string, ProductType> = {
  'K맵리뷰': 'kakaomap',
  'K맵 리뷰': 'kakaomap',
  '카카오맵': 'kakaomap',
  kakaomap: 'kakaomap',
  '방문자리뷰': 'receipt',
  '방문자 리뷰': 'receipt',
  '영수증리뷰': 'receipt',
  '영수증 리뷰': 'receipt',
  receipt: 'receipt',
  // 블로그 배포 - 3개 시트로 분리
  '리뷰어배포': 'blog_reviewer',
  '리뷰어 배포': 'blog_reviewer',
  blog_reviewer: 'blog_reviewer',
  '영상배포': 'blog_video',
  '영상 배포': 'blog_video',
  blog_video: 'blog_video',
  '자동화배포': 'blog_automation',
  '자동화 배포': 'blog_automation',
  blog_automation: 'blog_automation',
  '카페침투': 'cafe',
  '카페 침투': 'cafe',
  cafe: 'cafe',
  '커뮤니티마케팅': 'community',
  '커뮤니티 마케팅': 'community',
  community: 'community',
};

// 리뷰 타입 (K맵, 방문자 리뷰)
export const REVIEW_PRODUCT_TYPES: ProductType[] = ['kakaomap', 'receipt'];

// 블로그 타입
export const BLOG_PRODUCT_TYPES: ProductType[] = ['blog_reviewer', 'blog_video', 'blog_automation'];

// 리뷰 상태 옵션
export const REVIEW_STATUS_OPTIONS = ['대기', '승인됨', '수정요청'] as const;
