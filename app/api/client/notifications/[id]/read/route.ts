import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { requireOnboardedClient } from '@/lib/auth';

// POST: 알림 읽음 처리
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOnboardedClient();
    const supabase = await createClient();

    const { id: notificationId } = await params;

    // 알림 읽음 처리
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('recipient_role', 'client')
      .or(`recipient_id.eq.${user.id},recipient_id.is.null`);

    if (error) {
      console.error('알림 읽음 처리 오류:', error);
      return NextResponse.json({ error: '알림 읽음 처리에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ message: '알림을 읽음 처리했습니다' });
  } catch (error: any) {
    console.error('서버 오류:', error);

    if (error.message === 'OnboardingRequired') {
      return NextResponse.json(
        {
          error: '온보딩을 완료해야 서비스를 이용할 수 있습니다.',
          redirect: '/onboarding'
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

