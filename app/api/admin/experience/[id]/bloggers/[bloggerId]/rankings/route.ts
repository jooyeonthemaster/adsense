import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/experience/[id]/bloggers/[bloggerId]/rankings
// Get keyword rankings for a specific blogger
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; bloggerId: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { bloggerId } = await props.params;

    const supabase = await createClient();

    const { data: rankings, error } = await supabase
      .from('experience_keyword_rankings')
      .select('*')
      .eq('blogger_id', bloggerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching keyword rankings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rankings });
  } catch (error: any) {
    console.error('Error in GET /api/admin/experience/[id]/bloggers/[bloggerId]/rankings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// POST /api/admin/experience/[id]/bloggers/[bloggerId]/rankings
// Add or update keyword rankings (Step 6)
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; bloggerId: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { bloggerId } = await props.params;
    const body = await request.json();
    const { rankings } = body;

    if (!Array.isArray(rankings) || rankings.length === 0) {
      return NextResponse.json(
        { error: 'rankings array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each ranking has required fields
    for (const ranking of rankings) {
      if (!ranking.keyword || typeof ranking.rank !== 'number' || ranking.rank < 1) {
        return NextResponse.json(
          { error: 'Each ranking must have keyword and rank (positive integer)' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Check if blogger is published
    const { data: blogger, error: bloggerError } = await supabase
      .from('experience_bloggers')
      .select('published')
      .eq('id', bloggerId)
      .single();

    if (bloggerError) {
      console.error('Error fetching blogger:', bloggerError);
      return NextResponse.json({ error: bloggerError.message }, { status: 500 });
    }

    if (!blogger?.published) {
      return NextResponse.json(
        { error: 'Cannot add rankings for unpublished content' },
        { status: 400 }
      );
    }

    // Delete existing rankings for this blogger (if updating)
    const { error: deleteError } = await supabase
      .from('experience_keyword_rankings')
      .delete()
      .eq('blogger_id', bloggerId);

    if (deleteError) {
      console.error('Error deleting old rankings:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Insert new rankings
    const rankingsToInsert = rankings.map((ranking: any) => ({
      blogger_id: bloggerId,
      keyword: ranking.keyword,
      rank: ranking.rank,
      checked_at: new Date().toISOString(),
    }));

    const { data: insertedRankings, error: insertError } = await supabase
      .from('experience_keyword_rankings')
      .insert(rankingsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting rankings:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Keyword rankings saved successfully',
      rankings: insertedRankings,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/experience/[id]/bloggers/[bloggerId]/rankings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
