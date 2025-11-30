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

    // 1:1 문의 메시지도 함께 조회
    const { data: messages, error: messagesError } = await serviceSupabase
      .from('kakaomap_messages')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // 메시지를 피드백 형식으로 변환하여 합치기
    const messagesAsFeedback = (messages || []).map((msg: any) => ({
      id: msg.id,
      submission_id: msg.submission_id,
      content_item_id: null,
      sender_type: msg.sender_type,
      sender_id: msg.sender_id,
      sender_name: msg.sender_name,
      message: msg.content,
      created_at: msg.created_at,
      source: 'message', // 출처 구분용
    }));

    // 기존 피드백에 source 추가
    const feedbacksWithSource = (feedbacks || []).map((fb: any) => ({
      ...fb,
      source: 'feedback',
    }));

    // 두 배열 합치고 시간순 정렬
    const combined = [...feedbacksWithSource, ...messagesAsFeedback].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      feedbacks: combined,
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

    // Get submission info for notification
    const { data: submission } = await supabase
      .from('kakaomap_review_submissions')
      .select('id, client_id, company_name')
      .eq('id', submissionId)
      .single();

    // Verify access
    if (user.type === 'client') {
      if (!submission || submission.client_id !== user.id) {
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

    // 상대방에게 알림 발송
    if (submission) {
      if (user.type === 'admin') {
        // 관리자가 피드백 → 클라이언트에게 알림
        await serviceSupabase.from('notifications').insert({
          recipient_id: submission.client_id,
          recipient_role: 'client',
          type: 'kakaomap_feedback_added',
          title: '카카오맵 새 피드백',
          message: `${submission.company_name} 카카오맵 리뷰에 관리자 피드백이 추가되었습니다.`,
          data: {
            submission_id: submissionId,
            submission_type: 'kakaomap_review_submissions',
            feedback_id: feedback.id,
            link: `/dashboard/review/kmap/status`,
          },
          read: false,
        });
      } else {
        // 클라이언트가 피드백 → 관리자 전체에게 알림
        await serviceSupabase.from('notifications').insert({
          recipient_id: null,
          recipient_role: 'admin',
          type: 'kakaomap_feedback_added',
          title: '카카오맵 새 피드백',
          message: `${submission.company_name} 카카오맵 리뷰에 고객 피드백이 추가되었습니다.`,
          data: {
            submission_id: submissionId,
            submission_type: 'kakaomap_review_submissions',
            feedback_id: feedback.id,
            link: `/admin/kakaomap/${submissionId}`,
          },
          read: false,
        });
      }
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
