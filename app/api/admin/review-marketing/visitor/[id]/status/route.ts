import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const { status } = await request.json();

    const supabase = await createClient();

    const { error } = await supabase
      .from('receipt_review_submissions')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      return NextResponse.json({ error: 'Status update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
