/**
 * 대량 접수(Bulk Submission) 상수 정의
 */

import type { BulkSubmissionProduct, ProductConfig } from './types';

// ============================================
// 상품별 설정
// ============================================
export const BULK_PRODUCT_CONFIG: Record<BulkSubmissionProduct, ProductConfig> = {
  // 영수증 리뷰
  receipt: {
    name: '영수증 리뷰',
    sheetName: '영수증리뷰',
    columns: [
      '순번',
      '총 수량',
      '일 수량',
      '이미지 건당 개수',
      '플레이스 주소',
      '발행 시작 날짜 지정 (선택)',
      '발행 요일 지정 (선택)',
      '발행 시간대 지정 (선택)',
      '이미지 랜덤여부(0:순서대로, 1:랜덤)(선택)',
      '방문 일자 범위 (선택)',
      '가이드 라인 (선택)',
      '원고 직접 등록 (선택)',
      '원고 + 사진 매칭 요청시 / 사진 파일명',
    ],
    requiredColumns: ['순번', '총 수량', '일 수량', '플레이스 주소'],
    apiEndpoint: '/api/submissions/receipt',
    validation: {
      dailyCountMin: 1,
      dailyCountMax: 10,
      operationDaysMin: 3,
    },
  },

  // 리뷰어 배포
  blog_reviewer: {
    name: '리뷰어 배포',
    sheetName: '리뷰어배포',
    columns: [
      '광고주 아이디',
      '배포유형',
      '시작날짜',
      '종료날짜',
      '글타입',
      '플레이스링크',
      '일갯수',
      '총갯수',
      '일수',
    ],
    requiredColumns: ['배포유형', '시작날짜', '글타입', '플레이스링크', '일갯수', '총갯수', '일수'],
    apiEndpoint: '/api/submissions/blog',
    validation: {
      dailyCountMin: 3,
      operationDaysMin: 10,
      operationDaysMax: 30,
      totalCountMin: 30,
    },
    distributionType: 'reviewer',
  },

  // 247 배포
  blog_video: {
    name: '247 배포',
    sheetName: '247배포',
    columns: [
      '광고주 아이디',
      '배포유형',
      '시작날짜',
      '종료날짜',
      '글타입',
      '플레이스링크',
      '일갯수',
      '총갯수',
      '일수',
    ],
    requiredColumns: ['배포유형', '시작날짜', '글타입', '플레이스링크', '일갯수', '총갯수', '일수'],
    apiEndpoint: '/api/submissions/blog',
    validation: {
      dailyCountMin: 3,
      operationDaysMin: 10,
      operationDaysMax: 30,
      totalCountMin: 30,
    },
    distributionType: 'video',
  },

  // 자동화 배포
  blog_automation: {
    name: '자동화 배포',
    sheetName: '자동화배포',
    columns: [
      '광고주 아이디',
      '배포유형',
      '시작날짜',
      '종료날짜',
      '글타입',
      '플레이스링크',
      '일갯수',
      '총갯수',
      '일수',
    ],
    requiredColumns: ['배포유형', '시작날짜', '글타입', '플레이스링크', '일갯수', '총갯수', '일수'],
    apiEndpoint: '/api/submissions/blog',
    validation: {
      dailyCountMin: 3,
      operationDaysMin: 10,
      operationDaysMax: 30,
      totalCountMin: 30,
    },
    distributionType: 'automation',
  },

  // 트래픽/리워드
  place: {
    name: '트래픽/리워드',
    sheetName: '리워드',
    columns: [
      '광고주 아이디',
      '상품명',
      'URL (m. 으로 시작하는 모바일링크 기재)',
      '목표 키워드',
      '시작일',
      '종료일',
      '구동 일수',
      '일 수량',
    ],
    requiredColumns: [
      '상품명',
      'URL (m. 으로 시작하는 모바일링크 기재)',
      '시작일',
      '구동 일수',
      '일 수량',
    ],
    apiEndpoint: '/api/submissions/reward',
    validation: {
      dailyCountMin: 100,
      dailyCountStep: 100,
      operationDaysMin: 3,
      operationDaysMax: 7,
    },
  },
};

// ============================================
// 시트명 -> 상품 타입 매핑
// ============================================
export const SHEET_TO_PRODUCT_MAP: Record<string, BulkSubmissionProduct> = {
  // 영수증 리뷰
  영수증리뷰: 'receipt',
  '영수증 리뷰': 'receipt',
  영수증: 'receipt',

  // 리뷰어 배포
  리뷰어배포: 'blog_reviewer',
  '리뷰어 배포': 'blog_reviewer',

  // 247 배포
  '247배포': 'blog_video',
  '247 배포': 'blog_video',
  영상배포: 'blog_video',

  // 자동화 배포
  자동화배포: 'blog_automation',
  '자동화 배포': 'blog_automation',

  // 리워드/트래픽
  리워드: 'place',
  트래픽: 'place',
};

// ============================================
// 배포유형 한글 -> 영문 매핑
// ============================================
export const DISTRIBUTION_TYPE_MAP: Record<string, 'reviewer' | 'video' | 'automation'> = {
  리뷰어: 'reviewer',
  '리뷰어 배포': 'reviewer',
  리뷰어배포: 'reviewer',
  '247': 'video',
  '247 배포': 'video',
  '247배포': 'video',
  영상: 'video',
  자동화: 'automation',
  '자동화 배포': 'automation',
  자동화배포: 'automation',
};

// 배포유형 -> 상품타입 매핑 (가격 조회용)
export const DISTRIBUTION_TO_PRODUCT_TYPE: Record<string, BulkSubmissionProduct> = {
  리뷰어: 'blog_reviewer',
  '리뷰어 배포': 'blog_reviewer',
  리뷰어배포: 'blog_reviewer',
  '247': 'blog_video',
  '247 배포': 'blog_video',
  '247배포': 'blog_video',
  영상: 'blog_video',
  자동화: 'blog_automation',
  '자동화 배포': 'blog_automation',
  자동화배포: 'blog_automation',
};

// ============================================
// 콘텐츠 유형 한글 -> 영문 매핑
// ============================================
export const CONTENT_TYPE_MAP: Record<string, 'review' | 'info'> = {
  후기성: 'review',
  후기: 'review',
  리뷰: 'review',
  정보성: 'info',
  정보: 'info',
};

// ============================================
// 템플릿 파일명
// ============================================
export const TEMPLATE_FILE_NAMES: Record<BulkSubmissionProduct, string> = {
  receipt: '영수증_리뷰_대량접수_템플릿.xlsx',
  blog_reviewer: '블로그_배포_대량접수_템플릿.xlsx',
  blog_video: '블로그_배포_대량접수_템플릿.xlsx',
  blog_automation: '블로그_배포_대량접수_템플릿.xlsx',
  place: '트래픽_리워드_대량접수_템플릿.xlsx',
};

// ============================================
// 날짜 형식 정규식
// ============================================
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ============================================
// 플레이스 URL 패턴
// ============================================
export const NAVER_PLACE_URL_PATTERNS = [
  // map.naver.com 형식 (PC 버전)
  /^https?:\/\/map\.naver\.com\/.*place\/(\d+)/,
  // place.naver.com 형식 (모바일/구버전)
  /^https?:\/\/m\.place\.naver\.com\/.*\/(\d+)/,
  /^https?:\/\/place\.naver\.com\/.*\/(\d+)/,
  // 단축 URL
  /^https?:\/\/naver\.me\//,
];

export const MOBILE_PLACE_URL_PATTERN = /^https?:\/\/m\.place\.naver\.com/;

// 카카오맵 URL 패턴
export const KAKAO_PLACE_URL_PATTERNS = [
  // place.map.kakao.com/123456 형식
  /^https?:\/\/place\.map\.kakao\.com\/(\d+)/,
  // map.kakao.com/?itemId=123456 형식
  /^https?:\/\/map\.kakao\.com\/.*[?&]itemId=(\d+)/,
  // map.kakao.com/link/to/123456 형식
  /^https?:\/\/map\.kakao\.com\/link\/(?:to|map|roadview)\/(\d+)/,
  // 단축 URL
  /^https?:\/\/kko\.to\//,
];

// ============================================
// 에러 메시지
// ============================================
export const ERROR_MESSAGES = {
  // 필수 필드
  REQUIRED_FIELD: (field: string) => `${field} 필수`,

  // 범위 검증
  DAILY_COUNT_MIN: (min: number) => `일 수량 최소 ${min}건 이상`,
  DAILY_COUNT_MAX: (max: number) => `일 수량 최대 ${max}건 이하`,
  DAILY_COUNT_STEP: (step: number) => `일 수량은 ${step}단위로 입력`,
  OPERATION_DAYS_MIN: (min: number) => `구동일수 최소 ${min}일`,
  OPERATION_DAYS_MAX: (max: number) => `구동일수 최대 ${max}일`,
  TOTAL_COUNT_MIN: (min: number) => `총 수량 최소 ${min}건 이상`,
  TOTAL_COUNT_MISMATCH: '총 수량 = 일 수량 × 구동일수',

  // 형식 검증
  INVALID_DATE_FORMAT: '날짜 형식: YYYY-MM-DD',
  INVALID_PLACE_URL: '유효하지 않은 플레이스 URL',
  INVALID_MOBILE_URL: 'm.place.naver.com 형식 필요',
  INVALID_DISTRIBUTION_TYPE: '배포유형: 리뷰어/247/자동화',
  INVALID_CONTENT_TYPE: '글타입: 후기성/정보성',

  // 서버 검증
  INSUFFICIENT_POINTS: (required: number, balance: number) =>
    `포인트 부족 (필요: ${required.toLocaleString()}P, 잔액: ${balance.toLocaleString()}P)`,
  MID_EXTRACTION_FAILED: 'MID 추출 불가',
  PRICE_NOT_CONFIGURED: '상품 가격 미설정',
};
