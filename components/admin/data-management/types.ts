// 카테고리 타입 정의
export type CategoryType = 'all' | 'review' | 'blog' | 'cafe';

// 상품 타입 정의 - 블로그 배포는 3개 서브타입으로 분리
export type ProductType =
  | 'kakaomap'
  | 'receipt'
  | 'blog_reviewer'
  | 'blog_video'
  | 'blog_automation'
  | 'cafe'
  | 'community';

// 파싱된 레코드 인터페이스
export interface ParsedRecord {
  row: number;
  submissionNumber: string;
  companyName: string;
  date: string;
  count: number;
  scriptText?: string; // K맵 전용: 리뷰 원고
  notes: string;
  isValid: boolean;
  errorMessage?: string;
  submissionId?: string; // 검증 후 채워짐
  // K맵/네이버 리뷰 전용 필드
  reviewRegisteredDate?: string; // 리뷰등록날짜
  receiptDate?: string; // 영수증날짜
  reviewStatus?: string; // 상태 (대기, 승인됨, 수정요청)
  reviewLink?: string; // 리뷰 링크
  reviewId?: string; // 리뷰 아이디
  // 블로그 배포 전용 필드
  blogTitle?: string; // 작성 제목
  publishedDate?: string; // 발행일
  blogStatus?: string; // 상태 (대기, 승인됨, 수정요청)
  blogUrl?: string; // 블로그 링크
  blogId?: string; // 블로그 아이디
  // 카페 침투 전용 필드
  cafePostTitle?: string; // 작성 제목
  cafePublishedDate?: string; // 발행일
  cafeStatus?: string; // 상태 (대기, 승인됨, 수정요청)
  cafePostUrl?: string; // 리뷰 링크
  cafeWriterId?: string; // 작성 아이디
  cafeName?: string; // 카페명
}

// 시트 데이터 인터페이스
export interface SheetData {
  productType: ProductType;
  productName: string;
  records: ParsedRecord[];
  validCount: number;
  invalidCount: number;
}

// 검증 결과 인터페이스
export interface ValidationResult {
  sheets: SheetData[];
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

// 배포 결과 상세 인터페이스
export interface DeployResultDetails {
  success: number;
  failed: number;
  errors: string[];
}

// 진행률 디버그 정보 인터페이스
export interface ProgressDebugInfo {
  submissionId: string;
  contentCount: number | null;
  totalCount: number;
  progressPercentage: number;
  status: string;
  updateError?: string;
}

// 배포 결과 인터페이스
export interface DeployResult {
  success: boolean;
  message: string;
  details?: DeployResultDetails;
  progressDebug?: ProgressDebugInfo[];
}

// Props 타입 정의
export interface DailyRecordsBulkUploadProps {
  category?: CategoryType;
}

// 상품 설정 인터페이스
export interface ProductConfig {
  name: string;
  prefix: string;
  tableName: string;
  distributionType?: string;
}
