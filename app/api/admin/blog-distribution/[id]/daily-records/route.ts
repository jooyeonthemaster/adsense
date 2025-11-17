import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// 일일 기록 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: records, error } = await supabase
      .from('blog_distribution_daily_records')
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
    console.error('Error in GET daily records:', error);
    return NextResponse.json(
      { error: '일일 기록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 일일 기록 저장 또는 업데이트
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await context.params;
    const body = await request.json();
    const { record_date, completed_count, notes } = body;

    if (!record_date || completed_count === undefined) {
      return NextResponse.json(
        { error: '날짜와 완료 건수는 필수입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if this is the first record
    const { data: existingRecords } = await supabase
      .from('blog_distribution_daily_records')
      .select('id')
      .eq('submission_id', id);

    const isFirstRecord = !existingRecords || existingRecords.length === 0;

    // Upsert (존재하면 업데이트, 없으면 삽입)
    const { data: record, error } = await supabase
      .from('blog_distribution_daily_records')
      .upsert({
        submission_id: id,
        record_date,
        completed_count,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'submission_id,record_date',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving daily record:', error);
      return NextResponse.json(
        { error: '일일 기록 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // If first record, change status to in_progress
    if (isFirstRecord) {
      const { data: submission } = await supabase
        .from('blog_distribution_submissions')
        .select('status')
        .eq('id', id)
        .single();

      if (submission && submission.status === 'pending') {
        await supabase
          .from('blog_distribution_submissions')
          .update({ status: 'in_progress' })
          .eq('id', id);
      }
    }

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('Error in POST daily records:', error);
    return NextResponse.json(
      { error: '일일 기록 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
