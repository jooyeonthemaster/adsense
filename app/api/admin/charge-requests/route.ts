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
    const clientId = searchParams.get('client_id');

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

    // 거래처 필터
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: chargeRequests, error } = await query;

    if (error) {
      console.error('Error fetching charge requests:', error);
      return NextResponse.json(
        { error: '충전 요청 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 통계 계산 (전체 데이터 기준 - 필터와 무관하게)
    const { data: allRequests } = await supabase
      .from('point_charge_requests')
      .select('status, amount');

    const stats = {
      totalApproved: 0,
      totalPending: 0,
      totalRejected: 0,
      totalAll: 0,
    };

    if (allRequests) {
      allRequests.forEach((req) => {
        stats.totalAll += req.amount || 0;
        if (req.status === 'approved') {
          stats.totalApproved += req.amount || 0;
        } else if (req.status === 'pending') {
          stats.totalPending += req.amount || 0;
        } else if (req.status === 'rejected') {
          stats.totalRejected += req.amount || 0;
        }
      });
    }

    // 거래처 목록 (필터용)
    const { data: clients } = await supabase
      .from('clients')
      .select('id, username, company_name')
      .order('company_name');

    return NextResponse.json({
      chargeRequests: chargeRequests || [],
      stats,
      clients: clients || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/charge-requests:', error);
    return NextResponse.json(
      { error: '충전 요청 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

