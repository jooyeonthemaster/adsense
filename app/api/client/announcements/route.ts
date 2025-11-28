import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET: 거래처용 공지사항 조회
export async function GET() {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    // 활성 공지사항 조회 (전체 또는 거래처 대상)
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('id, title, content, priority, created_at, expires_at')
      .eq('is_active', true)
      .in('target_audience', ['all', 'client'])
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order('priority', { ascending: false }) // urgent > high > normal > low
      .order('created_at', { ascending: false });

    if (error) {
      console.error('공지사항 조회 오류:', error);
      return NextResponse.json({ error: '공지사항을 불러오는데 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(announcements || []);
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

