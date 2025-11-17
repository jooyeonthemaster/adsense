import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// DELETE /api/admin/experience/[id]/bloggers/[bloggerId]
// Delete a blogger from the submission
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; bloggerId: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id, bloggerId } = await props.params;

    const supabase = await createClient();

    // Check if blogger is published
    const { data: blogger, error: fetchError } = await supabase
      .from('experience_bloggers')
      .select('published')
      .eq('id', bloggerId)
      .eq('submission_id', id)
      .single();

    if (fetchError || !blogger) {
      return NextResponse.json(
        { error: 'Blogger not found' },
        { status: 404 }
      );
    }

    if (blogger.published) {
      return NextResponse.json(
        { error: 'Cannot delete published blogger' },
        { status: 400 }
      );
    }

    // Delete blogger
    const { error: deleteError } = await supabase
      .from('experience_bloggers')
      .delete()
      .eq('id', bloggerId)
      .eq('submission_id', id);

    if (deleteError) {
      console.error('Error deleting blogger:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Check if there are any bloggers left
    const { data: remainingBloggers, error: countError } = await supabase
      .from('experience_bloggers')
      .select('id')
      .eq('submission_id', id);

    if (countError) {
      console.error('Error checking remaining bloggers:', countError);
    } else if (!remainingBloggers || remainingBloggers.length === 0) {
      // If no bloggers left, update submission status
      await supabase
        .from('experience_submissions')
        .update({
          bloggers_registered: false,
          status: 'pending',
        })
        .eq('id', id);
    }

    return NextResponse.json({
      message: 'Blogger deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/experience/[id]/bloggers/[bloggerId]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
