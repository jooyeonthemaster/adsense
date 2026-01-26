/**
 * 대량 접수 엑셀 파서 및 검증기
 */

import * as XLSX from 'xlsx';
import type {
  BulkSubmissionProduct,
  BulkSubmissionRow,
  ParsedSubmissionRecord,
  ReceiptBulkRow,
  BlogBulkRow,
  PlaceBulkRow,
} from '../types';
import {
  BULK_PRODUCT_CONFIG,
  SHEET_TO_PRODUCT_MAP,
  DISTRIBUTION_TYPE_MAP,
  DISTRIBUTION_TO_PRODUCT_TYPE,
  CONTENT_TYPE_MAP,
  DATE_REGEX,
  NAVER_PLACE_URL_PATTERNS,
  KAKAO_PLACE_URL_PATTERNS,
  MOBILE_PLACE_URL_PATTERN,
  ERROR_MESSAGES,
} from '../constants';

/**
 * 엑셀 파일 파싱
 */
export async function parseExcelFile(file: File): Promise<{
  sheets: Record<string, unknown[]>;
  sheetNames: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheets: Record<string, unknown[]> = {};
        const sheetNames = workbook.SheetNames.filter((name) => name !== '사용법');

        sheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name];
          sheets[name] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        });

        resolve({ sheets, sheetNames });
      } catch (error) {
        reject(new Error('엑셀 파일 파싱 실패'));
      }
    };

    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 시트명에서 상품 타입 추출
 */
export function getProductTypeFromSheetName(sheetName: string): BulkSubmissionProduct | null {
  // 정확히 매칭
  if (SHEET_TO_PRODUCT_MAP[sheetName]) {
    return SHEET_TO_PRODUCT_MAP[sheetName];
  }

  // 부분 매칭
  const normalizedName = sheetName.replace(/\s/g, '').toLowerCase();
  for (const [key, value] of Object.entries(SHEET_TO_PRODUCT_MAP)) {
    if (normalizedName.includes(key.replace(/\s/g, '').toLowerCase())) {
      return value;
    }
  }

  return null;
}

/**
 * 날짜 형식 검증
 */
export function validateDateFormat(dateStr: string): boolean {
  if (!dateStr) return true; // 선택 필드는 빈 값 허용
  return DATE_REGEX.test(dateStr);
}

/**
 * 플레이스 URL 검증 (네이버 + 카카오)
 */
export function validatePlaceUrl(url: string): boolean {
  if (!url) return false;
  // 네이버 플레이스 URL 확인
  if (NAVER_PLACE_URL_PATTERNS.some((pattern) => pattern.test(url))) {
    return true;
  }
  // 카카오맵 URL 확인
  if (KAKAO_PLACE_URL_PATTERNS.some((pattern) => pattern.test(url))) {
    return true;
  }
  return false;
}

/**
 * 모바일 플레이스 URL 검증
 */
export function validateMobilePlaceUrl(url: string): boolean {
  if (!url) return false;
  return MOBILE_PLACE_URL_PATTERN.test(url);
}

/**
 * 영수증 리뷰 행 검증
 */
function validateReceiptRow(
  row: ReceiptBulkRow,
  rowNumber: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = BULK_PRODUCT_CONFIG.receipt;

  // 필수 필드 검증
  if (!row['순번'] && row['순번'] !== 0) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('순번'));
  }
  if (!row['총 수량']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('총 수량'));
  }
  if (!row['일 수량']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('일 수량'));
  }
  if (!row['플레이스 주소']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('플레이스 주소'));
  }

  // 일 수량 범위 검증
  const dailyCount = Number(row['일 수량']);
  if (dailyCount && config.validation.dailyCountMin && dailyCount < config.validation.dailyCountMin) {
    errors.push(ERROR_MESSAGES.DAILY_COUNT_MIN(config.validation.dailyCountMin));
  }
  if (dailyCount && config.validation.dailyCountMax && dailyCount > config.validation.dailyCountMax) {
    errors.push(ERROR_MESSAGES.DAILY_COUNT_MAX(config.validation.dailyCountMax));
  }

  // 총 수량 일관성 검증 (총 수량과 일 수량이 있을 때만)
  const totalCount = Number(row['총 수량']);
  if (totalCount && dailyCount) {
    // 총 수량 / 일 수량 = 구동일수 (정수여야 함)
    const operationDays = totalCount / dailyCount;
    if (!Number.isInteger(operationDays)) {
      errors.push(ERROR_MESSAGES.TOTAL_COUNT_MISMATCH);
    } else if (
      config.validation.operationDaysMin &&
      operationDays < config.validation.operationDaysMin
    ) {
      errors.push(ERROR_MESSAGES.OPERATION_DAYS_MIN(config.validation.operationDaysMin));
    }
  }

  // 플레이스 URL 검증
  if (row['플레이스 주소'] && !validatePlaceUrl(row['플레이스 주소'])) {
    errors.push(ERROR_MESSAGES.INVALID_PLACE_URL);
  }

  // 날짜 형식 검증
  if (
    row['발행 시작 날짜 지정 (선택)'] &&
    !validateDateFormat(String(row['발행 시작 날짜 지정 (선택)']))
  ) {
    errors.push(ERROR_MESSAGES.INVALID_DATE_FORMAT);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 블로그 배포 행 검증
 */
function validateBlogRow(
  row: BlogBulkRow,
  rowNumber: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = BULK_PRODUCT_CONFIG.blog_reviewer; // 모든 블로그 배포는 같은 규칙

  // 필수 필드 검증
  if (!row['배포유형']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('배포유형'));
  }
  if (!row['시작날짜']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('시작날짜'));
  }
  if (!row['글타입']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('글타입'));
  }
  if (!row['플레이스링크']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('플레이스링크'));
  }
  if (!row['일갯수']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('일갯수'));
  }
  if (!row['총갯수']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('총갯수'));
  }
  if (!row['일수']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('일수'));
  }

  // 배포유형 검증
  const distributionType = row['배포유형']?.toString().trim();
  if (distributionType && !DISTRIBUTION_TYPE_MAP[distributionType]) {
    errors.push(ERROR_MESSAGES.INVALID_DISTRIBUTION_TYPE);
  }

  // 글타입 검증
  const contentType = row['글타입']?.toString().trim();
  if (contentType && !CONTENT_TYPE_MAP[contentType]) {
    errors.push(ERROR_MESSAGES.INVALID_CONTENT_TYPE);
  }

  // 일갯수 범위 검증
  const dailyCount = Number(row['일갯수']);
  if (dailyCount && config.validation.dailyCountMin && dailyCount < config.validation.dailyCountMin) {
    errors.push(ERROR_MESSAGES.DAILY_COUNT_MIN(config.validation.dailyCountMin));
  }

  // 총갯수 범위 검증
  const totalCount = Number(row['총갯수']);
  if (totalCount && config.validation.totalCountMin && totalCount < config.validation.totalCountMin) {
    errors.push(ERROR_MESSAGES.TOTAL_COUNT_MIN(config.validation.totalCountMin));
  }

  // 일수 범위 검증
  const operationDays = Number(row['일수']);
  if (
    operationDays &&
    config.validation.operationDaysMin &&
    operationDays < config.validation.operationDaysMin
  ) {
    errors.push(ERROR_MESSAGES.OPERATION_DAYS_MIN(config.validation.operationDaysMin));
  }
  if (
    operationDays &&
    config.validation.operationDaysMax &&
    operationDays > config.validation.operationDaysMax
  ) {
    errors.push(ERROR_MESSAGES.OPERATION_DAYS_MAX(config.validation.operationDaysMax));
  }

  // 총갯수 일관성 검증
  if (dailyCount && operationDays && totalCount) {
    const calculatedTotal = dailyCount * operationDays;
    if (calculatedTotal !== totalCount) {
      errors.push(ERROR_MESSAGES.TOTAL_COUNT_MISMATCH);
    }
  }

  // 날짜 형식 검증
  if (row['시작날짜'] && !validateDateFormat(String(row['시작날짜']))) {
    errors.push(ERROR_MESSAGES.INVALID_DATE_FORMAT);
  }
  if (row['종료날짜'] && !validateDateFormat(String(row['종료날짜']))) {
    errors.push(ERROR_MESSAGES.INVALID_DATE_FORMAT);
  }

  // 플레이스 URL 검증
  if (row['플레이스링크'] && !validatePlaceUrl(row['플레이스링크'])) {
    errors.push(ERROR_MESSAGES.INVALID_PLACE_URL);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 트래픽/리워드 행 검증
 */
function validatePlaceRow(
  row: PlaceBulkRow,
  rowNumber: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = BULK_PRODUCT_CONFIG.place;

  // 필수 필드 검증
  if (!row['상품명']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('상품명'));
  }
  if (!row['URL (m. 으로 시작하는 모바일링크 기재)']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('URL'));
  }
  if (!row['시작일']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('시작일'));
  }
  if (!row['구동 일수']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('구동 일수'));
  }
  if (!row['일 수량']) {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD('일 수량'));
  }

  // 일 수량 범위 검증
  const dailyCount = Number(row['일 수량']);
  if (dailyCount && config.validation.dailyCountMin && dailyCount < config.validation.dailyCountMin) {
    errors.push(ERROR_MESSAGES.DAILY_COUNT_MIN(config.validation.dailyCountMin));
  }

  // 일 수량 단위 검증 (100단위)
  if (dailyCount && config.validation.dailyCountStep && dailyCount % config.validation.dailyCountStep !== 0) {
    errors.push(ERROR_MESSAGES.DAILY_COUNT_STEP(config.validation.dailyCountStep));
  }

  // 구동 일수 범위 검증
  const operationDays = Number(row['구동 일수']);
  if (
    operationDays &&
    config.validation.operationDaysMin &&
    operationDays < config.validation.operationDaysMin
  ) {
    errors.push(ERROR_MESSAGES.OPERATION_DAYS_MIN(config.validation.operationDaysMin));
  }
  if (
    operationDays &&
    config.validation.operationDaysMax &&
    operationDays > config.validation.operationDaysMax
  ) {
    errors.push(ERROR_MESSAGES.OPERATION_DAYS_MAX(config.validation.operationDaysMax));
  }

  // 모바일 플레이스 URL 검증
  const url = row['URL (m. 으로 시작하는 모바일링크 기재)'];
  if (url && !validateMobilePlaceUrl(url)) {
    errors.push(ERROR_MESSAGES.INVALID_MOBILE_URL);
  }

  // 날짜 형식 검증
  if (row['시작일'] && !validateDateFormat(String(row['시작일']))) {
    errors.push(ERROR_MESSAGES.INVALID_DATE_FORMAT);
  }
  if (row['종료일'] && !validateDateFormat(String(row['종료일']))) {
    errors.push(ERROR_MESSAGES.INVALID_DATE_FORMAT);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 행 검증 (상품 타입에 따라 분기)
 */
export function validateRow(
  row: BulkSubmissionRow,
  productType: BulkSubmissionProduct,
  rowNumber: number
): { isValid: boolean; errors: string[] } {
  switch (productType) {
    case 'receipt':
      return validateReceiptRow(row as ReceiptBulkRow, rowNumber);
    case 'blog_reviewer':
    case 'blog_video':
    case 'blog_automation':
      return validateBlogRow(row as BlogBulkRow, rowNumber);
    case 'place':
      return validatePlaceRow(row as PlaceBulkRow, rowNumber);
    default:
      return { isValid: false, errors: ['알 수 없는 상품 타입'] };
  }
}

/**
 * 엑셀 파일 파싱 및 검증 (메인 함수)
 */
export async function parseBulkSubmissionFile(
  file: File,
  expectedProductType?: BulkSubmissionProduct
): Promise<ParsedSubmissionRecord[]> {
  const { sheets, sheetNames } = await parseExcelFile(file);

  if (sheetNames.length === 0) {
    throw new Error('유효한 시트가 없습니다');
  }

  const records: ParsedSubmissionRecord[] = [];

  for (const sheetName of sheetNames) {
    const rows = sheets[sheetName] as BulkSubmissionRow[];
    const productType = expectedProductType || getProductTypeFromSheetName(sheetName);

    if (!productType) {
      // 알 수 없는 시트는 건너뛰기
      continue;
    }

    rows.forEach((row, index) => {
      // 빈 행 건너뛰기
      if (Object.values(row).every((v) => v === '' || v === undefined || v === null)) {
        return;
      }

      const rowNumber = index + 2; // 헤더 행 + 0-indexed

      // 블로그 배포 시트인 경우 각 행의 '배포유형'에서 상품 타입 결정
      let rowProductType = productType;
      const blogRow = row as BlogBulkRow;
      if (blogRow['배포유형']) {
        const distributionType = blogRow['배포유형'].toString().trim();
        const mappedProductType = DISTRIBUTION_TO_PRODUCT_TYPE[distributionType];
        if (mappedProductType) {
          rowProductType = mappedProductType;
        }
      }

      const validation = validateRow(row, rowProductType, rowNumber);

      records.push({
        row: rowNumber,
        productType: rowProductType,
        data: row,
        isValid: validation.isValid,
        errors: validation.errors,
      });
    });
  }

  return records;
}

/**
 * 블로그 배포 행에서 배포 유형 추출
 */
export function getDistributionTypeFromRow(row: BlogBulkRow): 'reviewer' | 'video' | 'automation' | null {
  const distributionType = row['배포유형']?.toString().trim();
  return DISTRIBUTION_TYPE_MAP[distributionType] || null;
}

/**
 * 블로그 배포 행에서 콘텐츠 유형 추출
 */
export function getContentTypeFromRow(row: BlogBulkRow): 'review' | 'info' | null {
  const contentType = row['글타입']?.toString().trim();
  return CONTENT_TYPE_MAP[contentType] || null;
}
