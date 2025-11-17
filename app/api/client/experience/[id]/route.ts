import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET /api/client/experience/[id]
// Get detailed experience submission info with bloggers and rankings
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id } = await props.params;
    const supabase = await createClient();

    // Get submission
    const { data: submission, error: submissionError } = await supabase
      .from('experience_submissions')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Get all bloggers with their keyword rankings
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

    return NextResponse.json({
      submission,
      bloggers: bloggers || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/client/experience/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
