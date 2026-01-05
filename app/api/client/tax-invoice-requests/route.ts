import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET: 내 세금계산서 발행 요청 목록 조회
export async function GET() {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tax_invoice_requests')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tax invoice requests:', error);
      return NextResponse.json(
        { error: '세금계산서 발행 요청 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requests: data || [],
    });
  } catch (error) {
    console.error('Error in GET /api/client/tax-invoice-requests:', error);
    return NextResponse.json(
      { error: '세금계산서 발행 요청을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 세금계산서 발행 요청 생성
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();
    const body = await request.json();

    const { transaction_id, amount } = body;

    if (!transaction_id || !amount) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 해당 거래가 현재 사용자의 충전 거래인지 확인
    const { data: transaction, error: transactionError } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('id', transaction_id)
      .eq('client_id', user.id)
      .eq('transaction_type', 'charge')
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: '유효하지 않은 거래입니다.' },
        { status: 400 }
      );
    }

    // 이미 세금계산서 발행 요청이 있는지 확인
    const { data: existingRequest } = await supabase
      .from('tax_invoice_requests')
      .select('id')
      .eq('transaction_id', transaction_id)
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 세금계산서 발행 요청이 존재합니다.' },
        { status: 400 }
      );
    }

    // 세금계산서 발행 요청 생성
    const { data, error } = await supabase
      .from('tax_invoice_requests')
      .insert({
        client_id: user.id,
        transaction_id,
        amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tax invoice request:', error);
      return NextResponse.json(
        { error: '세금계산서 발행 요청 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request: data,
      message: '세금계산서 발행 요청이 접수되었습니다.',
    });
  } catch (error) {
    console.error('Error in POST /api/client/tax-invoice-requests:', error);
    return NextResponse.json(
      { error: '세금계산서 발행 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
