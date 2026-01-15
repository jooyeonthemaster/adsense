import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// POST: 대행사에 재검수 요청
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();
    const { id: submissionId } = await context.params;

    // 현재 검수 대기(pending) 상태인 콘텐츠 아이템 조회
    // is_published = true: 검수 요청된 원고만
    const { data: pendingItems, error: fetchError } = await supabase
      .from('kakaomap_content_items')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('is_published', true)
      .eq('review_status', 'pending');

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

    // submission 상태를 'review'로 업데이트 (검수 대기)
    const { error: updateError } = await supabase
      .from('kakaomap_review_submissions')
      .update({
        status: 'review',
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Update submission error:', updateError);
      return NextResponse.json(
        { error: '상태 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 피드백 추가 (대행사에게 알림용)
    const { error: feedbackError } = await supabase
      .from('kakaomap_content_item_feedbacks')
      .insert({
        submission_id: submissionId,
        content_item_id: null, // 공통 피드백
        feedback_text: `[시스템] 관리자가 ${pendingItems.length}개 원고에 대해 재검수를 요청했습니다.`,
        feedback_type: 'general',
        is_read: false,
      });

    if (feedbackError) {
      console.error('Insert feedback error:', feedbackError);
      // 피드백 추가 실패해도 재검수 요청은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      pending_count: pendingItems.length,
      message: `${pendingItems.length}개의 원고에 대해 재검수를 요청했습니다.`,
    });

  } catch (error) {
    console.error('Re-review request error:', error);
    return NextResponse.json(
      {
        error: '재검수 요청 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
