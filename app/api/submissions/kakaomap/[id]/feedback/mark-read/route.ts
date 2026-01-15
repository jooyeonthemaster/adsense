import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// POST: 클라이언트 피드백 읽음 처리 (관리자용)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id: submissionId } = await context.params;

    const { createClient: createServiceClient } = await import('@/utils/supabase/service');
    const serviceSupabase = createServiceClient();

    // 클라이언트가 보낸 피드백 중 읽지 않은 것 모두 읽음 처리
    const { error } = await serviceSupabase
      .from('kakaomap_content_item_feedbacks')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('submission_id', submissionId)
      .eq('sender_type', 'client')
      .eq('is_read', false);

    if (error) {
      console.error('Error marking feedbacks as read:', error);
      return NextResponse.json(
        { error: '피드백 읽음 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in POST mark-read:', error);
    return NextResponse.json(
      { error: '피드백 읽음 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
