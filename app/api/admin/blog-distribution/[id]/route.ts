import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const supabase = await createClient();

    const { data: submission, error } = await supabase
      .from('blog_distribution_submissions')
      .select(`
        *,
        clients (
          company_name,
          contact_person,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching submission:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submission' },
        { status: 500 }
      );
    }

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Calculate total days (total_count / daily_count)
    const total_days = Math.ceil(submission.total_count / submission.daily_count);

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        total_days,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/blog-distribution/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
