import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// POST /api/admin/experience/[id]/bloggers/[bloggerId]/publish
// Mark blogger content as published with URL (Step 5)
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; bloggerId: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id, bloggerId } = await props.params;
    const body = await request.json();
    const { published_url } = body;

    if (!published_url) {
      return NextResponse.json(
        { error: 'published_url is required' },
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

    // Update blogger as published
    const { error: updateError } = await supabase
      .from('experience_bloggers')
      .update({
        published: true,
        published_url,
        published_at: new Date().toISOString(),
      })
      .eq('id', bloggerId)
      .eq('submission_id', id);

    if (updateError) {
      console.error('Error marking blogger as published:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Check if all bloggers have published (selected for types with selection, all for types without)
    const allBloggersQuery = supabase
      .from('experience_bloggers')
      .select('id, published')
      .eq('submission_id', id);

    // Only filter by selected_by_client for types with selection workflow
    if (hasSelection) {
      allBloggersQuery.eq('selected_by_client', true);
    }

    const { data: allBloggers, error: fetchError } = await allBloggersQuery;

    if (fetchError) {
      console.error('Error fetching all bloggers:', fetchError);
    } else if (allBloggers) {
      const allPublished = allBloggers.every((b) => b.published);

      // Update submission if all bloggers have published
      if (allPublished) {
        const { error: submissionError } = await supabase
          .from('experience_submissions')
          .update({
            all_published: true,
          })
          .eq('id', id);

        if (submissionError) {
          console.error('Error updating submission all_published:', submissionError);
        }
      }
    }

    return NextResponse.json({
      message: 'Content marked as published successfully',
      published_url,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/experience/[id]/bloggers/[bloggerId]/publish:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// DELETE /api/admin/experience/[id]/bloggers/[bloggerId]/publish
// Unpublish blogger content (admin correction)
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; bloggerId: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id, bloggerId } = await props.params;

    const supabase = await createClient();

    // Update blogger as unpublished
    const { error: updateError } = await supabase
      .from('experience_bloggers')
      .update({
        published: false,
        published_url: null,
        published_at: null,
      })
      .eq('id', bloggerId)
      .eq('submission_id', id);

    if (updateError) {
      console.error('Error unpublishing blogger:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update submission all_published status
    const { error: submissionError } = await supabase
      .from('experience_submissions')
      .update({
        all_published: false,
      })
      .eq('id', id);

    if (submissionError) {
      console.error('Error updating submission:', submissionError);
    }

    return NextResponse.json({
      message: 'Content unpublished successfully',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/experience/[id]/bloggers/[bloggerId]/publish:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
