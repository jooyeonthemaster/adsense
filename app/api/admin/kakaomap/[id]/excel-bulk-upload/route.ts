import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { parseKakaomapExcelServer } from '@/lib/excel-kakaomap-server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();
    const { id: submissionId } = await context.params;

    console.log('[Excel Upload] Submission ID:', submissionId);

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('[Excel Upload] File:', file?.name, file?.size);

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    // 파일 확장자 검증
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext || '')) {
      return NextResponse.json(
        { error: '엑셀 파일만 업로드 가능합니다. (.xlsx, .xls)' },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 서버 사이드 Excel 파싱 (이미지 추출 포함)
    const parseResult = await parseKakaomapExcelServer(buffer);

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: parseResult.errors[0],
          allErrors: parseResult.errors,
          items: parseResult.items,
        },
        { status: 400 }
      );
    }

    if (parseResult.items.length === 0) {
      return NextResponse.json(
        { error: '유효한 데이터를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // submission 조회하여 total_count 확인
    const { data: submission, error: submissionError } = await supabase
      .from('kakaomap_review_submissions')
      .select('total_count, status')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('[Excel Upload] Submission lookup error:', {
        submissionId,
        error: submissionError,
        errorCode: submissionError?.code,
        errorMessage: submissionError?.message,
        errorDetails: submissionError?.details,
      });
      return NextResponse.json({
        error: '접수를 찾을 수 없습니다.',
        details: submissionError?.message || '알 수 없는 오류'
      }, { status: 404 });
    }

    // 현재 업로드된 콘텐츠 개수 확인
    const { count: currentCount } = await supabase
      .from('kakaomap_content_items')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId);

    console.log('[Excel Upload] Submission found:', { total_count: submission.total_count, current_count: currentCount });

    const totalCount = submission.total_count || 0;
    const remaining = totalCount - (currentCount || 0);

    if (remaining <= 0) {
      return NextResponse.json(
        { error: '이미 최대 개수에 도달했습니다.' },
        { status: 400 }
      );
    }

    // 업로드 가능한 개수만큼만 처리
    const itemsToUpload = parseResult.items.slice(0, remaining);
    let successCount = 0;
    let failCount = 0;
    const failedItems: Array<{ row: number; error: string }> = [];

    // 현재 최대 upload_order 조회
    const { data: lastItem } = await supabase
      .from('kakaomap_content_items')
      .select('upload_order')
      .eq('submission_id', submissionId)
      .order('upload_order', { ascending: false })
      .limit(1)
      .single();

    let nextOrder = lastItem ? lastItem.upload_order + 1 : 1;

    // 각 아이템 처리 (텍스트만, 이미지는 별도 업로드)
    for (let i = 0; i < itemsToUpload.length; i++) {
      const item = itemsToUpload[i];

      try {
        // 콘텐츠 아이템 DB 생성 (원고만)
        const { error: insertError } = await supabase
          .from('kakaomap_content_items')
          .insert({
            submission_id: submissionId,
            image_url: null, // 이미지는 사용자가 직접 업로드
            script_text: item.script,
            file_name: null,
            file_size: null,
            upload_order: nextOrder, // 순번 설정
            is_published: false, // 배포 전까지는 비공개
          });

        if (insertError) {
          console.error('DB insert error:', insertError);
          throw new Error('콘텐츠 생성 실패');
        }

        successCount++;
        nextOrder++; // 다음 순번으로 증가
      } catch (error) {
        console.error(`Item ${i} upload error:`, error);
        failCount++;
        failedItems.push({
          row: item.row,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    // 최종 업로드 개수 계산
    const newUploadedCount = (currentCount || 0) + successCount;

    // 자동 상태 업데이트
    if (newUploadedCount >= totalCount) {
      // 모든 콘텐츠 업로드 완료 → 검수 대기
      await supabase
        .from('kakaomap_review_submissions')
        .update({ status: 'review' })
        .eq('id', submissionId);
    } else if ((currentCount || 0) === 0 && successCount > 0) {
      // 첫 콘텐츠 업로드 → 콘텐츠 대기 중
      await supabase
        .from('kakaomap_review_submissions')
        .update({ status: 'waiting_content' })
        .eq('id', submissionId);
    }

    // 최종 상태 결정
    let finalStatus = submission.status;
    if (newUploadedCount >= totalCount) {
      finalStatus = 'review';
    } else if ((currentCount || 0) === 0 && successCount > 0) {
      finalStatus = 'waiting_content';
    }

    return NextResponse.json({
      success: true,
      total_items: itemsToUpload.length,
      success_count: successCount,
      fail_count: failCount,
      failed_items: failedItems,
      uploaded_count: newUploadedCount,
      total_count: totalCount,
      status: finalStatus,
    });

  } catch (error) {
    console.error('Excel bulk upload error:', error);
    return NextResponse.json(
      {
        error: '일괄 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
