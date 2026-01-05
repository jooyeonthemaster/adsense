import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';

// submission_type에 따른 테이블 이름 매핑
const SUBMISSION_TABLE_MAP: Record<string, string> = {
  place: 'place_submissions',
  receipt: 'receipt_review_submissions',
  kakaomap: 'kakaomap_review_submissions',
  blog: 'blog_distribution_submissions',
  cafe: 'cafe_marketing_submissions',
};

/**
 * PATCH: 중단 요청 처리 (관리자 전용)
 * - 승인: 환불 처리 + submission 상태 변경
 * - 거절: submission 상태 원복
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth(['admin']);
    const { id } = await params;

    const body = await request.json();
    const { status, final_refund, admin_response } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효한 상태값을 입력해주세요. (approved/rejected)' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. 중단 요청 정보 조회
    const { data: cancellationRequest, error: fetchError } = await supabase
      .from('cancellation_requests')
      .select('*, clients(company_name, points)')
      .eq('id', id)
      .single();

    if (fetchError || !cancellationRequest) {
      console.error('Error fetching cancellation request:', fetchError);
      return NextResponse.json(
        { error: '중단 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (cancellationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 요청입니다.' },
        { status: 400 }
      );
    }

    const tableName = SUBMISSION_TABLE_MAP[cancellationRequest.submission_type];

    // 2. 승인인 경우: 환불 처리
    if (status === 'approved') {
      const refundAmount = final_refund ?? cancellationRequest.calculated_refund;

      if (refundAmount < 0) {
        return NextResponse.json(
          { error: '환불 금액은 0 이상이어야 합니다.' },
          { status: 400 }
        );
      }

      // 2-1. 중단 요청 상태 업데이트
      const { data: updatedRequest, error: updateError } = await supabase
        .from('cancellation_requests')
        .update({
          status: 'approved',
          final_refund: refundAmount,
          admin_response: admin_response || null,
          processed_by: admin.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating cancellation request:', updateError);
        return NextResponse.json(
          { error: '중단 요청 업데이트 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // 2-2. submission 상태를 'cancelled'로 변경
      if (tableName) {
        const { error: submissionError } = await supabase
          .from(tableName)
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', cancellationRequest.submission_id);

        if (submissionError) {
          console.error('Error updating submission status:', submissionError);
        }
      }

      // 2-3. 포인트 환불 처리
      if (refundAmount > 0) {
        // 클라이언트 포인트 업데이트
        const currentPoints = cancellationRequest.clients?.points || 0;
        const newPoints = currentPoints + refundAmount;

        const { error: pointsError } = await supabase
          .from('clients')
          .update({
            points: newPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cancellationRequest.client_id);

        if (pointsError) {
          console.error('Error updating client points:', pointsError);
          return NextResponse.json(
            { error: '포인트 환불 처리 중 오류가 발생했습니다.' },
            { status: 500 }
          );
        }

        // 포인트 거래 내역 기록
        const { error: transactionError } = await supabase
          .from('point_transactions')
          .insert({
            client_id: cancellationRequest.client_id,
            transaction_type: 'refund',
            amount: refundAmount,
            balance_after: newPoints,
            description: `중단 환불 - ${cancellationRequest.submission_type}`,
            reference_type: 'cancellation_request',
            reference_id: id,
          });

        if (transactionError) {
          console.error('Error creating point transaction:', transactionError);
          // 이미 포인트 업데이트됐으므로 로그만 남김
        }
      }

      console.log(`Cancellation request ${id} approved. Refund: ${refundAmount}P`);

      return NextResponse.json({
        success: true,
        cancellationRequest: updatedRequest,
        refund_amount: refundAmount,
      });
    }

    // 3. 거절인 경우: 상태 원복
    if (status === 'rejected') {
      // 3-1. 중단 요청 상태 업데이트
      const { data: updatedRequest, error: updateError } = await supabase
        .from('cancellation_requests')
        .update({
          status: 'rejected',
          admin_response: admin_response || '중단 요청이 거절되었습니다.',
          processed_by: admin.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating cancellation request:', updateError);
        return NextResponse.json(
          { error: '중단 요청 업데이트 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // 3-2. submission 상태를 이전 상태로 원복 (in_progress로)
      if (tableName) {
        const { error: submissionError } = await supabase
          .from(tableName)
          .update({
            status: 'in_progress',
            updated_at: new Date().toISOString(),
          })
          .eq('id', cancellationRequest.submission_id);

        if (submissionError) {
          console.error('Error reverting submission status:', submissionError);
        }
      }

      console.log(`Cancellation request ${id} rejected`);

      return NextResponse.json({
        success: true,
        cancellationRequest: updatedRequest,
      });
    }

    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/cancellation-requests/[id]:', error);
    return NextResponse.json(
      { error: '중단 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET: 단일 중단 요청 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin', 'client']);
    const { id } = await params;

    const supabase = createClient();

    const { data, error } = await supabase
      .from('cancellation_requests')
      .select('*, clients(company_name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: '중단 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업체명 조회
    const tableName = SUBMISSION_TABLE_MAP[data.submission_type];
    let businessName = null;

    if (tableName) {
      const { data: submission } = await supabase
        .from(tableName)
        .select('company_name, submission_number')
        .eq('id', data.submission_id)
        .single();

      if (submission) {
        businessName = submission.company_name;
      }
    }

    return NextResponse.json({
      cancellationRequest: {
        ...data,
        business_name: businessName,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/cancellation-requests/[id]:', error);
    return NextResponse.json(
      { error: '중단 요청 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
