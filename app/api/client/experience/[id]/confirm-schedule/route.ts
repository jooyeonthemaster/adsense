import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireOnboardedClient } from '@/lib/auth';

// POST /api/client/experience/[id]/confirm-schedule
// Client confirms the visit schedule set by admin (Step 4)
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOnboardedClient();
    const { id } = await props.params;
    const body = await request.json();
    const { confirmed } = body;

    if (typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { error: 'confirmed field is required (boolean)' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify this submission belongs to the client
    const { data: submission, error: submissionError } = await supabase
      .from('experience_submissions')
      .select('id, bloggers_selected, schedule_confirmed, experience_type')
      .eq('id', id)
      .eq('client_id', user.id)
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

    // Only check blogger selection for types with selection workflow
    if (hasSelection && !submission.bloggers_selected) {
      return NextResponse.json(
        { error: 'Bloggers have not been selected yet' },
        { status: 400 }
      );
    }

    if (!submission.schedule_confirmed) {
      return NextResponse.json(
        { error: 'Admin has not set the schedule yet' },
        { status: 400 }
      );
    }

    console.log('[confirm-schedule] Experience type:', submission.experience_type);
    console.log('[confirm-schedule] Has selection:', hasSelection);
    console.log('[confirm-schedule] Submission ID:', id);

    // Mark all selected bloggers as client confirmed
    // For types with selection (blog-experience): only update selected bloggers
    // For types without selection (xiaohongshu, journalist, influencer): update all registered bloggers
    const confirmQuery = supabase
      .from('experience_bloggers')
      .update({
        client_confirmed: true,
        client_confirmed_at: new Date().toISOString(),
      })
      .eq('submission_id', id);

    // Only filter by selected_by_client for types with selection workflow
    if (hasSelection) {
      confirmQuery.eq('selected_by_client', true);
    }

    const { data: confirmData, error: confirmError } = await confirmQuery;

    console.log('[confirm-schedule] Update result:', { confirmData, confirmError });

    if (confirmError) {
      console.error('[confirm-schedule] Error confirming schedule:', confirmError);
      return NextResponse.json({ error: confirmError.message }, { status: 500 });
    }

    // Update submission
    const { error: updateError } = await supabase
      .from('experience_submissions')
      .update({
        client_confirmed: confirmed,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
    }

    return NextResponse.json({
      message: confirmed
        ? 'Schedule confirmed successfully'
        : 'Schedule confirmation cancelled',
    });
  } catch (error: any) {
    console.error('Error in POST /api/client/experience/[id]/confirm-schedule:', error);

    if (error.message === 'OnboardingRequired') {
      return NextResponse.json(
        {
          error: '온보딩을 완료해야 서비스를 이용할 수 있습니다.',
          redirect: '/onboarding'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
