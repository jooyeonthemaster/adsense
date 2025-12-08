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
      .from('blog_distribution_submissions')
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

    // Fetch daily records
    const { data: dailyRecords } = await supabase
      .from('blog_distribution_daily_records')
      .select('*')
      .eq('submission_id', id)
      .order('record_date', { ascending: false });

    // Fetch content items for progress calculation
    const { data: contentItems } = await supabase
      .from('blog_content_items')
      .select('id')
      .eq('submission_id', id);

    // Calculate progress based on content_items count
    const completedCount = contentItems?.length || 0;
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
    console.error('Error in GET /api/submissions/blog/[id]:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
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
    const { action } = body;

    if (action !== 'cancel') {
      return NextResponse.json(
        { error: '올바르지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get submission
    const { data: submission, error: fetchError } = await supabase
      .from('blog_distribution_submissions')
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

    // Check if cancellable (only pending or in_progress)
    if (!['pending', 'in_progress'].includes(submission.status)) {
      return NextResponse.json(
        { error: '취소할 수 없는 상태입니다.' },
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

    // Calculate refund based on completed work
    const { data: dailyRecords } = await supabase
      .from('blog_distribution_daily_records')
      .select('completed_count')
      .eq('submission_id', id);

    const completedCount = dailyRecords?.reduce((sum, r) => sum + r.completed_count, 0) || 0;
    const remainingCount = submission.total_count - completedCount;
    const refundRatio = submission.total_count > 0 ? remainingCount / submission.total_count : 1;
    const refundAmount = Math.round(submission.total_points * refundRatio);

    // Update submission status
    const { error: updateError } = await supabase
      .from('blog_distribution_submissions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error cancelling submission:', updateError);
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
        reference_type: 'blog_submission',
        reference_id: submission.id,
        description: `블로그 배포 취소 환불 (${submission.company_name})`,
      });

      // Revalidate dashboard
      revalidatePath('/dashboard', 'layout');

      return NextResponse.json({
        success: true,
        message: '중단 신청이 완료되었습니다.',
        refund_amount: refundAmount,
        new_balance: newBalance,
      });
    }

    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      message: '중단 신청이 완료되었습니다.',
      refund_amount: 0,
    });
  } catch (error) {
    console.error('Error in PUT /api/submissions/blog/[id]:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
