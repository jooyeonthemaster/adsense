import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const supabase = await createClient();

    const { data: transactions, error } = await supabase
      .from('point_transactions')
      .select(`
        *,
        clients (
          company_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: '포인트 거래 내역을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/points/transactions:', error);
    return NextResponse.json(
      { error: '포인트 거래 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
