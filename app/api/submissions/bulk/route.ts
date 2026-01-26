/**
 * 대량 접수 처리 API
 * - 트랜잭션으로 일괄 처리
 * - 실패 시 전체 롤백
 * - 결과 리포트 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import { fetchBusinessNameFromUrl } from '@/lib/place-scraper';
import { revalidatePath } from 'next/cache';
import type {
  BulkSubmissionProduct,
  BulkSubmitResult,
  ReceiptBulkRow,
  BlogBulkRow,
  PlaceBulkRow,
} from '@/components/dashboard/bulk-submission/types';
import {
  DISTRIBUTION_TYPE_MAP,
  CONTENT_TYPE_MAP,
} from '@/components/dashboard/bulk-submission/constants';

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
 * 상품별 제출번호 코드
 */
const PRODUCT_CODE_MAP: Record<BulkSubmissionProduct, string> = {
  receipt: 'RR',
  blog_reviewer: 'BD',
  blog_video: 'BD',
  blog_automation: 'BD',
  place: 'PL',
};

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
        calculatedPoints?: number;
        extractedMid?: string;
      }>;
      productType?: BulkSubmissionProduct;
    };

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: '접수할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 유효하지 않은 레코드가 있는지 확인
    const invalidRecords = records.filter((r) => !r.isValid);
    if (invalidRecords.length > 0) {
      return NextResponse.json(
        {
          error: `검증 실패한 데이터가 ${invalidRecords.length}건 있습니다. 먼저 검증을 완료해주세요.`,
          invalidRows: invalidRecords.map((r) => r.row),
        },
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

    // 가격 캐시
    const priceCache: Record<string, number | null> = {};

    // 총 포인트 계산
    let totalPoints = 0;
    const processedRecords: Array<{
      record: typeof records[0];
      pricePerUnit: number;
      calculatedPoints: number;
      mid?: string;
      businessName?: string;
    }> = [];

    for (const record of records) {
      const recordProductType = record.productType || productType;
      if (!recordProductType) {
        return NextResponse.json(
          { error: `${record.row}행: 상품 타입을 확인할 수 없습니다.` },
          { status: 400 }
        );
      }

      // 가격 조회
      const pricingSlug = PRODUCT_TO_PRICING_SLUG[recordProductType];
      if (!priceCache[pricingSlug]) {
        priceCache[pricingSlug] = await getProductPrice(user.id, pricingSlug);
      }

      const pricePerUnit = priceCache[pricingSlug];
      if (!pricePerUnit) {
        return NextResponse.json(
          { error: `${record.row}행: 상품 가격이 설정되지 않았습니다.` },
          { status: 400 }
        );
      }

      // 포인트 계산
      let calculatedPoints = 0;
      let mid: string | undefined;
      let businessName: string | undefined;

      if (recordProductType === 'receipt') {
        const data = record.data as ReceiptBulkRow;
        const totalCount = Number(data['총 수량']) || 0;
        calculatedPoints = totalCount * pricePerUnit;

        // 업체명 추출
        const placeUrl = data['플레이스 주소'] || '';
        if (placeUrl) {
          const placeInfo = await fetchBusinessNameFromUrl(placeUrl);
          businessName = placeInfo.businessName || undefined;
          mid = placeInfo.mid || undefined;
        }
      } else if (
        recordProductType === 'blog_reviewer' ||
        recordProductType === 'blog_video' ||
        recordProductType === 'blog_automation'
      ) {
        const data = record.data as BlogBulkRow;
        const totalCount = Number(data['총갯수']) || 0;
        calculatedPoints = totalCount * pricePerUnit;

        // 업체명 추출
        const placeUrl = data['플레이스링크'] || '';
        if (placeUrl) {
          const placeInfo = await fetchBusinessNameFromUrl(placeUrl);
          businessName = placeInfo.businessName || undefined;
          mid = placeInfo.mid || undefined;
        }
      } else if (recordProductType === 'place') {
        const data = record.data as PlaceBulkRow;
        const dailyCount = Number(data['일 수량']) || 0;
        const operationDays = Number(data['구동 일수']) || 0;
        calculatedPoints = dailyCount * operationDays * pricePerUnit;

        // MID 추출 및 업체명 가져오기
        const placeUrl = data['URL (m. 으로 시작하는 모바일링크 기재)'] || '';
        const placeInfo = await fetchBusinessNameFromUrl(placeUrl);
        mid = placeInfo.mid || extractMidFromUrl(placeUrl) || undefined;

        if (!mid) {
          return NextResponse.json(
            { error: `${record.row}행: 플레이스 URL에서 업체 정보를 추출할 수 없습니다. URL을 확인해주세요.` },
            { status: 400 }
          );
        }

        // 상품명이 없으면 URL에서 추출한 업체명 사용
        const productName = data['상품명']?.toString().trim();
        if (!productName || productName === '') {
          businessName = placeInfo.businessName || undefined;
        } else {
          businessName = productName;
        }
      }

      totalPoints += calculatedPoints;
      processedRecords.push({
        record,
        pricePerUnit,
        calculatedPoints,
        mid,
        businessName,
      });
    }

    // 포인트 잔액 확인
    if (client.points < totalPoints) {
      return NextResponse.json(
        {
          error: `포인트가 부족합니다. (필요: ${totalPoints.toLocaleString()}P, 잔액: ${client.points.toLocaleString()}P)`,
        },
        { status: 400 }
      );
    }

    // 포인트 차감
    const newBalance = client.points - totalPoints;
    const { error: updateError } = await supabase
      .from('clients')
      .update({ points: newBalance })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating points:', updateError);
      return NextResponse.json(
        { error: '포인트 차감 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 접수 생성
    const results: BulkSubmitResult[] = [];
    const createdSubmissions: Array<{ table: string; id: string }> = [];

    // 대량 접수 그룹 ID 생성
    const bulkUploadId = randomUUID();

    try {
      for (const { record, pricePerUnit, calculatedPoints, mid, businessName } of processedRecords) {
        const recordProductType = record.productType || productType!;
        const productCode = PRODUCT_CODE_MAP[recordProductType];

        // 접수번호 생성
        const { data: submissionNumber, error: snError } = await supabase.rpc(
          'generate_submission_number',
          { p_product_code: productCode }
        );

        if (snError) {
          console.error(`[Bulk] Submission number generation error:`, snError);
          throw new Error(`${record.row}행: 접수번호 생성에 실패했습니다. 잠시 후 다시 시도해주세요.`);
        }

        let submissionId: string;
        let submissionTable: string;

        // 상품별 접수 생성
        if (recordProductType === 'receipt') {
          const data = record.data as ReceiptBulkRow;
          submissionTable = 'receipt_review_submissions';

          const { data: submission, error: insertError } = await supabase
            .from(submissionTable)
            .insert({
              client_id: user.id,
              submission_number: submissionNumber,
              company_name: businessName || `대량접수-${record.row}`,
              place_url: data['플레이스 주소'],
              daily_count: Number(data['일 수량']),
              total_count: Number(data['총 수량']),
              start_date: data['발행 시작 날짜 지정 (선택)'] || null,
              has_photo: false,
              has_script: !!data['원고 직접 등록 (선택)'],
              total_points: calculatedPoints,
              notes: data['가이드 라인 (선택)'] || null,
              status: 'pending',
              bulk_upload_id: bulkUploadId,
            })
            .select('id')
            .single();

          if (insertError || !submission) {
            console.error(`[Bulk] Receipt insert error:`, insertError);
            throw new Error(`${record.row}행: 영수증 리뷰 접수 저장에 실패했습니다.`);
          }

          submissionId = submission.id;
        } else if (
          recordProductType === 'blog_reviewer' ||
          recordProductType === 'blog_video' ||
          recordProductType === 'blog_automation'
        ) {
          const data = record.data as BlogBulkRow;
          submissionTable = 'blog_distribution_submissions';

          // 배포유형에서 distribution_type 추출
          const distributionTypeStr = data['배포유형']?.toString().trim() || '';
          const distributionType = DISTRIBUTION_TYPE_MAP[distributionTypeStr] || 'reviewer';

          // 글타입에서 content_type 추출
          const contentTypeStr = data['글타입']?.toString().trim() || '';
          const contentType = CONTENT_TYPE_MAP[contentTypeStr] || 'review';

          const { data: submission, error: insertError } = await supabase
            .from(submissionTable)
            .insert({
              client_id: user.id,
              submission_number: submissionNumber,
              company_name: businessName || `대량접수-${record.row}`,
              place_url: data['플레이스링크'] || '',
              distribution_type: distributionType,
              content_type: contentType,
              daily_count: Number(data['일갯수']),
              total_count: Number(data['총갯수']),
              start_date: data['시작날짜'] || null,
              total_points: calculatedPoints,
              notes: null,
              status: 'pending',
              bulk_upload_id: bulkUploadId,
            })
            .select('id')
            .single();

          if (insertError || !submission) {
            console.error(`[Bulk] Blog insert error:`, insertError);
            console.error(`[Bulk] Blog insert data:`, {
              client_id: user.id,
              company_name: businessName || `대량접수-${record.row}`,
              place_url: data['플레이스링크'],
              distribution_type: distributionType,
              content_type: contentType,
              daily_count: Number(data['일갯수']),
              total_count: Number(data['총갯수']),
              start_date: data['시작날짜'],
            });
            throw new Error(`${record.row}행: 블로그 배포 접수 저장에 실패했습니다. ${insertError?.message || ''}`);
          }

          submissionId = submission.id;
        } else if (recordProductType === 'place') {
          const data = record.data as PlaceBulkRow;
          submissionTable = 'place_submissions';

          const { data: submission, error: insertError } = await supabase
            .from(submissionTable)
            .insert({
              client_id: user.id,
              submission_number: submissionNumber,
              company_name: businessName || data['상품명'] || `대량접수-${record.row}`,
              place_url: data['URL (m. 으로 시작하는 모바일링크 기재)'],
              place_mid: mid,
              daily_count: Number(data['일 수량']),
              total_days: Number(data['구동 일수']),
              start_date: data['시작일'] || null,
              total_points: calculatedPoints,
              media_type: 'twoople',
              status: 'pending',
              notes: data['목표 키워드'] || null,
              bulk_upload_id: bulkUploadId,
            })
            .select('id')
            .single();

          if (insertError || !submission) {
            console.error(`[Bulk] Place insert error:`, insertError);
            throw new Error(`${record.row}행: 트래픽 접수 저장에 실패했습니다.`);
          }

          submissionId = submission.id;
        } else {
          throw new Error(`${record.row}행: 지원하지 않는 상품 유형입니다.`);
        }

        createdSubmissions.push({ table: submissionTable, id: submissionId });

        results.push({
          row: record.row,
          success: true,
          submissionNumber,
          submissionId,
          calculatedPoints,
        });
      }

      // 포인트 거래 기록 생성 (일괄)
      await supabase.from('point_transactions').insert({
        client_id: user.id,
        transaction_type: 'deduct',
        amount: -totalPoints,
        balance_after: newBalance,
        reference_type: 'bulk_submission',
        reference_id: createdSubmissions[0]?.id || null,
        description: `대량 접수 (${records.length}건, ${totalPoints.toLocaleString()}P)`,
      });

      // Revalidate dashboard
      revalidatePath('/dashboard', 'layout');

      return NextResponse.json({
        success: true,
        results,
        bulkUploadId,
        summary: {
          totalRecords: records.length,
          successCount: results.filter((r) => r.success).length,
          failedCount: results.filter((r) => !r.success).length,
          totalPoints,
          newBalance,
        },
      });
    } catch (error) {
      // 롤백: 생성된 접수 삭제
      console.error('Bulk submission error, rolling back:', error);

      for (const { table, id } of createdSubmissions) {
        await supabase.from(table).delete().eq('id', id);
      }

      // 포인트 복구
      await supabase.from('clients').update({ points: client.points }).eq('id', user.id);

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : '접수 처리 중 오류가 발생했습니다.',
          rolledBack: true,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/submissions/bulk:', error);
    return NextResponse.json(
      { error: '접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
