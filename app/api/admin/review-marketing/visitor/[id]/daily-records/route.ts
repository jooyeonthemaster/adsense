import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const supabase = await createClient();

    // receipt_content_items에서 review_registered_date 기준으로 날짜별 건수 집계
    const { data: contentItems, error } = await supabase
      .from('receipt_content_items')
      .select('review_registered_date')
      .eq('submission_id', id)
      .not('review_registered_date', 'is', null);

    if (error) {
      console.error('Error fetching content items:', error);
      return NextResponse.json({ records: [] }, { status: 200 });
    }

    // 날짜별로 그룹화하여 건수 계산
    const dateCountMap = new Map<string, number>();
    for (const item of contentItems || []) {
      if (item.review_registered_date) {
        const dateStr = item.review_registered_date;
        dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
      }
    }

    // DailyRecordCalendar에서 사용하는 형식으로 변환
    const records = Array.from(dateCountMap.entries()).map(([date, count]) => ({
      date,
      actual_count: count,
      notes: '',
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ records: [] }, { status: 200 });
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
      return NextResponse.json({ error: 'record_date and completed_count are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Upsert daily record
    const { error } = await supabase
      .from('receipt_review_daily_records')
      .upsert({
        submission_id: id,
        date: record_date,
        actual_count: completed_count,
        notes,
      }, {
        onConflict: 'submission_id,date'
      });

    if (error) {
      console.error('Error saving daily record:', error);
      return NextResponse.json({ error: 'Failed to save daily record' }, { status: 500 });
    }

    // Change status to in_progress if pending (regardless of first record or not)
    const { data: submission } = await supabase
      .from('receipt_review_submissions')
      .select('status')
      .eq('id', id)
      .single();

    if (submission && submission.status === 'pending') {
      await supabase
        .from('receipt_review_submissions')
        .update({ status: 'in_progress' })
        .eq('id', id);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
