import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';

// 충전 요청 승인
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth(['admin']);
    const supabase = await createClient();

    const { id } = await params;

    // 충전 요청 조회
    const { data: chargeRequest, error: fetchError } = await supabase
      .from('point_charge_requests')
      .select('*, clients(*)')
      .eq('id', id)
      .single();

    if (fetchError || !chargeRequest) {
      return NextResponse.json(
        { error: '충전 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 처리된 요청인지 확인
    if (chargeRequest.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 충전 요청입니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션 시작
    // 1. 충전 요청 상태 업데이트
    const { error: updateError } = await supabase
      .from('point_charge_requests')
      .update({
        status: 'approved',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating charge request:', updateError);
      return NextResponse.json(
        { error: '충전 요청 승인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 2. 포인트 충전
    const newBalance = chargeRequest.clients.points + chargeRequest.amount;

    const { error: pointsError } = await supabase
      .from('clients')
      .update({ points: newBalance })
      .eq('id', chargeRequest.client_id);

    if (pointsError) {
      console.error('Error updating points:', pointsError);
      // 롤백: 충전 요청 상태 되돌리기
      await supabase
        .from('point_charge_requests')
        .update({
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq('id', id);

      return NextResponse.json(
        { error: '포인트 충전 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 3. 포인트 거래 내역 생성
    const { error: transactionError } = await supabase
      .from('point_transactions')
      .insert({
        client_id: chargeRequest.client_id,
        transaction_type: 'charge',
        amount: chargeRequest.amount,
        balance_after: newBalance,
        reference_type: 'charge_request',
        reference_id: id,
        description: `충전 요청 승인: ${chargeRequest.description || ''}`,
        created_by: admin.id,
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // 트랜잭션 기록 실패는 경고만 하고 계속 진행
    }

    return NextResponse.json({
      message: '충전 요청이 승인되었습니다.',
      newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/charge-requests/[id]/approve:', error);
    return NextResponse.json(
      { error: '충전 요청 승인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

