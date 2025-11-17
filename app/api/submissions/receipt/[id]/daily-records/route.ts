import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id } = await params;
    const supabase = await createClient();

    // Verify submission belongs to client
    const { data: submission, error: subError } = await supabase
      .from('receipt_review_submissions')
      .select('id')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: '접수 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get daily records
    const { data: records, error } = await supabase
      .from('receipt_review_daily_records')
      .select('date, actual_count, notes')
      .eq('submission_id', id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching daily records:', error);
      return NextResponse.json(
        { error: '일별 기록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      records: records || [],
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/receipt/[id]/daily-records:', error);
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
