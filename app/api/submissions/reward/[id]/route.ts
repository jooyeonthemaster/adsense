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
      .from('place_submissions')
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
    console.error('Error fetching submission detail:', error);
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
      .from('place_submissions')
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

    // Update submission status - 리워드는 환불 없음
    const { error: updateError } = await supabase
      .from('place_submissions')
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

    // Revalidate dashboard
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      message: '중단 신청이 완료되었습니다. (리워드는 환불이 진행되지 않습니다)',
      refund_amount: 0,
    });
  } catch (error) {
    console.error('Error in PUT /api/submissions/reward/[id]:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
