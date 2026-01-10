import * as XLSX from 'xlsx';
import type { ProductType, ParsedRecord, SheetData, ValidationResult } from '../types';
import { SHEET_NAME_MAP, PRODUCT_CONFIG, REVIEW_PRODUCT_TYPES, BLOG_PRODUCT_TYPES } from '../constants';

// 날짜 파싱 헬퍼 함수
export function parseDateValue(dateValue: unknown): string {
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
}

// 날짜 형식 검증
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// 접수번호 형식 검증
export function validateSubmissionNumber(submissionNumber: string, productType: ProductType): { isValid: boolean; errorMessage?: string } {
  if (!submissionNumber) {
    return { isValid: false, errorMessage: '접수번호 필수' };
  }

  const prefixMap: Record<ProductType, string> = {
    kakaomap: 'KM',
    receipt: 'RR',
    blog_reviewer: 'BD',
    blog_video: 'BD',
    blog_automation: 'BD',
    cafe: 'CM',
    community: 'CM',
  };

  const expectedPrefix = prefixMap[productType];
  const prefixRegex = new RegExp(`^${expectedPrefix}-\\d{4}-\\d{4}$`);

  if (!prefixRegex.test(submissionNumber)) {
    return {
      isValid: false,
      errorMessage: `접수번호 형식 오류 (예: ${expectedPrefix}-2025-0001)`,
    };
  }

  return { isValid: true };
}

// 리뷰 레코드 파싱 (K맵, 방문자 리뷰)
function parseReviewRecord(
  row: unknown[],
  rowIndex: number,
  productType: ProductType
): ParsedRecord {
  const submissionNumber = String(row[0] || '').trim();
  const companyName = String(row[1] || '').trim();
  const scriptText = String(row[2] || '').trim();
  const reviewRegisteredDate = parseDateValue(row[3]);
  const receiptDate = parseDateValue(row[4]);
  const reviewStatus = String(row[5] || '대기').trim();
  const reviewLink = String(row[6] || '').trim();
  const reviewId = String(row[7] || '').trim();

  // 유효성 검사
  let isValid = true;
  let errorMessage = '';

  const submissionValidation = validateSubmissionNumber(submissionNumber, productType);
  if (!submissionValidation.isValid) {
    isValid = false;
    errorMessage = submissionValidation.errorMessage || '';
  } else if (!scriptText) {
    isValid = false;
    errorMessage = '리뷰원고 필수';
  } else if (!reviewRegisteredDate || !isValidDateFormat(reviewRegisteredDate)) {
    isValid = false;
    errorMessage = '리뷰등록날짜 형식 오류';
  } else if (!receiptDate || !isValidDateFormat(receiptDate)) {
    isValid = false;
    errorMessage = '영수증날짜 형식 오류';
  }

  return {
    row: rowIndex + 1,
    submissionNumber,
    companyName,
    date: reviewRegisteredDate,
    count: 0,
    scriptText,
    notes: '',
    isValid,
    errorMessage,
    reviewRegisteredDate,
    receiptDate,
    reviewStatus,
    reviewLink,
    reviewId,
  };
}

// 블로그 배포 레코드 파싱
function parseBlogRecord(
  row: unknown[],
  rowIndex: number,
  productType: ProductType
): ParsedRecord {
  const submissionNumber = String(row[0] || '').trim();
  const companyName = String(row[1] || '').trim();
  const blogTitle = String(row[2] || '').trim();
  const publishedDate = parseDateValue(row[3]);
  const blogStatus = String(row[4] || '대기').trim();
  const blogUrl = String(row[5] || '').trim();
  const blogId = String(row[6] || '').trim();

  // 유효성 검사
  let isValid = true;
  let errorMessage = '';

  const submissionValidation = validateSubmissionNumber(submissionNumber, productType);
  if (!submissionValidation.isValid) {
    isValid = false;
    errorMessage = submissionValidation.errorMessage || '';
  } else if (!blogTitle) {
    isValid = false;
    errorMessage = '작성제목 필수';
  } else if (!publishedDate || !isValidDateFormat(publishedDate)) {
    isValid = false;
    errorMessage = '발행일 형식 오류 (YYYY-MM-DD)';
  }

  return {
    row: rowIndex + 1,
    submissionNumber,
    companyName,
    date: publishedDate,
    count: 0,
    notes: '',
    isValid,
    errorMessage,
    blogTitle,
    publishedDate,
    blogStatus,
    blogUrl,
    blogId,
  };
}

// 카페 침투 / 커뮤니티 마케팅 레코드 파싱 (동일 구조)
function parseCafeRecord(row: unknown[], rowIndex: number, productType: 'cafe' | 'community'): ParsedRecord {
  const submissionNumber = String(row[0] || '').trim();
  const companyName = String(row[1] || '').trim();
  const cafePostTitle = String(row[2] || '').trim();
  const cafePublishedDate = parseDateValue(row[3]);
  const cafeStatus = String(row[4] || '대기').trim();
  const cafePostUrl = String(row[5] || '').trim();
  const cafeWriterId = String(row[6] || '').trim();
  const cafeName = String(row[7] || '').trim();

  // 유효성 검사
  let isValid = true;
  let errorMessage = '';

  const submissionValidation = validateSubmissionNumber(submissionNumber, productType);
  if (!submissionValidation.isValid) {
    isValid = false;
    errorMessage = submissionValidation.errorMessage || '';
  } else if (!cafePostTitle) {
    isValid = false;
    errorMessage = '작성제목 필수';
  } else if (!cafePublishedDate || !isValidDateFormat(cafePublishedDate)) {
    isValid = false;
    errorMessage = '발행일 형식 오류 (YYYY-MM-DD)';
  }

  return {
    row: rowIndex + 1,
    submissionNumber,
    companyName,
    date: cafePublishedDate,
    count: 0,
    notes: '',
    isValid,
    errorMessage,
    cafePostTitle,
    cafePublishedDate,
    cafeStatus,
    cafePostUrl,
    cafeWriterId,
    cafeName,
  };
}

// 단일 레코드 파싱 라우터
function parseRecord(
  row: unknown[],
  rowIndex: number,
  productType: ProductType
): ParsedRecord | null {
  if (REVIEW_PRODUCT_TYPES.includes(productType)) {
    return parseReviewRecord(row, rowIndex, productType);
  }

  if (BLOG_PRODUCT_TYPES.includes(productType)) {
    return parseBlogRecord(row, rowIndex, productType);
  }

  if (productType === 'cafe' || productType === 'community') {
    return parseCafeRecord(row, rowIndex, productType);
  }

  return null;
}

// 엑셀 파일 파싱
export async function parseExcelFile(
  file: File,
  allowedProducts: ProductType[]
): Promise<SheetData[]> {
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
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (jsonData.length < 2) continue; // 헤더만 있거나 빈 시트

    const records: ParsedRecord[] = [];

    // 첫 행은 헤더, 두 번째 행부터 데이터
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0 || !row[0]) continue; // 빈 행 스킵

      const record = parseRecord(row, i, productType);
      if (record) {
        records.push(record);
      }
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

  return sheets;
}

// 접수번호 DB 검증
export async function validateSubmissionsWithDB(sheets: SheetData[]): Promise<SheetData[]> {
  const allSubmissionNumbers = sheets.flatMap((s) =>
    s.records.filter((r) => r.isValid).map((r) => r.submissionNumber)
  );

  if (allSubmissionNumbers.length === 0) {
    return sheets;
  }

  const response = await fetch('/api/admin/data-management/validate-submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionNumbers: Array.from(new Set(allSubmissionNumbers)) }),
  });

  if (!response.ok) {
    return sheets;
  }

  const validationData = await response.json();
  const validSubmissions = new Map<string, { id: string; company_name: string }>(
    validationData.submissions.map(
      (s: { submission_number: string; id: string; company_name: string }) => [s.submission_number, s]
    )
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
          // 업체명 불일치 검사
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

  return sheets;
}

// 전체 파싱 및 검증 프로세스
export async function parseAndValidateFile(
  file: File,
  allowedProducts: ProductType[]
): Promise<ValidationResult> {
  // 1. 엑셀 파싱
  let sheets = await parseExcelFile(file, allowedProducts);

  // 2. DB 검증
  if (sheets.length > 0) {
    sheets = await validateSubmissionsWithDB(sheets);
  }

  // 3. 결과 집계
  return {
    sheets,
    totalRecords: sheets.reduce((sum, s) => sum + s.records.length, 0),
    validRecords: sheets.reduce((sum, s) => sum + s.validCount, 0),
    invalidRecords: sheets.reduce((sum, s) => sum + s.invalidCount, 0),
  };
}
