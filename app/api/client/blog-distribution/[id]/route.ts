import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireOnboardedClient } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOnboardedClient();
    const { id } = await params;
    const supabase = await createClient();

    // Client can only view their own submissions
    const { data: submission, error } = await supabase
      .from('blog_distribution_submissions')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
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

    // Calculate total days (외부계정 충전 요청은 daily_count가 0이므로 방어 로직 필요)
    const total_days = submission.daily_count > 0
      ? Math.ceil(submission.total_count / submission.daily_count)
      : 0;

    // Fetch daily records
    const { data: dailyRecords } = await supabase
      .from('blog_distribution_daily_records')
      .select('*')
      .eq('submission_id', id)
      .order('record_date', { ascending: false });

    // Calculate progress
    const totalCompletedCount = (dailyRecords || []).reduce(
      (sum: number, record: any) => sum + record.completed_count,
      0
    );
    const completionRate = Math.round((totalCompletedCount / submission.total_count) * 100);

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        total_days,
      },
      dailyRecords: dailyRecords || [],
      progress: {
        totalCompletedCount,
        completionRate,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/client/blog-distribution/[id]:', error);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
