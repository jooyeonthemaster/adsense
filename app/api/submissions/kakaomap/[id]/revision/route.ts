import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id } = await params;
    const body = await request.json();
    const { request_content, request_reason } = body;

    if (!request_content) {
      return NextResponse.json(
        { error: '수정 요청 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify submission belongs to client
    const { data: submission, error: fetchError } = await supabase
      .from('kakaomap_review_submissions')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: '접수 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Only allow revision request in 'review' status
    if (submission.status !== 'review') {
      return NextResponse.json(
        { error: '검수 대기 상태에서만 수정 요청이 가능합니다.' },
        { status: 400 }
      );
    }

    // Create revision request
    const { data: revisionRequest, error: createError } = await supabase
      .from('kakaomap_revision_requests')
      .insert({
        submission_id: id,
        requested_by: user.id,
        request_content,
        request_reason,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating revision request:', createError);
      return NextResponse.json(
        { error: '수정 요청 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Update submission status to revision_requested
    const { error: updateError } = await supabase
      .from('kakaomap_review_submissions')
      .update({ status: 'revision_requested' })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating submission status:', updateError);
      return NextResponse.json(
        { error: '상태 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Create automatic message notification
    await supabase.from('kakaomap_messages').insert({
      submission_id: id,
      sender_type: 'client',
      sender_id: user.id,
      sender_name: user.name,
      content: `수정 요청: ${request_content}`,
      is_read: false,
    });

    // 관리자 전체에게 알림 발송
    await supabase.from('notifications').insert({
      recipient_id: null, // null = 전체 관리자
      recipient_role: 'admin',
      type: 'kakaomap_revision_requested',
      title: '카카오맵 수정 요청',
      message: `${submission.company_name} 카카오맵 리뷰에서 수정 요청이 접수되었습니다.`,
      data: {
        submission_id: id,
        submission_type: 'kakaomap_review_submissions',
        revision_request_id: revisionRequest.id,
        request_content: request_content,
        link: `/admin/kakaomap/${id}`,
      },
      read: false,
    });

    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      message: '수정 요청이 전송되었습니다.',
      revision_request: revisionRequest,
    });
  } catch (error) {
    console.error('Error in POST /api/submissions/kakaomap/[id]/revision:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id } = await params;
    const supabase = await createClient();

    // Verify submission belongs to client
    const { data: submission, error: fetchError } = await supabase
      .from('kakaomap_review_submissions')
      .select('id')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: '접수 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get all revision requests for this submission
    const { data: revisionRequests, error } = await supabase
      .from('kakaomap_revision_requests')
      .select('*')
      .eq('submission_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching revision requests:', error);
      return NextResponse.json(
        { error: '수정 요청 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      revision_requests: revisionRequests || [],
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/kakaomap/[id]/revision:', error);
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
