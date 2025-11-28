import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';

// 클라이언트의 충전 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    const { data: chargeRequests, error } = await supabase
      .from('point_charge_requests')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching charge requests:', error);
      return NextResponse.json(
        { error: '충전 요청 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ chargeRequests: chargeRequests || [] });
  } catch (error) {
    console.error('Error in GET /api/client/charge-requests:', error);
    return NextResponse.json(
      { error: '충전 요청 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 충전 요청 생성
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    const body = await request.json();
    const { amount, description } = body;

    // 유효성 검사
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: '충전 금액을 올바르게 입력해주세요.' },
        { status: 400 }
      );
    }

    // 충전 요청 생성
    const { data: chargeRequest, error: insertError } = await supabase
      .from('point_charge_requests')
      .insert({
        client_id: user.id,
        amount,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating charge request:', insertError);
      return NextResponse.json(
        { error: '충전 요청 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      chargeRequest,
      message: '충전 요청이 성공적으로 생성되었습니다.' 
    });
  } catch (error) {
    console.error('Error in POST /api/client/charge-requests:', error);
    return NextResponse.json(
      { error: '충전 요청 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

