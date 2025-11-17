import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
      .from('receipt_review_submissions')
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

    // Handle cancel action
    if (action === 'cancel') {
      // Only allow cancellation for pending or in_progress status
      if (!['pending', 'approved'].includes(submission.status)) {
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

      // Refund points (50% if in_progress, 100% if pending)
      const refundRate = submission.status === 'pending' ? 1.0 : 0.5;
      const refundAmount = Math.floor(submission.total_points * refundRate);
      const newBalance = client.points + refundAmount;

      // Update submission status
      const { error: updateError } = await supabase
        .from('receipt_review_submissions')
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
        reference_type: 'receipt_submission',
        reference_id: submission.id,
        description: `영수증 리뷰 취소 환불 (${submission.company_name}) - ${refundRate * 100}%`,
      });

      // Revalidate dashboard
      revalidatePath('/dashboard', 'layout');

      return NextResponse.json({
        success: true,
        message: '접수가 취소되었습니다.',
        refund_amount: refundAmount,
        refund_rate: refundRate,
        new_balance: newBalance,
      });
    }

    // Handle general update
    const { error: updateError } = await supabase
      .from('receipt_review_submissions')
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
    console.error('Error in PUT /api/submissions/receipt/[id]:', error);
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

    // Get specific submission
    const { data: submission, error } = await supabase
      .from('receipt_review_submissions')
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

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/receipt/[id]:', error);
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
