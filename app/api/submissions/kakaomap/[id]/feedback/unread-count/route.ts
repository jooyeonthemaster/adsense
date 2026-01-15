import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET: 미읽음 피드백 수 조회 (관리자용 - 클라이언트가 보낸 것 중 읽지 않은 것)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id: submissionId } = await context.params;

    const { createClient: createServiceClient } = await import('@/utils/supabase/service');
    const serviceSupabase = createServiceClient();

    // 클라이언트가 보낸 피드백 중 읽지 않은 것 카운트
    const { count, error } = await serviceSupabase
      .from('kakaomap_content_item_feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId)
      .eq('sender_type', 'client')
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return NextResponse.json(
        { error: '미읽음 피드백 수를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error in GET unread count:', error);
    return NextResponse.json(
      { error: '미읽음 피드백 수를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
