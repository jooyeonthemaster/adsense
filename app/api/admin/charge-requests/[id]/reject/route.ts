import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';

// 충전 요청 거부
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth(['admin']);
    const supabase = await createClient();

    const { id } = await params;
    const body = await request.json();
    const { rejectionReason } = body;

    // 충전 요청 조회
    const { data: chargeRequest, error: fetchError } = await supabase
      .from('point_charge_requests')
      .select('*')
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

    // 충전 요청 상태 업데이트
    const { error: updateError } = await supabase
      .from('point_charge_requests')
      .update({
        status: 'rejected',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason || null,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating charge request:', updateError);
      return NextResponse.json(
        { error: '충전 요청 거부 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '충전 요청이 거부되었습니다.',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/charge-requests/[id]/reject:', error);
    return NextResponse.json(
      { error: '충전 요청 거부 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

