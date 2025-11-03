import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    const { data: transactions, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: '거래 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error('Error in GET /api/points/transactions:', error);
    return NextResponse.json(
      { error: '거래 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
