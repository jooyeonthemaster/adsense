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
    const { data: submission, error: submissionError } = await supabase
      .from('place_submissions')
      .select('id')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: '접수 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get daily records
    const { data: records, error } = await supabase
      .from('place_submissions_daily_records')
      .select('*')
      .eq('submission_id', id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching daily records:', error);
      return NextResponse.json(
        { error: '일별 기록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      records: records || [],
    });
  } catch (error) {
    console.error('Error in GET daily records:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
