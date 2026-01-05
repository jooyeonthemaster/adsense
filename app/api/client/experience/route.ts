import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireOnboardedClient } from '@/lib/auth';

// GET /api/client/experience
// Get all experience submissions for the logged-in client
export async function GET() {
  try {
    const user = await requireOnboardedClient();
    const supabase = await createClient();

    // Get all experience submissions for this client
    const { data: submissions, error } = await supabase
      .from('experience_submissions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching experience submissions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submissions: submissions || [] });
  } catch (error: any) {
    console.error('Error in GET /api/client/experience:', error);

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
