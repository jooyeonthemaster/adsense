import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// PATCH: 검수 상태 업데이트 (클라이언트가 검수완료/수정요청 버튼 클릭)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id: submissionId, itemId } = await context.params;
    const body = await request.json();
    const { review_status, feedback_message } = body;

    if (!['approved', 'revision_requested'].includes(review_status)) {
      return NextResponse.json(
        { error: '유효하지 않은 검수 상태입니다.' },
        { status: 400 }
      );
    }

    if (review_status === 'revision_requested' && !feedback_message?.trim()) {
      return NextResponse.json(
        { error: '수정 요청 시 피드백 메시지를 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify submission belongs to client
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

    // Update content item review status
    const updateData: any = { review_status };

    // 클라이언트가 검수 완료하면 status도 approved로 변경
    // (단, 진행률은 review_registered_date 기준으로 별도 계산)
    if (review_status === 'approved') {
      updateData.status = 'approved';
    } else if (review_status === 'revision_requested') {
      updateData.has_been_revised = true;
      updateData.status = 'rejected';  // 수정 요청 시 rejected로 변경
    }

    const { error: updateError } = await supabase
      .from('kakaomap_content_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('submission_id', submissionId);

    if (updateError) {
      console.error('Error updating review status:', updateError);
      return NextResponse.json(
        { error: '검수 상태 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // If revision_requested, create feedback
    if (review_status === 'revision_requested' && feedback_message) {
      const { data: userData } = await supabase
        .from('clients')
        .select('name')
        .eq('id', user.id)
        .single();

      // Use service role client to bypass RLS
      const { createClient: createServiceClient } = await import('@/utils/supabase/service');
      const serviceSupabase = createServiceClient();

      const { error: feedbackError } = await serviceSupabase
        .from('kakaomap_content_item_feedbacks')
        .insert({
          content_item_id: itemId,
          submission_id: submissionId,
          sender_type: 'client',
          sender_id: user.id,
          sender_name: userData?.name || '고객',
          message: feedback_message.trim(),
        });

      if (feedbackError) {
        console.error('Error creating revision feedback:', feedbackError);
        console.error('Feedback data:', {
          content_item_id: itemId,
          submission_id: submissionId,
          sender_type: 'client',
          sender_id: user.id,
          sender_name: userData?.name || '고객',
          message: feedback_message.trim(),
        });
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      review_status,
    });
  } catch (error) {
    console.error('Error in PATCH review:', error);
    return NextResponse.json(
      { error: '검수 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
