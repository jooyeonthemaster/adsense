/**
 * 대량 접수 엑셀 템플릿 생성기
 */

import * as XLSX from 'xlsx';
import type { BulkSubmissionProduct } from '../types';
import { BULK_PRODUCT_CONFIG, TEMPLATE_FILE_NAMES } from '../constants';

// 시트 열 너비 설정 헬퍼
const setColumnWidths = (worksheet: XLSX.WorkSheet, widths: number[]) => {
  worksheet['!cols'] = widths.map((wch) => ({ wch }));
};

/**
 * 영수증 리뷰 템플릿 시트 생성
 */
export function createReceiptSheet(): XLSX.WorkSheet {
  const data = [
    // 헤더
    [
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
    // 예시 데이터 1
    [
      1,
      30,
      10,
      3,
      'https://m.place.naver.com/restaurant/1234567890',
      '2025-02-01',
      '월,화,수,목,금',
      '09:00~18:00',
      0,
      '2025-01-01~2025-01-31',
      '음식 맛과 서비스에 대해 긍정적으로 작성해주세요.',
      '',
      '',
    ],
    // 예시 데이터 2
    [
      2,
      21,
      7,
      2,
      'https://m.place.naver.com/place/9876543210',
      '2025-02-03',
      '',
      '',
      1,
      '',
      '친절한 서비스 강조',
      '',
      '',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [8, 10, 10, 15, 45, 25, 20, 20, 30, 25, 40, 30, 35]);
  return ws;
}

/**
 * 블로그 배포 템플릿 시트 생성
 */
export function createBlogSheet(): XLSX.WorkSheet {
  const data = [
    // 헤더
    [
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
    // 예시 데이터 1 - 리뷰어 배포
    [
      '',
      '리뷰어',
      '2025-02-01',
      '2025-02-20',
      '후기성',
      'https://m.place.naver.com/restaurant/1234567890',
      5,
      100,
      20,
    ],
    // 예시 데이터 2 - 247 배포
    [
      '',
      '247',
      '2025-02-03',
      '2025-02-17',
      '정보성',
      'https://m.place.naver.com/place/9876543210',
      3,
      45,
      15,
    ],
    // 예시 데이터 3 - 자동화 배포
    [
      '',
      '자동화',
      '2025-02-05',
      '2025-02-14',
      '후기성',
      'https://m.place.naver.com/cafe/1122334455',
      4,
      40,
      10,
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [15, 12, 12, 12, 12, 50, 10, 10, 8]);
  return ws;
}

/**
 * 트래픽/리워드 템플릿 시트 생성
 */
export function createPlaceSheet(): XLSX.WorkSheet {
  const data = [
    // 헤더
    [
      '광고주 아이디',
      '상품명',
      'URL (m. 으로 시작하는 모바일링크 기재)',
      '목표 키워드',
      '시작일',
      '종료일',
      '구동 일수',
      '일 수량',
    ],
    // 예시 데이터 1
    [
      '',
      '맛있는 식당',
      'https://m.place.naver.com/restaurant/1234567890',
      '강남 맛집, 데이트 코스',
      '2025-02-01',
      '2025-02-05',
      5,
      500,
    ],
    // 예시 데이터 2
    [
      '',
      '예쁜 카페',
      'https://m.place.naver.com/cafe/9876543210',
      '분위기 좋은 카페',
      '2025-02-03',
      '2025-02-09',
      7,
      300,
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [15, 20, 50, 30, 12, 12, 12, 12]);
  return ws;
}

/**
 * 사용법 시트 생성
 */
export function createGuideSheet(productType: BulkSubmissionProduct): XLSX.WorkSheet {
  const guideData: (string | number)[][] = [['📌 대량 접수 가이드'], ['']];

  if (productType === 'receipt') {
    guideData.push(
      ['■ 영수증 리뷰 대량 접수'],
      [''],
      ['필수 입력 항목:'],
      ['  - 순번: 자동 증가 번호'],
      ['  - 총 수량: 총 발행 건수'],
      ['  - 일 수량: 일일 발행 건수 (1~10건)'],
      ['  - 플레이스 주소: 네이버 플레이스 URL'],
      [''],
      ['선택 입력 항목:'],
      ['  - 발행 시작 날짜 지정: YYYY-MM-DD 형식'],
      ['  - 발행 요일 지정: 예) 월,화,수'],
      ['  - 발행 시간대 지정: 예) 09:00~18:00'],
      ['  - 이미지 랜덤여부: 0=순서대로, 1=랜덤'],
      ['  - 방문 일자 범위: 예) 2025-01-01~2025-01-31'],
      ['  - 가이드 라인: 리뷰 작성 가이드'],
      ['  - 원고 직접 등록: 직접 작성한 원고'],
      [''],
      ['검증 규칙:'],
      ['  - 일 수량: 1~10건'],
      ['  - 총 수량 = 일 수량 × 구동일수'],
      ['  - 플레이스 주소: 유효한 네이버 플레이스 URL']
    );
  } else if (
    productType === 'blog_reviewer' ||
    productType === 'blog_video' ||
    productType === 'blog_automation'
  ) {
    guideData.push(
      ['■ 블로그 배포 대량 접수'],
      [''],
      ['필수 입력 항목:'],
      ['  - 배포유형: 리뷰어 / 247 / 자동화'],
      ['  - 시작날짜: YYYY-MM-DD 형식'],
      ['  - 글타입: 후기성 / 정보성'],
      ['  - 플레이스링크: 플레이스 또는 외부 URL'],
      ['  - 일갯수: 일일 배포 건수 (3건 이상)'],
      ['  - 총갯수: 총 배포 건수 (30건 이상)'],
      ['  - 일수: 구동일수 (10~30일)'],
      [''],
      ['선택 입력 항목:'],
      ['  - 광고주 아이디: 시스템에서 자동 할당'],
      ['  - 종료날짜: 자동 계산 가능'],
      [''],
      ['검증 규칙:'],
      ['  - 일갯수 ≥ 3건'],
      ['  - 총갯수 ≥ 30건'],
      ['  - 일수: 10~30일'],
      ['  - 배포유형: 리뷰어, 247, 자동화 중 선택'],
      ['  - 글타입: 후기성, 정보성 중 선택']
    );
  } else if (productType === 'place') {
    guideData.push(
      ['■ 트래픽/리워드 대량 접수'],
      [''],
      ['필수 입력 항목:'],
      ['  - 상품명: 업체명'],
      ['  - URL: m.place.naver.com 형식의 모바일 링크'],
      ['  - 시작일: YYYY-MM-DD 형식'],
      ['  - 구동 일수: 3~7일'],
      ['  - 일 수량: 일일 유입량 (100타 이상, 100단위)'],
      [''],
      ['선택 입력 항목:'],
      ['  - 광고주 아이디: 시스템에서 자동 할당'],
      ['  - 목표 키워드: 검색 키워드'],
      ['  - 종료일: 자동 계산 가능'],
      [''],
      ['검증 규칙:'],
      ['  - 일 수량 ≥ 100타 (100단위)'],
      ['  - 구동 일수: 3~7일'],
      ['  - URL: m.place.naver.com 형식']
    );
  }

  guideData.push(
    [''],
    ['■ 공통 주의사항'],
    ['  - 필수 항목 미입력 시 접수가 불가능합니다'],
    ['  - 오류가 있는 행이 하나라도 있으면 전체 접수가 취소됩니다'],
    ['  - 포인트가 부족하면 접수가 불가능합니다'],
    ['  - 업로드 전 미리보기에서 검증 결과를 확인해주세요']
  );

  const ws = XLSX.utils.aoa_to_sheet(guideData);
  ws['!cols'] = [{ wch: 60 }];
  return ws;
}

/**
 * 상품별 템플릿 다운로드
 */
export function downloadBulkTemplate(productType: BulkSubmissionProduct) {
  const wb = XLSX.utils.book_new();
  const config = BULK_PRODUCT_CONFIG[productType];

  // 상품별 시트 추가
  if (productType === 'receipt') {
    XLSX.utils.book_append_sheet(wb, createReceiptSheet(), config.sheetName);
  } else if (
    productType === 'blog_reviewer' ||
    productType === 'blog_video' ||
    productType === 'blog_automation'
  ) {
    // 블로그 배포는 모두 같은 양식 사용
    XLSX.utils.book_append_sheet(wb, createBlogSheet(), '블로그배포');
  } else if (productType === 'place') {
    XLSX.utils.book_append_sheet(wb, createPlaceSheet(), config.sheetName);
  }

  // 사용법 시트 추가
  XLSX.utils.book_append_sheet(wb, createGuideSheet(productType), '사용법');

  // 파일 다운로드
  XLSX.writeFile(wb, TEMPLATE_FILE_NAMES[productType]);
}

/**
 * 모든 상품 통합 템플릿 다운로드
 */
export function downloadAllTemplates() {
  const wb = XLSX.utils.book_new();

  // 영수증 리뷰
  XLSX.utils.book_append_sheet(wb, createReceiptSheet(), '영수증리뷰');

  // 블로그 배포
  XLSX.utils.book_append_sheet(wb, createBlogSheet(), '블로그배포');

  // 트래픽/리워드
  XLSX.utils.book_append_sheet(wb, createPlaceSheet(), '리워드');

  // 사용법 (블로그 배포 기준)
  XLSX.utils.book_append_sheet(wb, createGuideSheet('blog_reviewer'), '사용법');

  // 파일 다운로드
  XLSX.writeFile(wb, '대량접수_통합_템플릿.xlsx');
}
