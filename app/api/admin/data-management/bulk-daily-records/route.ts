import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/service';

interface RecordInput {
  submissionId: string;
  date: string;
  count: number;
  scriptText?: string; // K맵 전용: 리뷰 원고
  notes: string;
  // K맵 리뷰 전용 필드
  reviewRegisteredDate?: string; // 리뷰등록날짜
  receiptDate?: string; // 영수증날짜
  reviewStatus?: string; // 상태 (대기, 승인됨, 수정요청)
  reviewLink?: string; // 리뷰 링크
  reviewId?: string; // 리뷰 아이디
}

// 한글 상태값을 DB review_status 값으로 변환 (방문자 리뷰용)
function mapReviewStatus(koreanStatus?: string): 'pending' | 'approved' | 'revision_requested' {
  switch (koreanStatus) {
    case '승인됨':
      return 'approved';
    case '수정요청':
      return 'revision_requested';
    case '대기':
    default:
      return 'pending';
  }
}

// 한글 상태값을 DB status 값으로 변환 (카카오맵용)
function mapKakaomapStatus(koreanStatus?: string): 'pending' | 'approved' | 'rejected' {
  switch (koreanStatus) {
    case '승인됨':
      return 'approved';
    case '수정요청':
    case '반려':
      return 'rejected';
    case '대기':
    default:
      return 'pending';
  }
}

interface SheetInput {
  productType: 'kakaomap' | 'receipt' | 'blog' | 'cafe';
  records: RecordInput[];
}

// 상품별 테이블 및 컬럼 매핑
const TABLE_CONFIG: Record<
  string,
  { table: string; dateColumn: string; countColumn: string }
> = {
  kakaomap: {
    table: 'kakaomap_review_daily_records',
    dateColumn: 'date',
    countColumn: 'actual_count',
  },
  receipt: {
    table: 'receipt_review_daily_records',
    dateColumn: 'date',
    countColumn: 'actual_count',
  },
  blog: {
    table: 'blog_distribution_daily_records',
    dateColumn: 'record_date',
    countColumn: 'completed_count',
  },
  cafe: {
    table: 'cafe_marketing_daily_records',
    dateColumn: 'record_date',
    countColumn: 'completed_count',
  },
};

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const { sheets } = (await request.json()) as { sheets: SheetInput[] };

    if (!sheets || !Array.isArray(sheets)) {
      return NextResponse.json(
        { error: '시트 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    let totalSuccess = 0;
    let totalFailed = 0;
    let contentItemsCreated = 0;
    const errors: string[] = [];

    // 진행률 업데이트가 필요한 submission 추적
    const submissionsToUpdate: Map<string, { productType: 'kakaomap' | 'receipt', submissionId: string }> = new Map();

    for (const sheet of sheets) {
      // K맵 리뷰와 방문자 리뷰는 동일하게 처리 (콘텐츠 아이템 관리)
      if (sheet.productType === 'kakaomap' || sheet.productType === 'receipt') {
        const tableName = sheet.productType === 'kakaomap' ? 'kakaomap_content_items' : 'receipt_content_items';
        const productLabel = sheet.productType === 'kakaomap' ? 'K맵' : '방문자';

        for (const record of sheet.records) {
          try {
            if (!record.scriptText) {
              totalFailed++;
              errors.push(`${productLabel} ${record.submissionId}: 리뷰원고 필수`);
              continue;
            }

            // 같은 submission_id + 원고 내용으로 중복 체크
            const { data: existingItem } = await supabase
              .from(tableName)
              .select('id')
              .eq('submission_id', record.submissionId)
              .eq('script_text', record.scriptText)
              .maybeSingle();

            if (existingItem) {
              // 기존 아이템 업데이트 - 공통 필드 + 타입별 상태 필드
              const updateData: Record<string, unknown> = {
                review_registered_date: record.reviewRegisteredDate || null,
                receipt_date: record.receiptDate || null,
                review_link: record.reviewLink || null,
                review_id: record.reviewId || null,
                updated_at: new Date().toISOString(),
              };

              // 카카오맵: status 필드 사용, 방문자: review_status 필드 사용
              if (sheet.productType === 'kakaomap') {
                updateData.status = mapKakaomapStatus(record.reviewStatus);
              } else {
                updateData.review_status = mapReviewStatus(record.reviewStatus);
              }

              const { error: updateError } = await supabase
                .from(tableName)
                .update(updateData)
                .eq('id', existingItem.id);

              if (updateError) {
                totalFailed++;
                errors.push(`${productLabel} ${record.submissionId}: ${updateError.message}`);
              } else {
                totalSuccess++;
                // 진행률 업데이트 대상으로 추가
                submissionsToUpdate.set(record.submissionId, { productType: sheet.productType as 'kakaomap' | 'receipt', submissionId: record.submissionId });
              }
            } else {
              // 현재 최대 upload_order 조회
              const { data: maxOrderData } = await supabase
                .from(tableName)
                .select('upload_order')
                .eq('submission_id', record.submissionId)
                .order('upload_order', { ascending: false })
                .limit(1)
                .maybeSingle();

              const nextOrder = (maxOrderData?.upload_order || 0) + 1;

              // 새 콘텐츠 아이템 생성 - 공통 필드 + 타입별 상태 필드
              const insertData: Record<string, unknown> = {
                submission_id: record.submissionId,
                script_text: record.scriptText,
                upload_order: nextOrder,
                review_registered_date: record.reviewRegisteredDate || null,
                receipt_date: record.receiptDate || null,
                review_link: record.reviewLink || null,
                review_id: record.reviewId || null,
              };

              // 카카오맵: status 필드 사용, 방문자: review_status 필드 사용
              if (sheet.productType === 'kakaomap') {
                insertData.status = mapKakaomapStatus(record.reviewStatus);
              } else {
                insertData.review_status = mapReviewStatus(record.reviewStatus);
              }

              const { error: contentError } = await supabase
                .from(tableName)
                .insert(insertData);

              if (contentError) {
                totalFailed++;
                errors.push(`${productLabel} ${record.submissionId}: ${contentError.message}`);
              } else {
                totalSuccess++;
                contentItemsCreated++;
                // 진행률 업데이트 대상으로 추가
                submissionsToUpdate.set(record.submissionId, { productType: sheet.productType as 'kakaomap' | 'receipt', submissionId: record.submissionId });
              }
            }
          } catch (err) {
            totalFailed++;
            errors.push(`${productLabel} ${record.submissionId}: 처리 오류`);
          }
        }
        continue; // 리뷰는 여기서 처리 완료, 다음 시트로
      }

      // 블로그 배포, 카페 침투: 일별 완료 기록 처리
      const config = TABLE_CONFIG[sheet.productType];
      if (!config) {
        errors.push(`알 수 없는 상품 타입: ${sheet.productType}`);
        continue;
      }

      for (const record of sheet.records) {
        try {
          // 기본 데이터
          const upsertData: Record<string, unknown> = {
            submission_id: record.submissionId,
            [config.dateColumn]: record.date,
            [config.countColumn]: record.count,
            notes: record.notes || null,
            updated_at: new Date().toISOString(),
          };

          // UPSERT: 같은 submission_id + date가 있으면 UPDATE, 없으면 INSERT
          const { error } = await supabase.from(config.table).upsert(
            upsertData,
            {
              onConflict: `submission_id,${config.dateColumn}`,
            }
          );

          if (error) {
            totalFailed++;
            errors.push(
              `${sheet.productType} ${record.submissionId} (${record.date}): ${error.message}`
            );
          } else {
            totalSuccess++;
          }
        } catch (err) {
          totalFailed++;
          errors.push(
            `${sheet.productType} ${record.submissionId} (${record.date}): 처리 오류`
          );
        }
      }
    }

    // 진행률 업데이트: 각 submission에 대해 콘텐츠 아이템 수 / total_count * 100
    let progressUpdated = 0;
    const progressDebug: Array<{
      submissionId: string;
      contentCount: number | null;
      totalCount: number;
      progressPercentage: number;
      status: string;
      updateError?: string;
    }> = [];

    for (const [, { productType, submissionId }] of submissionsToUpdate) {
      try {
        const contentTable = productType === 'kakaomap' ? 'kakaomap_content_items' : 'receipt_content_items';
        const submissionTable = productType === 'kakaomap' ? 'kakaomap_review_submissions' : 'receipt_review_submissions';

        // 해당 submission의 콘텐츠 아이템 수 조회
        const { count: contentCount, error: countError } = await supabase
          .from(contentTable)
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', submissionId);

        if (countError) {
          console.error(`콘텐츠 수 조회 오류 (${submissionId}):`, countError.message);
          progressDebug.push({
            submissionId,
            contentCount: null,
            totalCount: 0,
            progressPercentage: 0,
            status: 'count_error',
            updateError: countError.message,
          });
          continue;
        }

        // submission의 total_count 조회
        const { data: submissionData, error: subError } = await supabase
          .from(submissionTable)
          .select('total_count, status')
          .eq('id', submissionId)
          .single();

        if (subError || !submissionData) {
          console.error(`Submission 조회 오류 (${submissionId}):`, subError?.message);
          progressDebug.push({
            submissionId,
            contentCount,
            totalCount: 0,
            progressPercentage: 0,
            status: 'submission_error',
            updateError: subError?.message,
          });
          continue;
        }

        const totalCount = submissionData.total_count || 1;
        // 콘텐츠가 있으면 최소 1% 보장 (0.43% 같은 경우 1%로 표시)
        const rawPercentage = (contentCount || 0) / totalCount * 100;
        const progressPercentage = (contentCount || 0) > 0
          ? Math.max(1, Math.min(Math.round(rawPercentage), 100))
          : 0;

        // 진행률 및 상태 업데이트
        const updateData: Record<string, unknown> = {
          progress_percentage: progressPercentage,
          updated_at: new Date().toISOString(),
        };

        // 콘텐츠가 있고 상태가 pending이면 in_progress로 변경
        if ((contentCount || 0) > 0 && submissionData.status === 'pending') {
          updateData.status = 'in_progress';
        }

        // 진행률이 100%이면 completed로 변경 (선택적)
        if (progressPercentage >= 100) {
          updateData.status = 'completed';
        }

        const { error: updateError } = await supabase
          .from(submissionTable)
          .update(updateData)
          .eq('id', submissionId);

        if (updateError) {
          console.error(`진행률 업데이트 오류 (${submissionId}):`, updateError.message);
          progressDebug.push({
            submissionId,
            contentCount,
            totalCount,
            progressPercentage,
            status: submissionData.status,
            updateError: updateError.message,
          });
        } else {
          progressUpdated++;
          progressDebug.push({
            submissionId,
            contentCount,
            totalCount,
            progressPercentage,
            status: submissionData.status,
          });
        }
      } catch (err) {
        console.error(`진행률 처리 오류:`, err);
      }
    }

    // 결과 반환
    return NextResponse.json({
      success: totalFailed === 0,
      totalSuccess,
      totalFailed,
      contentItemsCreated, // K맵 리뷰 원고로 생성된 콘텐츠 아이템 수
      progressUpdated, // 진행률이 업데이트된 submission 수
      progressDebug, // 디버그 정보
      errors: errors.slice(0, 20), // 최대 20개 에러만 반환
    });
  } catch (error) {
    console.error('일괄 등록 오류:', error);
    return NextResponse.json(
      { error: '일괄 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
