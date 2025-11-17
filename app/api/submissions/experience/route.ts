import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET /api/submissions/experience
// Get all experience submissions for current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'date';

    const supabase = await createClient();

    let query = supabase
      .from('experience_submissions')
      .select(`
        *,
        bloggers:experience_bloggers(*)
      `);

    // Filter by client_id for non-admin users
    if (user.type === 'client') {
      query = query.eq('client_id', user.id);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // Apply type filter
    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('experience_type', typeFilter);
    }

    // Apply sorting
    if (sortBy === 'cost') {
      query = query.order('total_points', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Error fetching experience submissions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match frontend interface
    const transformedSubmissions = submissions?.map((sub: any) => ({
      id: sub.id,
      company_name: sub.company_name,
      form_data: {
        place_url: sub.place_url,
        experience_type: sub.experience_type,
        team_count: sub.team_count,
        keywords: sub.keywords,
        guide_text: sub.guide_text,
        bloggers: sub.bloggers?.map((b: any) => ({
          id: b.id,
          name: b.name,
          blog_url: b.blog_url,
          index_score: b.index_score,
          selected: b.selected_by_client,
          visit_date: b.visit_date,
          published: b.published,
          published_url: b.published_url,
        })),
        visit_schedule: sub.schedule_confirmed
          ? `${sub.bloggers?.[0]?.visit_date || ''}`
          : null,
      },
      total_points: sub.total_points,
      status: sub.status,
      created_at: sub.created_at,
    }));

    return NextResponse.json({
      submissions: transformedSubmissions || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/submissions/experience:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
