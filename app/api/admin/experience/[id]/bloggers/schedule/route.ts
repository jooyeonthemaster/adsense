import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// PUT /api/admin/experience/[id]/bloggers/schedule
// Admin adds visit schedule for selected bloggers (Step 3)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await props.params;
    const body = await request.json();
    const { blogger_schedules } = body;

    if (!Array.isArray(blogger_schedules) || blogger_schedules.length === 0) {
      return NextResponse.json(
        { error: 'blogger_schedules array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each schedule has required fields
    for (const schedule of blogger_schedules) {
      if (!schedule.blogger_id || !schedule.visit_date) {
        return NextResponse.json(
          { error: 'Each schedule must have blogger_id and visit_date' },
          { status: 400 }
        );
      }
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

    // Update each blogger with visit schedule
    // For types with selection (blog-experience): only update selected bloggers
    // For types without selection (xiaohongshu, journalist, influencer): update all registered bloggers
    const updates = blogger_schedules.map((schedule: any) => {
      const query = supabase
        .from('experience_bloggers')
        .update({
          visit_date: schedule.visit_date,
          visit_time: schedule.visit_time || null,
          visit_count: schedule.visit_count || null,
          schedule_confirmed: true,
          schedule_confirmed_at: new Date().toISOString(),
        })
        .eq('id', schedule.blogger_id)
        .eq('submission_id', id);

      // Only filter by selected_by_client for types with selection workflow
      if (hasSelection) {
        query.eq('selected_by_client', true);
      }

      return query;
    });

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Error updating blogger schedules:', errors);
      return NextResponse.json(
        { error: 'Failed to update some blogger schedules' },
        { status: 500 }
      );
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('experience_submissions')
      .update({
        schedule_confirmed: true,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
    }

    return NextResponse.json({
      message: 'Visit schedules confirmed successfully',
      updated_count: blogger_schedules.length,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/experience/[id]/bloggers/schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
