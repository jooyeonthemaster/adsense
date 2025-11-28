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

    const { data: records, error } = await supabase
      .from('place_submissions_daily_records')
      .select('*')
      .eq('submission_id', id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching daily records:', error);
      return NextResponse.json({ records: [] }, { status: 200 });
    }

    return NextResponse.json({ records: records || [] }, { status: 200 });
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

    // Check if this is the first record
    const { data: existingRecords } = await supabase
      .from('place_submissions_daily_records')
      .select('id')
      .eq('submission_id', id);

    const isFirstRecord = !existingRecords || existingRecords.length === 0;

    // Upsert daily record
    const { error } = await supabase
      .from('place_submissions_daily_records')
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

    // If first record, change status to in_progress
    if (isFirstRecord) {
      const { data: submission } = await supabase
        .from('place_submissions')
        .select('status')
        .eq('id', id)
        .single();

      if (submission && (submission.status === 'pending' || submission.status === 'approved')) {
        await supabase
          .from('place_submissions')
          .update({ status: 'in_progress' })
          .eq('id', id);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
