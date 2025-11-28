import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';

// 모든 충전 요청 조회
export async function GET(request: NextRequest) {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('point_charge_requests')
      .select(`
        *,
        clients (
          id,
          username,
          company_name,
          contact_person,
          phone,
          points
        ),
        admins:reviewed_by (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: chargeRequests, error } = await query;

    if (error) {
      console.error('Error fetching charge requests:', error);
      return NextResponse.json(
        { error: '충전 요청 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ chargeRequests: chargeRequests || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/charge-requests:', error);
    return NextResponse.json(
      { error: '충전 요청 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

