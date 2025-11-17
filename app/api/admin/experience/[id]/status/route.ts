import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/experience/[id]/status
// Get comprehensive campaign status
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await props.params;

    const supabase = await createClient();

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('experience_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (submissionError) {
      console.error('Error fetching submission:', submissionError);
      return NextResponse.json({ error: submissionError.message }, { status: 500 });
    }

    // Get all bloggers with rankings
    const { data: bloggers, error: bloggersError } = await supabase
      .from('experience_bloggers')
      .select(`
        *,
        keyword_rankings:experience_keyword_rankings(*)
      `)
      .eq('submission_id', id)
      .order('created_at', { ascending: true });

    if (bloggersError) {
      console.error('Error fetching bloggers:', bloggersError);
      return NextResponse.json({ error: bloggersError.message }, { status: 500 });
    }

    // Import WORKFLOW_CONFIG dynamically
    const { WORKFLOW_CONFIG } = await import('@/types/experience-blogger');
    const { getWorkflowSteps } = await import('@/lib/experience-deadline-utils');

    const config = WORKFLOW_CONFIG[submission.experience_type];
    const hasSelection = config?.hasSelection ?? true;
    const hasKeywordRanking = config?.hasKeywordRanking ?? true;
    const workflowSteps = getWorkflowSteps(submission.experience_type);

    // Calculate statistics based on workflow type
    const totalBloggers = bloggers?.length || 0;

    // For types with selection: filter by selected_by_client
    // For types without selection: use all bloggers
    const selectedBloggers = hasSelection
      ? bloggers?.filter((b) => b.selected_by_client) || []
      : bloggers || [];

    const selectedCount = selectedBloggers.length;
    const scheduledCount = selectedBloggers.filter((b) => b.schedule_confirmed).length;
    const confirmedCount = selectedBloggers.filter((b) => b.client_confirmed).length;
    const publishedCount = selectedBloggers.filter((b) => b.published).length;
    const withRankingsCount = selectedBloggers.filter(
      (b) => b.keyword_rankings && b.keyword_rankings.length > 0
    ).length;

    // Check if campaign is complete (all selected bloggers have published)
    const campaignComplete = selectedCount > 0 && selectedCount === publishedCount;

    // Update campaign completion status if needed
    if (campaignComplete && !submission.campaign_completed) {
      const { error: updateError } = await supabase
        .from('experience_submissions')
        .update({
          campaign_completed: true,
          status: 'completed',
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating campaign completion:', updateError);
      } else {
        submission.campaign_completed = true;
        submission.status = 'completed';
      }
    }

    // Build dynamic workflow progress based on experience type
    const workflowProgress: Record<string, boolean> = {};
    workflowSteps.forEach((stepType, index) => {
      const stepKey = `step${index + 1}_${stepType}`;

      switch (stepType) {
        case 'register':
          workflowProgress[stepKey] = submission.bloggers_registered;
          break;
        case 'selection':
          workflowProgress[stepKey] = submission.bloggers_selected;
          break;
        case 'schedule':
          workflowProgress[stepKey] = submission.schedule_confirmed;
          break;
        case 'client_confirm':
          workflowProgress[stepKey] = submission.client_confirmed;
          break;
        case 'publish':
          workflowProgress[stepKey] = submission.all_published;
          break;
        case 'keyword_ranking':
          workflowProgress[stepKey] = withRankingsCount > 0;
          break;
        case 'complete':
          workflowProgress[stepKey] = submission.campaign_completed;
          break;
      }
    });

    // Calculate overall progress percentage based on actual workflow steps
    const completedSteps = Object.values(workflowProgress).filter((v) => v === true).length;
    const totalSteps = workflowSteps.length;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    return NextResponse.json({
      submission,
      bloggers,
      statistics: {
        total_bloggers: totalBloggers,
        selected_count: selectedCount,
        scheduled_count: scheduledCount,
        confirmed_count: confirmedCount,
        published_count: publishedCount,
        with_rankings_count: withRankingsCount,
        campaign_complete: campaignComplete,
      },
      workflow_progress: workflowProgress,
      progress_percentage: progressPercentage,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/experience/[id]/status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
