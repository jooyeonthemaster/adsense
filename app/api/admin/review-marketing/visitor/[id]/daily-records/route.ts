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
      .from('receipt_review_daily_records')
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
    const { date, actual_count, notes } = body;

    if (!date || actual_count === undefined) {
      return NextResponse.json({ error: 'Date and actual_count are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Upsert daily record
    const { error } = await supabase
      .from('receipt_review_daily_records')
      .upsert({
        submission_id: id,
        date,
        actual_count,
        notes,
      }, {
        onConflict: 'submission_id,date'
      });

    if (error) {
      console.error('Error saving daily record:', error);
      return NextResponse.json({ error: 'Failed to save daily record' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
