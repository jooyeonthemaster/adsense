/**
 * 대량 접수 API 호출 유틸리티
 */

import type {
  BulkSubmissionProduct,
  ParsedSubmissionRecord,
  BulkValidationResponse,
  BulkSubmitResponse,
} from '../types';

/**
 * 대량 접수 검증 API 호출
 */
export async function validateBulkSubmission(
  records: ParsedSubmissionRecord[],
  productType?: BulkSubmissionProduct
): Promise<BulkValidationResponse> {
  const response = await fetch('/api/submissions/bulk/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productType,
      records: records.map((r) => ({
        row: r.row,
        productType: r.productType,
        data: r.data,
        isValid: r.isValid,
        errors: r.errors,
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '검증 실패');
  }

  return data;
}

/**
 * 대량 접수 제출 API 호출
 */
export async function submitBulkSubmission(
  records: ParsedSubmissionRecord[],
  productType?: BulkSubmissionProduct
): Promise<BulkSubmitResponse> {
  const response = await fetch('/api/submissions/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productType,
      records: records.map((r) => ({
        row: r.row,
        productType: r.productType,
        data: r.data,
        isValid: r.isValid,
        errors: r.errors,
        calculatedPoints: r.calculatedPoints,
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // 롤백된 경우도 처리
    if (data.rolledBack) {
      return {
        success: false,
        results: [],
        summary: {
          totalRecords: records.length,
          successCount: 0,
          failedCount: records.length,
          totalPoints: 0,
          newBalance: 0,
        },
        error: data.error,
        rolledBack: true,
      };
    }
    throw new Error(data.error || '접수 실패');
  }

  return data;
}

/**
 * 클라이언트 포인트 조회
 */
export async function getClientPoints(): Promise<number> {
  const response = await fetch('/api/clients/me');

  if (!response.ok) {
    throw new Error('포인트 조회 실패');
  }

  const data = await response.json();
  return data.points || 0;
}

/**
 * 상품별 가격 조회
 */
export async function getProductPricing(productType: BulkSubmissionProduct): Promise<{
  pricePerUnit: number;
  isConfigured: boolean;
}> {
  const response = await fetch(`/api/pricing?productType=${productType}`);

  if (!response.ok) {
    return { pricePerUnit: 0, isConfigured: false };
  }

  const data = await response.json();
  return {
    pricePerUnit: data.price || 0,
    isConfigured: data.isConfigured || false,
  };
}
