/**
 * 대량 접수 검증 API
 * - 포인트 계산 검증
 * - 플레이스 URL 유효성 검증
 * - MID 추출 시도
 * - 예상 비용 계산
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import type {
  BulkSubmissionProduct,
  BulkValidationResult,
  ReceiptBulkRow,
  BlogBulkRow,
  PlaceBulkRow,
} from '@/components/dashboard/bulk-submission/types';

// MID 추출 정규식 - 다양한 네이버 플레이스 URL 형식 지원
const PLACE_MID_PATTERNS = [
  // map.naver.com 형식 (PC 버전)
  /map\.naver\.com\/.*\/place\/(\d+)/,
  /map\.naver\.com\/p\/entry\/place\/(\d+)/,
  // place.naver.com / m.place.naver.com 형식 (모바일/구버전)
  /place\.naver\.com\/(?:restaurant|cafe|place|hospital|beauty|store)\/(\d+)/,
  /m\.place\.naver\.com\/(?:restaurant|cafe|place|hospital|beauty|store)\/(\d+)/,
  // 일반적인 place/ 패턴 (fallback)
  /naver\.com\/.*place\/(\d+)/,
];

/**
 * 플레이스 URL에서 MID 추출
 */
function extractMidFromUrl(url: string): string | null {
  if (!url) return null;

  for (const pattern of PLACE_MID_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * 상품별 가격 슬러그 매핑 (product_categories 테이블의 slug와 일치해야 함)
 */
const PRODUCT_TO_PRICING_SLUG: Record<BulkSubmissionProduct, string> = {
  receipt: 'receipt-review',
  blog_reviewer: 'reviewer-distribution',
  blog_video: 'video-distribution',
  blog_automation: 'auto-distribution',
  place: 'twoople-reward',
};

/**
 * 상품별 단가 기준
 */
function getUnitMultiplier(productType: BulkSubmissionProduct): 'total' | 'daily_x_days' {
  switch (productType) {
    case 'receipt':
    case 'blog_reviewer':
    case 'blog_video':
    case 'blog_automation':
      return 'total'; // 단가 × 총 수량
    case 'place':
      return 'daily_x_days'; // 단가 × 일 수량 × 구동일수
  }
}

/**
 * 영수증 리뷰 행 포인트 계산
 */
function calculateReceiptPoints(row: ReceiptBulkRow, pricePerUnit: number): number {
  const totalCount = Number(row['총 수량']) || 0;
  return totalCount * pricePerUnit;
}

/**
 * 블로그 배포 행 포인트 계산
 */
function calculateBlogPoints(row: BlogBulkRow, pricePerUnit: number): number {
  const totalCount = Number(row['총갯수']) || 0;
  return totalCount * pricePerUnit;
}

/**
 * 트래픽/리워드 행 포인트 계산
 */
function calculatePlacePoints(row: PlaceBulkRow, pricePerUnit: number): number {
  const dailyCount = Number(row['일 수량']) || 0;
  const operationDays = Number(row['구동 일수']) || 0;
  return dailyCount * operationDays * pricePerUnit;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const body = await request.json();
    const { records, productType } = body as {
      records: Array<{
        row: number;
        productType: BulkSubmissionProduct;
        data: ReceiptBulkRow | BlogBulkRow | PlaceBulkRow;
        isValid: boolean;
        errors: string[];
      }>;
      productType?: BulkSubmissionProduct;
    };

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: '검증할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get client's current points
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('points')
      .eq('id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: '거래처 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 상품별로 가격 캐시
    const priceCache: Record<string, number | null> = {};

    // 결과 저장
    const validationResults: BulkValidationResult[] = [];
    let totalPoints = 0;
    let validCount = 0;
    let invalidCount = 0;

    for (const record of records) {
      const result: BulkValidationResult = {
        row: record.row,
        isValid: record.isValid,
        errors: [...record.errors],
        calculatedPoints: 0,
      };

      // 클라이언트 사이드 검증 실패한 경우
      if (!record.isValid) {
        invalidCount++;
        validationResults.push(result);
        continue;
      }

      const recordProductType = record.productType || productType;
      if (!recordProductType) {
        result.isValid = false;
        result.errors.push('상품 타입을 확인할 수 없습니다.');
        invalidCount++;
        validationResults.push(result);
        continue;
      }

      // 가격 조회 (캐시)
      let pricingSlug = PRODUCT_TO_PRICING_SLUG[recordProductType];

      // place의 경우 media_type에 따라 가격 슬러그 변경 (기본: twoople)
      // 현재 대량 접수에서는 twoople만 지원

      if (!priceCache[pricingSlug]) {
        priceCache[pricingSlug] = await getProductPrice(user.id, pricingSlug);
      }

      const pricePerUnit = priceCache[pricingSlug];

      if (!pricePerUnit) {
        result.isValid = false;
        result.errors.push('상품 가격이 설정되지 않았습니다.');
        invalidCount++;
        validationResults.push(result);
        continue;
      }

      // 플레이스 URL에서 MID 추출 검증
      let placeUrl = '';
      if (recordProductType === 'receipt') {
        placeUrl = (record.data as ReceiptBulkRow)['플레이스 주소'] || '';
      } else if (
        recordProductType === 'blog_reviewer' ||
        recordProductType === 'blog_video' ||
        recordProductType === 'blog_automation'
      ) {
        placeUrl = (record.data as BlogBulkRow)['플레이스링크'] || '';
      } else if (recordProductType === 'place') {
        placeUrl = (record.data as PlaceBulkRow)['URL (m. 으로 시작하는 모바일링크 기재)'] || '';
      }

      // MID 추출 (place 상품만 필수)
      if (recordProductType === 'place') {
        const mid = extractMidFromUrl(placeUrl);
        if (!mid) {
          result.isValid = false;
          result.errors.push('플레이스 URL에서 MID를 추출할 수 없습니다.');
          invalidCount++;
          validationResults.push(result);
          continue;
        }
        result.extractedMid = mid;
      }

      // 포인트 계산
      let calculatedPoints = 0;
      switch (recordProductType) {
        case 'receipt':
          calculatedPoints = calculateReceiptPoints(record.data as ReceiptBulkRow, pricePerUnit);
          break;
        case 'blog_reviewer':
        case 'blog_video':
        case 'blog_automation':
          calculatedPoints = calculateBlogPoints(record.data as BlogBulkRow, pricePerUnit);
          break;
        case 'place':
          calculatedPoints = calculatePlacePoints(record.data as PlaceBulkRow, pricePerUnit);
          break;
      }

      result.calculatedPoints = calculatedPoints;
      result.pricePerUnit = pricePerUnit;
      totalPoints += calculatedPoints;
      validCount++;
      validationResults.push(result);
    }

    // 포인트 잔액 검증
    const hasInsufficientPoints = client.points < totalPoints;

    return NextResponse.json({
      success: true,
      results: validationResults,
      summary: {
        totalRecords: records.length,
        validCount,
        invalidCount,
        totalPoints,
        currentBalance: client.points,
        hasInsufficientPoints,
        remainingBalance: client.points - totalPoints,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/submissions/bulk/validate:', error);
    return NextResponse.json(
      { error: '검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
