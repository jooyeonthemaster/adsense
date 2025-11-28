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

    // Get submission detail with client info
    const { data: submission, error } = await supabase
      .from('place_submissions')
      .select('*, clients(company_name, contact_person, email, phone)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching submission:', error);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ submission }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const body = await request.json();
    const { status, start_date, notes } = body;

    const supabase = await createClient();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (start_date) updateData.start_date = start_date;
    if (notes !== undefined) updateData.notes = notes;

    const { error } = await supabase
      .from('place_submissions')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating submission:', error);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
