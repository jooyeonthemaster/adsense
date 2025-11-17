import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// PUT /api/admin/experience/[id]/bloggers/select
// Client selects bloggers via checkbox (Step 2)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Can be accessed by both admin and client
    const user = await requireAuth();
    const { id } = await props.params;
    const body = await request.json();
    const { selected_blogger_ids } = body;

    if (!Array.isArray(selected_blogger_ids)) {
      return NextResponse.json(
        { error: 'selected_blogger_ids array is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, unselect all bloggers for this submission
    const { error: unselectError } = await supabase
      .from('experience_bloggers')
      .update({
        selected_by_client: false,
        selected_at: null,
      })
      .eq('submission_id', id);

    if (unselectError) {
      console.error('Error unselecting bloggers:', unselectError);
      return NextResponse.json({ error: unselectError.message }, { status: 500 });
    }

    // Then select the chosen bloggers
    if (selected_blogger_ids.length > 0) {
      const { error: selectError } = await supabase
        .from('experience_bloggers')
        .update({
          selected_by_client: true,
          selected_at: new Date().toISOString(),
        })
        .in('id', selected_blogger_ids);

      if (selectError) {
        console.error('Error selecting bloggers:', selectError);
        return NextResponse.json({ error: selectError.message }, { status: 500 });
      }
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('experience_submissions')
      .update({
        bloggers_selected: true,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
    }

    return NextResponse.json({
      message: 'Blogger selection saved successfully',
      selected_count: selected_blogger_ids.length,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/experience/[id]/bloggers/select:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
