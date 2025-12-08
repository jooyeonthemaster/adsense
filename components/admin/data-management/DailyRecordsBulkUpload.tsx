'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// 카테고리 타입 정의
type CategoryType = 'all' | 'review' | 'blog' | 'cafe';

// Props 타입 정의
interface DailyRecordsBulkUploadProps {
  category?: CategoryType;
}

// 상품 타입 정의 - 블로그 배포는 3개 서브타입으로 분리
type ProductType = 'kakaomap' | 'receipt' | 'blog_reviewer' | 'blog_video' | 'blog_automation' | 'cafe';

// 카테고리별 포함 상품 매핑
const CATEGORY_PRODUCTS: Record<CategoryType, ProductType[]> = {
  all: ['kakaomap', 'receipt', 'blog_reviewer', 'blog_video', 'blog_automation', 'cafe'],
  review: ['kakaomap', 'receipt'],
  blog: ['blog_reviewer', 'blog_video', 'blog_automation'],
  cafe: ['cafe'],
};

// 카테고리별 템플릿 파일명
const CATEGORY_TEMPLATE_NAME: Record<CategoryType, string> = {
  all: '일별유입기록_통합_템플릿.xlsx',
  review: '일별유입기록_리뷰마케팅_템플릿.xlsx',
  blog: '일별유입기록_블로그배포_템플릿.xlsx',
  cafe: '일별유입기록_카페침투_템플릿.xlsx',
};

interface ParsedRecord {
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

interface SheetData {
  productType: ProductType;
  productName: string;
  records: ParsedRecord[];
  validCount: number;
  invalidCount: number;
}

interface ValidationResult {
  sheets: SheetData[];
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

// 상품 타입 매핑 - 블로그 배포는 콘텐츠 아이템 테이블 사용
const PRODUCT_CONFIG: Record<ProductType, { name: string; prefix: string; tableName: string; distributionType?: string }> = {
  kakaomap: { name: 'K맵 리뷰', prefix: 'KM', tableName: 'kakaomap_review_daily_records' },
  receipt: { name: '방문자 리뷰', prefix: 'RR', tableName: 'receipt_review_daily_records' },
  blog_reviewer: { name: '리뷰어 배포', prefix: 'BD', tableName: 'blog_content_items', distributionType: 'reviewer' },
  blog_video: { name: '영상 배포', prefix: 'BD', tableName: 'blog_content_items', distributionType: 'video' },
  blog_automation: { name: '자동화 배포', prefix: 'BD', tableName: 'blog_content_items', distributionType: 'automation' },
  cafe: { name: '카페 침투', prefix: 'CM', tableName: 'cafe_content_items' },
};

// 시트 이름으로 상품 타입 매핑 - 블로그 배포는 3개 서브타입
const SHEET_NAME_MAP: Record<string, ProductType> = {
  'K맵리뷰': 'kakaomap',
  'K맵 리뷰': 'kakaomap',
  '카카오맵': 'kakaomap',
  'kakaomap': 'kakaomap',
  '방문자리뷰': 'receipt',
  '방문자 리뷰': 'receipt',
  '영수증리뷰': 'receipt',
  '영수증 리뷰': 'receipt',
  'receipt': 'receipt',
  // 블로그 배포 - 3개 시트로 분리
  '리뷰어배포': 'blog_reviewer',
  '리뷰어 배포': 'blog_reviewer',
  'blog_reviewer': 'blog_reviewer',
  '영상배포': 'blog_video',
  '영상 배포': 'blog_video',
  'blog_video': 'blog_video',
  '자동화배포': 'blog_automation',
  '자동화 배포': 'blog_automation',
  'blog_automation': 'blog_automation',
  '카페침투': 'cafe',
  '카페 침투': 'cafe',
  'cafe': 'cafe',
};

export function DailyRecordsBulkUpload({ category = 'all' }: DailyRecordsBulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);

  // 현재 카테고리에 포함된 상품 목록
  const allowedProducts = CATEGORY_PRODUCTS[category];
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [deployResult, setDeployResult] = useState<{
    success: boolean;
    message: string;
    details?: { success: number; failed: number; errors: string[] };
    progressDebug?: Array<{
      submissionId: string;
      contentCount: number | null;
      totalCount: number;
      progressPercentage: number;
      status: string;
      updateError?: string;
    }>;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  // 엑셀 템플릿 다운로드
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // K맵 리뷰 시트 - 리뷰 콘텐츠 관리용 (유입수 X, 날짜 2개 + 상태 + 리뷰링크 + 리뷰아이디)
    if (allowedProducts.includes('kakaomap')) {
      const kmapData = [
        ['접수번호', '업체명', '리뷰원고', '리뷰등록날짜', '영수증날짜', '상태', '리뷰링크', '리뷰아이디'],
        ['KM-2025-0001', '맛있는식당', '음식이 정말 맛있고 친절해요! 분위기도 좋아서 다음에 또 올게요~', '2025-12-05', '2025-12-01', '승인됨', 'https://place.map.kakao.com/review/123456', 'review_123456'],
        ['KM-2025-0001', '맛있는식당', '가격 대비 양이 푸짐하고 맛도 좋습니다. 주차도 편해요.', '2025-12-06', '2025-12-02', '승인됨', 'https://place.map.kakao.com/review/123457', 'review_123457'],
        ['KM-2025-0002', '카페블루', '직원분들이 너무 친절하시고 서비스가 좋았어요!', '2025-12-05', '2025-11-28', '대기', '', ''],
        ['KM-2025-0002', '카페블루', '분위기 좋고 커피도 맛있어요. 재방문 의사 100%!', '2025-12-06', '2025-11-30', '대기', '', ''],
        ['KM-2025-0003', '(주)맛집마케팅', '깔끔한 인테리어와 맛있는 음식 추천합니다!', '2025-12-07', '2025-12-03', '수정요청', 'https://place.map.kakao.com/review/123458', 'review_123458'],
      ];
      const wsKmap = XLSX.utils.aoa_to_sheet(kmapData);
      wsKmap['!cols'] = [
        { wch: 18 }, // 접수번호
        { wch: 20 }, // 업체명
        { wch: 60 }, // 리뷰원고
        { wch: 14 }, // 리뷰등록날짜
        { wch: 14 }, // 영수증날짜
        { wch: 10 }, // 상태
        { wch: 45 }, // 리뷰링크
        { wch: 18 }, // 리뷰아이디
      ];
      XLSX.utils.book_append_sheet(wb, wsKmap, 'K맵리뷰');
    }

    // 방문자 리뷰 시트 (네이버 리뷰) - K맵과 동일한 형식
    if (allowedProducts.includes('receipt')) {
      const receiptData = [
        ['접수번호', '업체명', '리뷰원고', '리뷰등록날짜', '영수증날짜', '상태', '리뷰링크', '리뷰아이디'],
        ['RR-2025-0001', '맛있는식당', '음식이 정말 맛있어요! 사장님도 친절하시고 분위기 좋아서 재방문 의사 100%입니다.', '2025-12-05', '2025-12-01', '승인됨', 'https://naver.me/review/123456', 'naver_123456'],
        ['RR-2025-0001', '맛있는식당', '점심 특선 메뉴가 가성비 최고예요. 직장인들한테 강추합니다!', '2025-12-06', '2025-12-02', '승인됨', 'https://naver.me/review/123457', 'naver_123457'],
        ['RR-2025-0002', '커피전문점', '디저트가 정말 맛있고 커피도 퀄리티가 좋아요. 인테리어도 예쁘네요~', '2025-12-05', '2025-11-28', '대기', '', ''],
        ['RR-2025-0002', '커피전문점', '브런치 세트 강추! 가격 대비 퀄리티 좋고 직원분들도 친절합니다.', '2025-12-06', '2025-11-30', '대기', '', ''],
        ['RR-2025-0003', '(주)카페마케팅', '분위기 좋고 음료도 맛있어요. 주차도 편해서 자주 올 것 같아요!', '2025-12-07', '2025-12-03', '수정요청', 'https://naver.me/review/123458', 'naver_123458'],
      ];
      const wsReceipt = XLSX.utils.aoa_to_sheet(receiptData);
      wsReceipt['!cols'] = [
        { wch: 18 }, // 접수번호
        { wch: 20 }, // 업체명
        { wch: 60 }, // 리뷰원고
        { wch: 14 }, // 리뷰등록날짜
        { wch: 14 }, // 영수증날짜
        { wch: 10 }, // 상태
        { wch: 45 }, // 리뷰링크
        { wch: 18 }, // 리뷰아이디
      ];
      XLSX.utils.book_append_sheet(wb, wsReceipt, '방문자리뷰');
    }

    // 블로그 배포 시트 - 리뷰어 배포 (콘텐츠 아이템 형식)
    if (allowedProducts.includes('blog_reviewer')) {
      const reviewerData = [
        ['접수번호', '업체명', '작성제목', '발행일', '상태', '블로그링크', '블로그아이디'],
        ['BD-2025-0001', '뷰티샵', '강남 맛집 추천! 진짜 맛있는 곳', '2025-12-05', '승인됨', 'https://blog.naver.com/reviewer1/123456', 'post_123456'],
        ['BD-2025-0001', '뷰티샵', '분위기 좋은 카페 후기', '2025-12-06', '승인됨', 'https://blog.naver.com/reviewer2/123457', 'post_123457'],
        ['BD-2025-0002', '헤어샵', '머리하러 갔다가 대박 발견!', '2025-12-07', '대기', '', ''],
      ];
      const wsReviewer = XLSX.utils.aoa_to_sheet(reviewerData);
      wsReviewer['!cols'] = [
        { wch: 18 }, // 접수번호
        { wch: 20 }, // 업체명
        { wch: 40 }, // 작성제목
        { wch: 14 }, // 발행일
        { wch: 10 }, // 상태
        { wch: 45 }, // 블로그링크
        { wch: 18 }, // 블로그아이디
      ];
      XLSX.utils.book_append_sheet(wb, wsReviewer, '리뷰어배포');
    }

    // 블로그 배포 시트 - 영상 배포
    if (allowedProducts.includes('blog_video')) {
      const videoData = [
        ['접수번호', '업체명', '작성제목', '발행일', '상태', '블로그링크', '블로그아이디'],
        ['BD-2025-0003', '음식점', '맛집 브이로그 | 진짜 맛있다', '2025-12-05', '승인됨', 'https://blog.naver.com/video1/234567', 'video_234567'],
        ['BD-2025-0003', '음식점', '먹방 유튜버의 솔직 후기', '2025-12-06', '대기', '', ''],
      ];
      const wsVideo = XLSX.utils.aoa_to_sheet(videoData);
      wsVideo['!cols'] = [
        { wch: 18 }, // 접수번호
        { wch: 20 }, // 업체명
        { wch: 40 }, // 작성제목
        { wch: 14 }, // 발행일
        { wch: 10 }, // 상태
        { wch: 45 }, // 블로그링크
        { wch: 18 }, // 블로그아이디
      ];
      XLSX.utils.book_append_sheet(wb, wsVideo, '영상배포');
    }

    // 블로그 배포 시트 - 자동화 배포
    if (allowedProducts.includes('blog_automation')) {
      const autoData = [
        ['접수번호', '업체명', '작성제목', '발행일', '상태', '블로그링크', '블로그아이디'],
        ['BD-2025-0004', '네일샵', '자동 생성 포스팅 #1', '2025-12-05', '승인됨', 'https://blog.naver.com/auto1/345678', 'auto_345678'],
        ['BD-2025-0004', '네일샵', '자동 생성 포스팅 #2', '2025-12-06', '승인됨', 'https://blog.naver.com/auto2/345679', 'auto_345679'],
      ];
      const wsAuto = XLSX.utils.aoa_to_sheet(autoData);
      wsAuto['!cols'] = [
        { wch: 18 }, // 접수번호
        { wch: 20 }, // 업체명
        { wch: 40 }, // 작성제목
        { wch: 14 }, // 발행일
        { wch: 10 }, // 상태
        { wch: 45 }, // 블로그링크
        { wch: 18 }, // 블로그아이디
      ];
      XLSX.utils.book_append_sheet(wb, wsAuto, '자동화배포');
    }

    // 카페 침투 시트 - 콘텐츠 아이템 형식 (블로그 배포와 유사)
    if (allowedProducts.includes('cafe')) {
      const cafeData = [
        ['접수번호', '업체명', '작성제목', '발행일', '상태', '리뷰링크', '작성아이디', '카페명'],
        ['CM-2025-0001', '네일샵', '예쁜 네일 추천합니다!', '2025-12-05', '승인됨', 'https://cafe.naver.com/xxx/123456', 'nail_lover', '뷰티카페'],
        ['CM-2025-0001', '네일샵', '네일아트 후기 공유해요', '2025-12-06', '승인됨', 'https://cafe.naver.com/yyy/123457', 'beauty_queen', '셀프네일'],
        ['CM-2025-0002', '헤어샵', '염색 전문점 방문 후기', '2025-12-07', '대기', '', '', '헤어스타일'],
      ];
      const wsCafe = XLSX.utils.aoa_to_sheet(cafeData);
      wsCafe['!cols'] = [
        { wch: 18 }, // 접수번호
        { wch: 20 }, // 업체명
        { wch: 40 }, // 작성제목
        { wch: 14 }, // 발행일
        { wch: 10 }, // 상태
        { wch: 45 }, // 리뷰링크
        { wch: 18 }, // 작성아이디
        { wch: 15 }, // 카페명
      ];
      XLSX.utils.book_append_sheet(wb, wsCafe, '카페침투');
    }

    // 사용법 시트 추가 - 카테고리에 맞는 내용만 표시
    const guideData: (string | number)[][] = [
      ['📌 데이터 업로드 가이드'],
      [''],
      ['■ 접수번호 형식'],
    ];

    if (allowedProducts.includes('kakaomap')) {
      guideData.push(['  - K맵 리뷰: KM-2025-0001']);
    }
    if (allowedProducts.includes('receipt')) {
      guideData.push(['  - 방문자 리뷰: RR-2025-0001']);
    }
    if (allowedProducts.includes('blog_reviewer') || allowedProducts.includes('blog_video') || allowedProducts.includes('blog_automation')) {
      guideData.push(['  - 블로그 배포 (리뷰어/영상/자동화): BD-2025-0001']);
    }
    if (allowedProducts.includes('cafe')) {
      guideData.push(['  - 카페 침투: CM-2025-0001']);
    }

    guideData.push(
      [''],
      ['■ 날짜 형식'],
      ['  - YYYY-MM-DD (예: 2025-12-01)'],
      [''],
    );

    // K맵 전용 안내
    if (allowedProducts.includes('kakaomap')) {
      guideData.push(
        ['■ K맵 리뷰 시트 (리뷰 콘텐츠 관리)'],
        ['  - 접수번호: 해당 접수의 접수번호'],
        ['  - 리뷰원고: 카카오맵에 등록할/등록한 리뷰 내용'],
        ['  - 리뷰등록날짜: 카카오맵에 실제 리뷰가 등록된 날짜'],
        ['  - 영수증날짜: 영수증에 표시된 방문 날짜'],
        ['  - 상태: 대기, 승인됨, 수정요청 중 선택'],
        ['  - 리뷰링크: 카카오맵 리뷰 URL (선택)'],
        ['  - 리뷰아이디: 카카오맵 리뷰 고유 ID (선택)'],
        [''],
      );
    }

    // 방문자 리뷰 전용 안내
    if (allowedProducts.includes('receipt')) {
      guideData.push(
        ['■ 방문자 리뷰 시트 (네이버 리뷰) - K맵과 동일한 형식'],
        ['  - 접수번호: 해당 접수의 접수번호'],
        ['  - 리뷰원고: 네이버에 등록할/등록한 리뷰 내용'],
        ['  - 리뷰등록날짜: 네이버에 실제 리뷰가 등록된 날짜'],
        ['  - 영수증날짜: 영수증에 표시된 방문 날짜'],
        ['  - 상태: 대기, 승인됨, 수정요청 중 선택'],
        ['  - 리뷰링크: 네이버 리뷰 URL (선택)'],
        ['  - 리뷰아이디: 네이버 리뷰 고유 ID (선택)'],
        [''],
      );
    }

    // 블로그 배포 전용 안내 (3개 시트 공통)
    if (allowedProducts.includes('blog_reviewer') || allowedProducts.includes('blog_video') || allowedProducts.includes('blog_automation')) {
      guideData.push(
        ['■ 블로그 배포 시트 (리뷰어/영상/자동화 배포)'],
        ['  - 접수번호: 해당 접수의 접수번호 (BD-YYYY-XXXX)'],
        ['  - 업체명: 업체명 (참고용, DB 기준 자동 매칭)'],
        ['  - 작성제목: 블로그 포스팅 제목'],
        ['  - 발행일: 블로그에 실제 발행된 날짜 (YYYY-MM-DD)'],
        ['  - 상태: 대기, 승인됨, 수정요청 중 선택'],
        ['  - 블로그링크: 블로그 포스팅 URL (선택)'],
        ['  - 블로그아이디: 블로그 포스팅 고유 ID (선택)'],
        [''],
        ['  ※ 시트별 구분: 리뷰어배포, 영상배포, 자동화배포'],
        [''],
      );
    }

    // 카페 침투 전용 안내
    if (allowedProducts.includes('cafe')) {
      guideData.push(
        ['■ 카페 침투 시트 (카페 콘텐츠 관리)'],
        ['  - 접수번호: 해당 접수의 접수번호 (CM-YYYY-XXXX)'],
        ['  - 업체명: 업체명 (참고용, DB 기준 자동 매칭)'],
        ['  - 작성제목: 카페 게시글 제목'],
        ['  - 발행일: 카페에 실제 발행된 날짜 (YYYY-MM-DD)'],
        ['  - 상태: 대기, 승인됨, 수정요청 중 선택'],
        ['  - 리뷰링크: 카페 게시글 URL (선택)'],
        ['  - 작성아이디: 카페 작성자 ID (선택)'],
        ['  - 카페명: 게시된 카페 이름 (선택)'],
        [''],
      );
    }

    guideData.push(
      ['■ 중복 처리'],
      ['  - 동일 접수번호 + 동일 날짜 = 기존 데이터 업데이트'],
      ['  - 새로운 날짜 = 신규 데이터 추가'],
      [''],
      ['■ 주의사항'],
      ['  - 접수번호는 DB에 존재해야 합니다'],
      ['  - 업체명은 참고용 (DB 기준 자동 매칭)'],
    );
    const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
    wsGuide['!cols'] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsGuide, '사용법');

    // 파일 다운로드 - 카테고리별 파일명
    XLSX.writeFile(wb, CATEGORY_TEMPLATE_NAME[category]);
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
      setDeployResult(null);
    }
  };

  // 엑셀 파싱 및 검증
  const parseAndValidate = async () => {
    if (!file) return;

    setIsLoading(true);
    setDeployResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

      const sheets: SheetData[] = [];

      for (const sheetName of workbook.SheetNames) {
        const productType = SHEET_NAME_MAP[sheetName];
        if (!productType) {
          console.warn(`알 수 없는 시트: ${sheetName}`);
          continue;
        }

        // 현재 카테고리에 해당하지 않는 상품은 스킵
        if (!allowedProducts.includes(productType)) {
          continue;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) continue; // 헤더만 있거나 빈 시트

        const records: ParsedRecord[] = [];

        // 날짜 파싱 헬퍼 함수
        const parseDateValue = (dateValue: any): string => {
          if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
          } else if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue);
            if (!isNaN(parsed.getTime())) {
              return parsed.toISOString().split('T')[0];
            }
            return dateValue;
          } else if (typeof dateValue === 'number') {
            const excelDate = XLSX.SSF.parse_date_code(dateValue);
            return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
          }
          return '';
        };

        // 첫 행은 헤더, 두 번째 행부터 데이터
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[0]) continue; // 빈 행 스킵

          const submissionNumber = String(row[0] || '').trim();
          const companyName = String(row[1] || '').trim();

          // K맵 리뷰와 방문자 리뷰는 동일한 형식: 접수번호 | 업체명 | 리뷰원고 | 리뷰등록날짜 | 영수증날짜 | 상태 | 리뷰링크 | 리뷰아이디
          if (productType === 'kakaomap' || productType === 'receipt') {
            const scriptText = String(row[2] || '').trim();
            const reviewRegisteredDate = parseDateValue(row[3]);
            const receiptDate = parseDateValue(row[4]);
            const reviewStatus = String(row[5] || '대기').trim();
            const reviewLink = String(row[6] || '').trim();
            const reviewId = String(row[7] || '').trim();

            // 리뷰 유효성 검사
            let isValid = true;
            let errorMessage = '';

            const expectedPrefix = productType === 'kakaomap' ? 'KM' : 'RR';
            const prefixRegex = new RegExp(`^${expectedPrefix}-\\d{4}-\\d{4}$`);

            if (!submissionNumber) {
              isValid = false;
              errorMessage = '접수번호 필수';
            } else if (!prefixRegex.test(submissionNumber)) {
              isValid = false;
              errorMessage = `접수번호 형식 오류 (예: ${expectedPrefix}-2025-0001)`;
            } else if (!scriptText) {
              isValid = false;
              errorMessage = '리뷰원고 필수';
            } else if (!reviewRegisteredDate || !reviewRegisteredDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              isValid = false;
              errorMessage = '리뷰등록날짜 형식 오류';
            } else if (!receiptDate || !receiptDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              isValid = false;
              errorMessage = '영수증날짜 형식 오류';
            }

            records.push({
              row: i + 1,
              submissionNumber,
              companyName,
              date: reviewRegisteredDate, // 기본 날짜는 리뷰등록날짜로
              count: 0, // 리뷰는 유입수 사용 안함
              scriptText,
              notes: '',
              isValid,
              errorMessage,
              reviewRegisteredDate,
              receiptDate,
              reviewStatus,
              reviewLink,
              reviewId,
            });
            continue;
          }

          // 블로그 배포 (리뷰어/영상/자동화): 접수번호 | 업체명 | 작성제목 | 발행일 | 상태 | 블로그링크 | 블로그아이디
          if (productType === 'blog_reviewer' || productType === 'blog_video' || productType === 'blog_automation') {
            const blogTitle = String(row[2] || '').trim();
            const publishedDate = parseDateValue(row[3]);
            const blogStatus = String(row[4] || '대기').trim();
            const blogUrl = String(row[5] || '').trim();
            const blogId = String(row[6] || '').trim();

            // 블로그 유효성 검사
            let isValid = true;
            let errorMessage = '';

            if (!submissionNumber) {
              isValid = false;
              errorMessage = '접수번호 필수';
            } else if (!submissionNumber.match(/^BD-\d{4}-\d{4}$/)) {
              isValid = false;
              errorMessage = '접수번호 형식 오류 (예: BD-2025-0001)';
            } else if (!blogTitle) {
              isValid = false;
              errorMessage = '작성제목 필수';
            } else if (!publishedDate || !publishedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              isValid = false;
              errorMessage = '발행일 형식 오류 (YYYY-MM-DD)';
            }

            records.push({
              row: i + 1,
              submissionNumber,
              companyName,
              date: publishedDate, // 기본 날짜는 발행일로
              count: 0, // 블로그 배포는 유입수 사용 안함 (콘텐츠 아이템 개수로 진행률 계산)
              notes: '',
              isValid,
              errorMessage,
              blogTitle,
              publishedDate,
              blogStatus,
              blogUrl,
              blogId,
            });
            continue;
          }

          // 카페 침투 (콘텐츠 아이템): 접수번호 | 업체명 | 작성제목 | 발행일 | 상태 | 리뷰링크 | 작성아이디 | 카페명
          if (productType === 'cafe') {
            const cafePostTitle = String(row[2] || '').trim();
            const cafePublishedDate = parseDateValue(row[3]);
            const cafeStatus = String(row[4] || '대기').trim();
            const cafePostUrl = String(row[5] || '').trim();
            const cafeWriterId = String(row[6] || '').trim();
            const cafeName = String(row[7] || '').trim();

            // 카페 유효성 검사
            let isValid = true;
            let errorMessage = '';

            if (!submissionNumber) {
              isValid = false;
              errorMessage = '접수번호 필수';
            } else if (!submissionNumber.match(/^CM-\d{4}-\d{4}$/)) {
              isValid = false;
              errorMessage = '접수번호 형식 오류 (예: CM-2025-0001)';
            } else if (!cafePostTitle) {
              isValid = false;
              errorMessage = '작성제목 필수';
            } else if (!cafePublishedDate || !cafePublishedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              isValid = false;
              errorMessage = '발행일 형식 오류 (YYYY-MM-DD)';
            }

            records.push({
              row: i + 1,
              submissionNumber,
              companyName,
              date: cafePublishedDate, // 기본 날짜는 발행일로
              count: 0, // 카페 침투는 콘텐츠 아이템 개수로 진행률 계산
              notes: '',
              isValid,
              errorMessage,
              cafePostTitle,
              cafePublishedDate,
              cafeStatus,
              cafePostUrl,
              cafeWriterId,
              cafeName,
            });
            continue;
          }

          // 그 외 기타 타입 (현재는 사용 안함)
          continue;
        }

        if (records.length > 0) {
          sheets.push({
            productType,
            productName: PRODUCT_CONFIG[productType].name,
            records,
            validCount: records.filter((r) => r.isValid).length,
            invalidCount: records.filter((r) => !r.isValid).length,
          });
        }
      }

      // DB에서 접수번호 검증
      if (sheets.length > 0) {
        const allSubmissionNumbers = sheets.flatMap((s) =>
          s.records.filter((r) => r.isValid).map((r) => r.submissionNumber)
        );

        if (allSubmissionNumbers.length > 0) {
          const response = await fetch('/api/admin/data-management/validate-submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionNumbers: Array.from(new Set(allSubmissionNumbers)) }),
          });

          if (response.ok) {
            const validationData = await response.json();
            const validSubmissions = new Map<string, { id: string; company_name: string }>(
              validationData.submissions.map((s: { submission_number: string; id: string; company_name: string }) => [s.submission_number, s])
            );

            // 각 레코드에 검증 결과 적용
            for (const sheet of sheets) {
              for (const record of sheet.records) {
                if (record.isValid) {
                  const submission = validSubmissions.get(record.submissionNumber);
                  if (!submission) {
                    record.isValid = false;
                    record.errorMessage = '존재하지 않는 접수번호';
                  } else {
                    record.submissionId = submission.id;
                    // 업체명 불일치 검사 - 일치하지 않으면 에러 처리 (해당 레코드 업데이트 안됨)
                    if (record.companyName && submission.company_name !== record.companyName) {
                      record.isValid = false;
                      record.errorMessage = `업체명 불일치 (엑셀: ${record.companyName}, DB: ${submission.company_name})`;
                    }
                  }
                }
              }
              // 카운트 재계산
              sheet.validCount = sheet.records.filter((r) => r.isValid).length;
              sheet.invalidCount = sheet.records.filter((r) => !r.isValid).length;
            }
          }
        }
      }

      const result: ValidationResult = {
        sheets,
        totalRecords: sheets.reduce((sum, s) => sum + s.records.length, 0),
        validRecords: sheets.reduce((sum, s) => sum + s.validCount, 0),
        invalidRecords: sheets.reduce((sum, s) => sum + s.invalidCount, 0),
      };

      setValidationResult(result);
      if (sheets.length > 0) {
        setActiveTab(sheets[0].productType);
      }
    } catch (error) {
      console.error('파싱 오류:', error);
      setDeployResult({
        success: false,
        message: '엑셀 파일 파싱 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 배포 (DB 저장)
  const deployToDatabase = async () => {
    if (!validationResult || validationResult.validRecords === 0) return;

    setIsDeploying(true);

    try {
      const response = await fetch('/api/admin/data-management/bulk-daily-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheets: validationResult.sheets.map((sheet) => ({
            productType: sheet.productType,
            records: sheet.records
              .filter((r) => r.isValid && r.submissionId)
              .map((r) => ({
                submissionId: r.submissionId,
                companyName: r.companyName, // 업체명 검증용
                date: r.date,
                count: r.count,
                scriptText: r.scriptText,
                notes: r.notes,
                // K맵 리뷰 전용 필드
                reviewRegisteredDate: r.reviewRegisteredDate,
                receiptDate: r.receiptDate,
                reviewStatus: r.reviewStatus,
                reviewLink: r.reviewLink,
                reviewId: r.reviewId,
                // 블로그 배포 전용 필드
                blogTitle: r.blogTitle,
                publishedDate: r.publishedDate,
                blogStatus: r.blogStatus,
                blogUrl: r.blogUrl,
                blogId: r.blogId,
                // 카페 침투 전용 필드
                cafePostTitle: r.cafePostTitle,
                cafePublishedDate: r.cafePublishedDate,
                cafeStatus: r.cafeStatus,
                cafePostUrl: r.cafePostUrl,
                cafeWriterId: r.cafeWriterId,
                cafeName: r.cafeName,
              })),
          })),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const contentMsg = result.contentItemsCreated > 0
          ? ` (리뷰 원고 ${result.contentItemsCreated}건 생성)`
          : '';
        const progressMsg = result.progressUpdated > 0
          ? ` / ${result.progressUpdated}건 진행률 업데이트`
          : '';
        setDeployResult({
          success: true,
          message: `${result.totalSuccess}건이 성공적으로 저장되었습니다.${contentMsg}${progressMsg}`,
          details: {
            success: result.totalSuccess,
            failed: result.totalFailed,
            errors: result.errors || [],
          },
          progressDebug: result.progressDebug,
        });
        // 성공 후 초기화
        setFile(null);
        setValidationResult(null);
      } else {
        setDeployResult({
          success: false,
          message: result.error || '저장 중 오류가 발생했습니다.',
          details: result.details,
        });
      }
    } catch (error) {
      console.error('배포 오류:', error);
      setDeployResult({
        success: false,
        message: '서버 통신 중 오류가 발생했습니다.',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // 초기화
  const reset = () => {
    setFile(null);
    setValidationResult(null);
    setDeployResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Step 1: 템플릿 다운로드 */}
      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
        <FileSpreadsheet className="h-8 w-8 text-blue-600" />
        <div className="flex-1">
          <h3 className="font-medium">1. 엑셀 템플릿 다운로드</h3>
          <p className="text-sm text-muted-foreground">
            템플릿 파일을 다운로드하여 데이터를 입력하세요. 각 시트별로 상품이 구분됩니다.
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          템플릿 다운로드
        </Button>
      </div>

      {/* Step 2: 파일 업로드 */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-3">2. 엑셀 파일 업로드</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          {file && (
            <>
              <Button onClick={parseAndValidate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    파일 분석
                  </>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={reset}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        {file && (
          <p className="text-sm text-muted-foreground mt-2">
            선택된 파일: {file.name}
          </p>
        )}
      </div>

      {/* Step 3: 미리보기 및 검증 결과 */}
      {validationResult && (
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">3. 데이터 미리보기 및 검증</h3>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                유효: {validationResult.validRecords}건
              </Badge>
              {validationResult.invalidRecords > 0 && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <XCircle className="h-3 w-3 mr-1" />
                  오류: {validationResult.invalidRecords}건
                </Badge>
              )}
            </div>
          </div>

          {validationResult.sheets.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>데이터 없음</AlertTitle>
              <AlertDescription>
                유효한 시트가 없습니다. 시트 이름이 올바른지 확인하세요.
                (K맵리뷰, 방문자리뷰, 블로그배포, 카페침투)
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {validationResult.sheets.map((sheet) => (
                  <TabsTrigger key={sheet.productType} value={sheet.productType}>
                    {sheet.productName}
                    <Badge variant="secondary" className="ml-2">
                      {sheet.records.length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {validationResult.sheets.map((sheet) => (
                <TabsContent key={sheet.productType} value={sheet.productType}>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">행</TableHead>
                            <TableHead className="w-12">검증</TableHead>
                            <TableHead>접수번호</TableHead>
                            <TableHead>업체명</TableHead>
                            {(sheet.productType === 'kakaomap' || sheet.productType === 'receipt') ? (
                              <>
                                <TableHead>리뷰원고</TableHead>
                                <TableHead>리뷰등록날짜</TableHead>
                                <TableHead>영수증날짜</TableHead>
                                <TableHead>상태</TableHead>
                                <TableHead>리뷰링크</TableHead>
                                <TableHead>리뷰아이디</TableHead>
                              </>
                            ) : (sheet.productType === 'blog_reviewer' || sheet.productType === 'blog_video' || sheet.productType === 'blog_automation') ? (
                              <>
                                <TableHead>작성제목</TableHead>
                                <TableHead>발행일</TableHead>
                                <TableHead>상태</TableHead>
                                <TableHead>블로그링크</TableHead>
                                <TableHead>블로그아이디</TableHead>
                              </>
                            ) : sheet.productType === 'cafe' ? (
                              <>
                                <TableHead>작성제목</TableHead>
                                <TableHead>발행일</TableHead>
                                <TableHead>상태</TableHead>
                                <TableHead>리뷰링크</TableHead>
                                <TableHead>작성아이디</TableHead>
                                <TableHead>카페명</TableHead>
                              </>
                            ) : (
                              <>
                                <TableHead>날짜</TableHead>
                                <TableHead className="text-right">완료수</TableHead>
                                <TableHead>메모</TableHead>
                              </>
                            )}
                            <TableHead>비고</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sheet.records.map((record, idx) => (
                            <TableRow
                              key={idx}
                              className={!record.isValid ? 'bg-red-50' : ''}
                            >
                              <TableCell className="text-muted-foreground">
                                {record.row}
                              </TableCell>
                              <TableCell>
                                {record.isValid ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {record.submissionNumber}
                              </TableCell>
                              <TableCell>{record.companyName}</TableCell>
                              {(sheet.productType === 'kakaomap' || sheet.productType === 'receipt') ? (
                                <>
                                  <TableCell className="max-w-[200px]">
                                    {record.scriptText ? (
                                      <span
                                        className="text-xs text-blue-600 truncate block"
                                        title={record.scriptText}
                                      >
                                        {record.scriptText.slice(0, 30)}
                                        {record.scriptText.length > 30 && '...'}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{record.reviewRegisteredDate}</TableCell>
                                  <TableCell>{record.receiptDate}</TableCell>
                                  <TableCell>
                                    <Badge variant={record.reviewStatus === '승인됨' ? 'default' : 'secondary'}>
                                      {record.reviewStatus}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[150px]">
                                    {record.reviewLink ? (
                                      <a
                                        href={record.reviewLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline truncate block"
                                        title={record.reviewLink}
                                      >
                                        {record.reviewLink.slice(0, 25)}...
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {record.reviewId || <span className="text-gray-400">-</span>}
                                  </TableCell>
                                </>
                              ) : (sheet.productType === 'blog_reviewer' || sheet.productType === 'blog_video' || sheet.productType === 'blog_automation') ? (
                                <>
                                  <TableCell className="max-w-[200px]">
                                    {record.blogTitle ? (
                                      <span
                                        className="text-xs text-blue-600 truncate block"
                                        title={record.blogTitle}
                                      >
                                        {record.blogTitle.slice(0, 30)}
                                        {record.blogTitle.length > 30 && '...'}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{record.publishedDate}</TableCell>
                                  <TableCell>
                                    <Badge variant={record.blogStatus === '승인됨' ? 'default' : 'secondary'}>
                                      {record.blogStatus}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[150px]">
                                    {record.blogUrl ? (
                                      <a
                                        href={record.blogUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline truncate block"
                                        title={record.blogUrl}
                                      >
                                        {record.blogUrl.slice(0, 25)}...
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {record.blogId || <span className="text-gray-400">-</span>}
                                  </TableCell>
                                </>
                              ) : sheet.productType === 'cafe' ? (
                                <>
                                  <TableCell className="max-w-[200px]">
                                    {record.cafePostTitle ? (
                                      <span
                                        className="text-xs text-blue-600 truncate block"
                                        title={record.cafePostTitle}
                                      >
                                        {record.cafePostTitle.slice(0, 30)}
                                        {record.cafePostTitle.length > 30 && '...'}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{record.cafePublishedDate}</TableCell>
                                  <TableCell>
                                    <Badge variant={record.cafeStatus === '승인됨' ? 'default' : 'secondary'}>
                                      {record.cafeStatus}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[150px]">
                                    {record.cafePostUrl ? (
                                      <a
                                        href={record.cafePostUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline truncate block"
                                        title={record.cafePostUrl}
                                      >
                                        {record.cafePostUrl.slice(0, 25)}...
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {record.cafeWriterId || <span className="text-gray-400">-</span>}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {record.cafeName || <span className="text-gray-400">-</span>}
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell>{record.date}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    {record.count.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate">
                                    {record.notes}
                                  </TableCell>
                                </>
                              )}
                              <TableCell>
                                {record.errorMessage && (
                                  <span
                                    className={`text-xs ${
                                      record.isValid
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                    }`}
                                  >
                                    {record.errorMessage}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    유효: {sheet.validCount}건 / 오류: {sheet.invalidCount}건
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Step 4: 배포 버튼 */}
          {validationResult.validRecords > 0 && (
            <div className="mt-6 flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-medium text-green-800">4. 데이터 배포</h3>
                <p className="text-sm text-green-600">
                  {validationResult.validRecords}건의 데이터가 데이터베이스에 저장됩니다.
                  {validationResult.invalidRecords > 0 &&
                    ` (${validationResult.invalidRecords}건 오류 제외)`}
                </p>
              </div>
              <Button
                onClick={deployToDatabase}
                disabled={isDeploying}
                className="bg-green-600 hover:bg-green-700"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    배포하기
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 결과 알림 */}
      {deployResult && (
        <Alert variant={deployResult.success ? 'default' : 'destructive'}>
          {deployResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>{deployResult.success ? '완료' : '오류'}</AlertTitle>
          <AlertDescription>
            {deployResult.message}
            {deployResult.details && deployResult.details.errors.length > 0 && (
              <ul className="mt-2 text-sm list-disc list-inside">
                {deployResult.details.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {deployResult.details.errors.length > 5 && (
                  <li>...외 {deployResult.details.errors.length - 5}건</li>
                )}
              </ul>
            )}
            {/* 진행률 디버그 정보 */}
            {deployResult.progressDebug && deployResult.progressDebug.length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="font-medium text-gray-700 mb-2">📊 진행률 업데이트 디버그:</p>
                {deployResult.progressDebug.map((debug, i) => (
                  <div key={i} className="text-xs font-mono mb-1">
                    <span className="text-blue-600">{debug.submissionId.slice(0, 8)}...</span>
                    {' | '}콘텐츠: <span className="text-green-600">{debug.contentCount ?? 'null'}</span>
                    {' | '}목표: <span className="text-orange-600">{debug.totalCount}</span>
                    {' | '}진행률: <span className="font-bold text-purple-600">{debug.progressPercentage}%</span>
                    {' | '}상태: {debug.status}
                    {debug.updateError && (
                      <span className="text-red-600 ml-2">❌ {debug.updateError}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
