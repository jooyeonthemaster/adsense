import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// POST /api/client/experience/[id]/select-bloggers
// Client selects which bloggers they want for the campaign (Step 2)
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id } = await props.params;
    const body = await request.json();
    const { blogger_ids } = body;

    if (!Array.isArray(blogger_ids) || blogger_ids.length === 0) {
      return NextResponse.json(
        { error: 'blogger_ids array is required and must not be empty' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify this submission belongs to the client
    const { data: submission, error: submissionError } = await supabase
      .from('experience_submissions')
      .select('id, bloggers_registered')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (!submission.bloggers_registered) {
      return NextResponse.json(
        { error: 'Bloggers have not been registered by admin yet' },
        { status: 400 }
      );
    }

    // First, unselect all bloggers for this submission
    await supabase
      .from('experience_bloggers')
      .update({
        selected_by_client: false,
        selected_at: null,
      })
      .eq('submission_id', id);

    // Then, mark selected bloggers
    const { error: selectError } = await supabase
      .from('experience_bloggers')
      .update({
        selected_by_client: true,
        selected_at: new Date().toISOString(),
      })
      .in('id', blogger_ids)
      .eq('submission_id', id);

    if (selectError) {
      console.error('Error selecting bloggers:', selectError);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('experience_submissions')
      .update({
        bloggers_selected: true,
        status: 'in_progress',
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
    }

    return NextResponse.json({
      message: 'Bloggers selected successfully',
      selected_count: blogger_ids.length,
    });
  } catch (error: any) {
    console.error('Error in POST /api/client/experience/[id]/select-bloggers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
