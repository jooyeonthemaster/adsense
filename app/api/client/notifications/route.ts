import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET: 거래처 알림 조회
export async function GET(request: Request) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // 알림 조회 쿼리
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_role', 'client')
      .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 읽지 않은 알림만 조회
    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('알림 조회 오류:', error);
      return NextResponse.json({ error: '알림을 불러오는데 실패했습니다' }, { status: 500 });
    }

    // 읽지 않은 알림 수 조회
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_role', 'client')
      .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
      .eq('read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

