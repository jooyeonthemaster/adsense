/**
 * 대량 접수(Bulk Submission) 타입 정의
 */

// 대량 접수 가능 상품 타입
export type BulkSubmissionProduct =
  | 'blog_reviewer' // 리뷰어 배포
  | 'blog_video' // 247 배포
  | 'blog_automation' // 자동화 배포
  | 'receipt' // 영수증 리뷰
  | 'place'; // 트래픽/리워드

// 블로그 배포 유형
export type BlogDistributionType = 'reviewer' | 'video' | 'automation';

// 콘텐츠 유형
export type ContentType = 'review' | 'info';

// 리워드 매체 타입
export type RewardMediaType = 'twoople' | 'eureka';

// ============================================
// 영수증 리뷰 양식 데이터
// ============================================
export interface ReceiptBulkRow {
  순번: number;
  '총 수량': number;
  '일 수량': number;
  '이미지 건당 개수'?: number;
  '플레이스 주소': string;
  '발행 시작 날짜 지정 (선택)'?: string;
  '발행 요일 지정 (선택)'?: string;
  '발행 시간대 지정 (선택)'?: string;
  '이미지 랜덤여부(0:순서대로, 1:랜덤)(선택)'?: number;
  '방문 일자 범위 (선택)'?: string;
  '가이드 라인 (선택)'?: string;
  '원고 직접 등록 (선택)'?: string;
  '원고 + 사진 매칭 요청시 / 사진 파일명'?: string;
}

// ============================================
// 블로그 배포 양식 데이터
// ============================================
export interface BlogBulkRow {
  '광고주 아이디'?: string;
  배포유형: string; // 리뷰어/247/자동화
  시작날짜: string;
  종료날짜?: string;
  글타입: string; // 후기성/정보성
  플레이스링크: string;
  일갯수: number;
  총갯수: number;
  일수: number;
}

// ============================================
// 트래픽(리워드) 양식 데이터
// ============================================
export interface PlaceBulkRow {
  '광고주 아이디'?: string;
  상품명: string;
  'URL (m. 으로 시작하는 모바일링크 기재)': string;
  '목표 키워드'?: string;
  시작일: string;
  종료일?: string;
  '구동 일수': number;
  '일 수량': number;
}

// 모든 양식 타입 유니온
export type BulkSubmissionRow = ReceiptBulkRow | BlogBulkRow | PlaceBulkRow;

// ============================================
// 파싱된 레코드 (검증 결과 포함)
// ============================================
export interface ParsedSubmissionRecord {
  row: number; // 엑셀 행 번호 (1-indexed)
  productType: BulkSubmissionProduct;
  data: BulkSubmissionRow;
  isValid: boolean;
  errors: string[]; // 검증 오류 메시지 목록
  // 서버 검증 후 채워짐
  calculatedPoints?: number;
  pricePerUnit?: number;
  placeMid?: string;
  businessName?: string;
}

// ============================================
// 검증 결과 (행별)
// ============================================
export interface BulkValidationResult {
  row: number;
  isValid: boolean;
  errors: string[];
  calculatedPoints: number;
  pricePerUnit?: number;
  extractedMid?: string;
}

// 검증 API 응답 전체
export interface BulkValidationResponse {
  success: boolean;
  results: BulkValidationResult[];
  summary: {
    totalRecords: number;
    validCount: number;
    invalidCount: number;
    totalPoints: number;
    currentBalance: number;
    hasInsufficientPoints: boolean;
    remainingBalance: number;
  };
}

// ============================================
// 제출 결과 (행별)
// ============================================
export interface BulkSubmitResult {
  row: number;
  success: boolean;
  submissionNumber?: string;
  submissionId?: string;
  calculatedPoints?: number;
  error?: string;
}

// 제출 API 응답 전체
export interface BulkSubmitResponse {
  success: boolean;
  results: BulkSubmitResult[];
  bulkUploadId?: string; // 대량 접수 그룹 ID
  summary: {
    totalRecords: number;
    successCount: number;
    failedCount: number;
    totalPoints: number;
    newBalance: number;
  };
  error?: string;
  rolledBack?: boolean;
}

// ============================================
// 상품별 설정
// ============================================
export interface ProductConfig {
  name: string;
  sheetName: string;
  columns: string[];
  requiredColumns: string[];
  apiEndpoint: string;
  validation: {
    dailyCountMin?: number;
    dailyCountMax?: number;
    operationDaysMin?: number;
    operationDaysMax?: number;
    totalCountMin?: number;
    dailyCountStep?: number;
  };
  // 블로그 배포 전용
  distributionType?: BlogDistributionType;
}

// ============================================
// API 요청 타입
// ============================================
export interface BulkSubmissionRequest {
  productType: BulkSubmissionProduct;
  records: ParsedSubmissionRecord[];
}

export interface BulkValidationRequest {
  productType: BulkSubmissionProduct;
  records: Omit<ParsedSubmissionRecord, 'calculatedPoints' | 'pricePerUnit' | 'placeMid'>[];
}

// ============================================
// 업로드 상태
// ============================================
export type BulkUploadStatus =
  | 'idle' // 초기 상태
  | 'parsing' // 파일 파싱 중
  | 'validating' // 서버 검증 중
  | 'preview' // 미리보기 상태
  | 'submitting' // 제출 중
  | 'success' // 성공
  | 'error'; // 오류
