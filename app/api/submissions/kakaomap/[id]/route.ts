import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id } = await params;
    const supabase = await createClient();

    // Get specific submission with all related data
    const { data: submission, error } = await supabase
      .from('kakaomap_review_submissions')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        { error: '접수 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get content items
    const { data: contentItems } = await supabase
      .from('kakaomap_content_items')
      .select('*')
      .eq('submission_id', id)
      .order('upload_order', { ascending: true });

    // Get revision requests
    const { data: revisionRequests } = await supabase
      .from('kakaomap_revision_requests')
      .select('*')
      .eq('submission_id', id)
      .order('created_at', { ascending: false });

    // Get messages
    const { data: messages } = await supabase
      .from('kakaomap_messages')
      .select('*')
      .eq('submission_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        content_items: contentItems || [],
        revision_requests: revisionRequests || [],
        messages: messages || [],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/kakaomap/[id]:', error);
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

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

    // Handle different actions
    if (action === 'cancel') {
      // Only allow cancellation for certain statuses
      const cancellableStatuses = ['pending', 'waiting_content'];
      if (!cancellableStatuses.includes(submission.status)) {
        return NextResponse.json(
          { error: '취소할 수 없는 상태입니다.' },
          { status: 400 }
        );
      }

      // Get client's current points
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('points')
        .eq('id', user.id)
        .single();

      if (clientError || !client) {
        return NextResponse.json(
          { error: '거래처 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // Refund points (100% for pending/waiting_content)
      const refundRate = 1.0;
      const refundAmount = Math.floor(submission.total_points * refundRate);
      const newBalance = client.points + refundAmount;

      // Update submission status
      const { error: updateError } = await supabase
        .from('kakaomap_review_submissions')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (updateError) {
        console.error('Error cancelling submission:', updateError);
        return NextResponse.json(
          { error: '취소 처리 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // Refund points
      const { error: pointsError } = await supabase
        .from('clients')
        .update({ points: newBalance })
        .eq('id', user.id);

      if (pointsError) {
        console.error('Error refunding points:', pointsError);
        return NextResponse.json(
          { error: '포인트 환불 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // Create point transaction record
      await supabase.from('point_transactions').insert({
        client_id: user.id,
        transaction_type: 'refund',
        amount: refundAmount,
        balance_after: newBalance,
        reference_type: 'kakaomap_submission',
        reference_id: submission.id,
        description: `K맵 리뷰 취소 환불 (${submission.company_name}) - 100%`,
      });

      revalidatePath('/dashboard', 'layout');

      return NextResponse.json({
        success: true,
        message: '접수가 취소되었습니다.',
        refund_amount: refundAmount,
        new_balance: newBalance,
      });
    }

    if (action === 'approve_content') {
      // Update status to in_progress after content approval
      const { error: updateError } = await supabase
        .from('kakaomap_review_submissions')
        .update({ status: 'in_progress' })
        .eq('id', id);

      if (updateError) {
        return NextResponse.json(
          { error: '승인 처리 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      revalidatePath('/dashboard', 'layout');

      return NextResponse.json({
        success: true,
        message: '콘텐츠가 승인되었습니다.',
      });
    }

    // Handle general update
    const { error: updateError } = await supabase
      .from('kakaomap_review_submissions')
      .update(updateData)
      .eq('id', id)
      .eq('client_id', user.id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json(
        { error: '업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      message: '업데이트 되었습니다.',
    });
  } catch (error) {
    console.error('Error in PUT /api/submissions/kakaomap/[id]:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
