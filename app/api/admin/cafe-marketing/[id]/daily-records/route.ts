import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const supabase = await createClient();

    // Get daily records for this submission
    const { data: records, error } = await supabase
      .from('cafe_marketing_daily_records')
      .select('*')
      .eq('submission_id', id)
      .order('record_date', { ascending: false });

    if (error) {
      console.error('Error fetching daily records:', error);
      return NextResponse.json(
        { error: '일일 기록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      records: records || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/cafe-marketing/[id]/daily-records:', error);
    return NextResponse.json(
      { error: '일일 기록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const body = await request.json();
    const { record_date, completed_count, notes } = body;

    if (!record_date || completed_count === undefined) {
      return NextResponse.json(
        { error: '날짜와 완료 건수를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (completed_count < 0) {
      return NextResponse.json(
        { error: '완료 건수는 0 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if submission exists
    const { data: submission, error: submissionError } = await supabase
      .from('cafe_marketing_submissions')
      .select('id, total_count, status')
      .eq('id', id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: '제출 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Insert or update daily record (upsert)
    const { data: record, error: recordError } = await supabase
      .from('cafe_marketing_daily_records')
      .upsert(
        {
          submission_id: id,
          record_date,
          completed_count,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'submission_id,record_date',
        }
      )
      .select()
      .single();

    if (recordError) {
      console.error('Error creating/updating daily record:', recordError);
      return NextResponse.json(
        { error: '일일 기록 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Change status to in_progress if pending (regardless of first record or not)
    if (submission.status === 'pending') {
      await supabase
        .from('cafe_marketing_submissions')
        .update({ status: 'in_progress' })
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      message: '일일 기록이 저장되었습니다.',
      record,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/cafe-marketing/[id]/daily-records:', error);
    return NextResponse.json(
      { error: '일일 기록 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
