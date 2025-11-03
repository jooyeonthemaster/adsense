import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// Maximum safe integer for JavaScript (Number.MAX_SAFE_INTEGER)
// PostgreSQL BIGINT can handle much larger, but JS has limits
const MAX_SAFE_POINTS = Number.MAX_SAFE_INTEGER; // 9,007,199,254,740,991
const MAX_TRANSACTION_AMOUNT = 1_000_000_000_000; // 1조 (실용적 한도)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth(['admin']);
    const { id } = await params;

    const body = await request.json();
    const { type, amount, description } = body;

    // 기본 검증
    if (!type || !amount || amount <= 0) {
      return NextResponse.json(
        { error: '올바른 요청 데이터를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (type !== 'charge' && type !== 'deduct') {
      return NextResponse.json(
        { error: '올바른 거래 유형이 아닙니다.' },
        { status: 400 }
      );
    }

    // 금액 범위 검증
    if (amount > MAX_TRANSACTION_AMOUNT) {
      return NextResponse.json(
        {
          error: `1회 거래 한도(${MAX_TRANSACTION_AMOUNT.toLocaleString('ko-KR')} P)를 초과했습니다.`,
          max_allowed: MAX_TRANSACTION_AMOUNT
        },
        { status: 400 }
      );
    }

    // JavaScript 안전 범위 검증
    if (!Number.isSafeInteger(amount)) {
      return NextResponse.json(
        { error: '입력한 포인트가 너무 큽니다. JavaScript에서 안전하게 처리할 수 없는 범위입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('points')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: '거래처를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    let newBalance: number;
    if (type === 'charge') {
      newBalance = client.points + amount;

      // 충전 후 잔액 검증
      if (newBalance > MAX_SAFE_POINTS) {
        return NextResponse.json(
          {
            error: `충전 후 잔액(${newBalance.toLocaleString('ko-KR')} P)이 최대 한도를 초과합니다. 현재 포인트: ${client.points.toLocaleString('ko-KR')} P`,
            current_points: client.points,
            requested_amount: amount,
            max_allowed_balance: MAX_SAFE_POINTS
          },
          { status: 400 }
        );
      }

      if (!Number.isSafeInteger(newBalance)) {
        return NextResponse.json(
          { error: '충전 후 잔액이 JavaScript에서 안전하게 처리할 수 없는 범위를 초과합니다.' },
          { status: 400 }
        );
      }
    } else {
      // deduct
      if (client.points < amount) {
        return NextResponse.json(
          { error: '차감할 포인트가 보유 포인트보다 많습니다.' },
          { status: 400 }
        );
      }
      newBalance = client.points - amount;
    }

    // Update client points
    const { error: updateError } = await supabase
      .from('clients')
      .update({ points: newBalance })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating points:', updateError);
      return NextResponse.json(
        { error: '포인트 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('point_transactions')
      .insert({
        client_id: id,
        transaction_type: type,
        amount: type === 'charge' ? amount : -amount,
        balance_after: newBalance,
        description: description || (type === 'charge' ? '포인트 충전' : '포인트 차감'),
        created_by: admin.id,
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Don't fail the request if transaction record fails
    }

    return NextResponse.json({
      success: true,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/clients/[id]/points:', error);
    return NextResponse.json(
      { error: '포인트 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
