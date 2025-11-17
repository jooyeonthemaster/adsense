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

    // Get submission detail
    const { data: submission, error } = await supabase
      .from('cafe_marketing_submissions')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        { error: '제출 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Fetch daily records
    const { data: dailyRecords } = await supabase
      .from('cafe_marketing_daily_records')
      .select('*')
      .eq('submission_id', id)
      .order('record_date', { ascending: false });

    // Calculate progress
    const completedCount = dailyRecords?.reduce((sum, r) => sum + r.completed_count, 0) || 0;
    const progressPercentage = submission.total_count > 0
      ? Math.round((completedCount / submission.total_count) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        completed_count: completedCount,
        progress_percentage: progressPercentage,
      },
      daily_records: dailyRecords || [],
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/cafe/[id]:', error);
    return NextResponse.json(
      { error: '제출 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'cancel') {
      return NextResponse.json(
        { error: '올바르지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get submission
    const { data: submission, error: submissionError } = await supabase
      .from('cafe_marketing_submissions')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: '제출 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if cancellable (only pending, approved, script_writing, script_completed can be cancelled)
    const cancellableStatuses = ['pending', 'approved', 'script_writing', 'script_completed'];
    if (!cancellableStatuses.includes(submission.status)) {
      return NextResponse.json(
        { error: '이미 구동 중이거나 완료된 접수는 취소할 수 없습니다.' },
        { status: 400 }
      );
    }

    // Get client info
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

    // Calculate refund (if in_progress, calculate based on completed work)
    const { data: dailyRecords } = await supabase
      .from('cafe_marketing_daily_records')
      .select('completed_count')
      .eq('submission_id', id);

    const completedCount = dailyRecords?.reduce((sum, r) => sum + r.completed_count, 0) || 0;
    const remainingCount = submission.total_count - completedCount;
    const refundRatio = remainingCount / submission.total_count;
    const refundAmount = Math.round(submission.total_points * refundRatio);

    // Update submission status
    const { error: updateError } = await supabase
      .from('cafe_marketing_submissions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json(
        { error: '취소 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Refund points
    if (refundAmount > 0) {
      const newBalance = client.points + refundAmount;
      const { error: refundError } = await supabase
        .from('clients')
        .update({ points: newBalance })
        .eq('id', user.id);

      if (refundError) {
        console.error('Error refunding points:', refundError);
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
        reference_type: 'cafe_submission',
        reference_id: submission.id,
        description: `카페 침투 마케팅 취소 환불 (${submission.company_name})`,
      });

      // Revalidate dashboard
      revalidatePath('/dashboard', 'layout');

      return NextResponse.json({
        success: true,
        message: '취소가 완료되었습니다.',
        refund_amount: refundAmount,
        new_balance: newBalance,
      });
    }

    return NextResponse.json({
      success: true,
      message: '취소가 완료되었습니다.',
      refund_amount: 0,
    });
  } catch (error) {
    console.error('Error in PATCH /api/submissions/cafe/[id]:', error);
    return NextResponse.json(
      { error: '취소 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
