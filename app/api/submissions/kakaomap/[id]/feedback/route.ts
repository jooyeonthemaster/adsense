import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET: 전체 submission에 대한 공통 피드백 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client', 'admin']);
    const { id: submissionId } = await context.params;
    const supabase = await createClient();

    // Verify access
    if (user.type === 'client') {
      const { data: submission } = await supabase
        .from('kakaomap_review_submissions')
        .select('id')
        .eq('id', submissionId)
        .eq('client_id', user.id)
        .single();

      if (!submission) {
        return NextResponse.json(
          { error: '권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // Get general feedbacks (content_item_id IS NULL)
    const { createClient: createServiceClient } = await import('@/utils/supabase/service');
    const serviceSupabase = createServiceClient();

    const { data: feedbacks, error } = await serviceSupabase
      .from('kakaomap_content_item_feedbacks')
      .select('*')
      .eq('submission_id', submissionId)
      .is('content_item_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching general feedbacks:', error);
      return NextResponse.json(
        { error: '공통 피드백을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedbacks: feedbacks || [],
    });
  } catch (error) {
    console.error('Error in GET general feedback:', error);
    return NextResponse.json(
      { error: '공통 피드백을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 공통 피드백 추가
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client', 'admin']);
    const { id: submissionId } = await context.params;
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: '메시지를 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify access
    if (user.type === 'client') {
      const { data: submission } = await supabase
        .from('kakaomap_review_submissions')
        .select('id')
        .eq('id', submissionId)
        .eq('client_id', user.id)
        .single();

      if (!submission) {
        return NextResponse.json(
          { error: '권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    const senderName = user.name || (user.type === 'admin' ? '관리자' : '고객');

    // Create general feedback (content_item_id = NULL)
    const { createClient: createServiceClient } = await import('@/utils/supabase/service');
    const serviceSupabase = createServiceClient();

    const { data: feedback, error: insertError } = await serviceSupabase
      .from('kakaomap_content_item_feedbacks')
      .insert({
        content_item_id: null, // NULL = 공통 피드백
        submission_id: submissionId,
        sender_type: user.type === 'admin' ? 'admin' : 'client',
        sender_id: user.id,
        sender_name: senderName,
        message: message.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating general feedback:', insertError);
      return NextResponse.json(
        {
          error: '공통 피드백 저장 중 오류가 발생했습니다.',
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error('Error in POST general feedback:', error);
    return NextResponse.json(
      { error: '공통 피드백 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
