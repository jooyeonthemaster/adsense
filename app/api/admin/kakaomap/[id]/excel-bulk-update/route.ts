import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { parseKakaomapExcelServer } from '@/lib/excel-kakaomap-server';

// POST: 기존 검수 대기 원고를 엑셀로 일괄 수정
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();
    const { id: submissionId } = await context.params;

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get('file') as File;

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

    // 서버 사이드 Excel 파싱
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

    // 현재 검수 대기(pending) 상태인 콘텐츠 아이템 조회
    // is_published = true: 검수 요청된 원고만
    const { data: pendingItems, error: fetchError } = await supabase
      .from('kakaomap_content_items')
      .select('id, upload_order, script_text')
      .eq('submission_id', submissionId)
      .eq('is_published', true)
      .eq('review_status', 'pending')
      .order('upload_order', { ascending: true });

    if (fetchError) {
      console.error('Fetch pending items error:', fetchError);
      return NextResponse.json(
        { error: '검수 대기 원고 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!pendingItems || pendingItems.length === 0) {
      return NextResponse.json(
        { error: '검수 대기 중인 원고가 없습니다.' },
        { status: 400 }
      );
    }

    // 엑셀 순서(1, 2, 3...)에 따라 검수 대기 원고와 매칭
    // 엑셀의 첫 번째 항목 → 검수 대기 목록의 첫 번째 항목
    let successCount = 0;
    let failCount = 0;
    const failedItems: Array<{ row: number; error: string }> = [];
    const updatedItems: Array<{ id: string; oldText: string; newText: string }> = [];

    // 최대 업데이트 가능한 개수 = 검수 대기 원고 수와 엑셀 데이터 수 중 작은 값
    const maxUpdateCount = Math.min(parseResult.items.length, pendingItems.length);

    for (let i = 0; i < maxUpdateCount; i++) {
      const excelItem = parseResult.items[i];
      const pendingItem = pendingItems[i];

      try {
        // 원고 텍스트 업데이트
        const { error: updateError } = await supabase
          .from('kakaomap_content_items')
          .update({ script_text: excelItem.script })
          .eq('id', pendingItem.id);

        if (updateError) {
          throw new Error('원고 수정 실패');
        }

        updatedItems.push({
          id: pendingItem.id,
          oldText: pendingItem.script_text || '',
          newText: excelItem.script,
        });
        successCount++;
      } catch (error) {
        console.error(`Item ${i} update error:`, error);
        failCount++;
        failedItems.push({
          row: excelItem.row,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    return NextResponse.json({
      success: true,
      total_pending: pendingItems.length,
      excel_items: parseResult.items.length,
      success_count: successCount,
      fail_count: failCount,
      failed_items: failedItems,
      message: successCount > 0
        ? `${successCount}개의 원고가 수정되었습니다.`
        : '수정된 원고가 없습니다.',
    });

  } catch (error) {
    console.error('Excel bulk update error:', error);
    return NextResponse.json(
      {
        error: '일괄 수정 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
