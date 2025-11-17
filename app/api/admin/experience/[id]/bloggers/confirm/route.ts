import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// PUT /api/admin/experience/[id]/bloggers/confirm
// Client confirms final details or requests adjustment (Step 4)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Can be accessed by both admin and client
    const user = await requireAuth();
    const { id } = await props.params;
    const body = await request.json();
    const { confirmed, adjustment_requested, adjustment_notes } = body;

    if (typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { error: 'confirmed boolean field is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get submission to check experience_type
    const { data: submission, error: submissionError } = await supabase
      .from('experience_submissions')
      .select('experience_type')
      .eq('id', id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Import WORKFLOW_CONFIG dynamically
    const { WORKFLOW_CONFIG } = await import('@/types/experience-blogger');
    const config = WORKFLOW_CONFIG[submission.experience_type];
    const hasSelection = config?.hasSelection ?? true;

    // Get all scheduled bloggers (selected for types with selection, all for types without)
    const bloggersQuery = supabase
      .from('experience_bloggers')
      .select('id')
      .eq('submission_id', id)
      .eq('schedule_confirmed', true);

    // Only filter by selected_by_client for types with selection workflow
    if (hasSelection) {
      bloggersQuery.eq('selected_by_client', true);
    }

    const { data: bloggers, error: fetchError } = await bloggersQuery;

    if (fetchError) {
      console.error('Error fetching bloggers:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!bloggers || bloggers.length === 0) {
      return NextResponse.json(
        { error: 'No scheduled bloggers found for this submission' },
        { status: 400 }
      );
    }

    // Update all bloggers with client confirmation (selected for types with selection, all for types without)
    const updateQuery = supabase
      .from('experience_bloggers')
      .update({
        client_confirmed: confirmed,
        client_confirmed_at: confirmed ? new Date().toISOString() : null,
        adjustment_requested: adjustment_requested || false,
        adjustment_notes: adjustment_notes || null,
      })
      .eq('submission_id', id)
      .eq('schedule_confirmed', true);

    // Only filter by selected_by_client for types with selection workflow
    if (hasSelection) {
      updateQuery.eq('selected_by_client', true);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Error updating blogger confirmations:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update submission status
    const { error: updateSubmissionError } = await supabase
      .from('experience_submissions')
      .update({
        client_confirmed: confirmed && !adjustment_requested,
      })
      .eq('id', id);

    if (updateSubmissionError) {
      console.error('Error updating submission:', updateSubmissionError);
    }

    return NextResponse.json({
      message: confirmed
        ? adjustment_requested
          ? 'Adjustment request submitted successfully'
          : 'Schedule confirmed successfully'
        : 'Confirmation cancelled',
      adjustment_requested: adjustment_requested || false,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/experience/[id]/bloggers/confirm:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
