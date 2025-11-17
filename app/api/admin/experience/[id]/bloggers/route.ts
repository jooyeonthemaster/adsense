import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/experience/[id]/bloggers
// Get all bloggers for an experience submission
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await props.params;

    const supabase = await createClient();

    const { data: bloggers, error } = await supabase
      .from('experience_bloggers')
      .select(`
        *,
        keyword_rankings:experience_keyword_rankings(*)
      `)
      .eq('submission_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching bloggers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bloggers });
  } catch (error: any) {
    console.error('Error in GET /api/admin/experience/[id]/bloggers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// POST /api/admin/experience/[id]/bloggers
// Admin registers blogger list (Step 1)
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await props.params;
    const body = await request.json();
    const { bloggers } = body;

    if (!Array.isArray(bloggers) || bloggers.length === 0) {
      return NextResponse.json(
        { error: 'Bloggers array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each blogger has required fields
    for (const blogger of bloggers) {
      if (!blogger.name || !blogger.blog_url || typeof blogger.index_score !== 'number') {
        return NextResponse.json(
          { error: 'Each blogger must have name, blog_url, and index_score' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Insert all bloggers
    const bloggersToInsert = bloggers.map((blogger: any) => ({
      submission_id: id,
      name: blogger.name,
      blog_url: blogger.blog_url,
      index_score: blogger.index_score,
    }));

    const { data: insertedBloggers, error: insertError } = await supabase
      .from('experience_bloggers')
      .insert(bloggersToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting bloggers:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('experience_submissions')
      .update({
        bloggers_registered: true,
        status: 'in_progress',
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
    }

    return NextResponse.json({
      message: 'Bloggers registered successfully',
      bloggers: insertedBloggers,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/experience/[id]/bloggers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
