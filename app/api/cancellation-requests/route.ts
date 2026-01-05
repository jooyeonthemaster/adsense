import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { calculateRefund, calculateProgressRate } from '@/lib/refund-calculator';
import { SubmissionType } from '@/types/cancellation-request';

// submission_type에 따른 테이블 이름 매핑
const SUBMISSION_TABLE_MAP: Record<string, string> = {
  place: 'place_submissions',
  receipt: 'receipt_review_submissions',
  kakaomap: 'kakaomap_review_submissions',
  blog: 'blog_distribution_submissions',
  cafe: 'cafe_marketing_submissions',
};

/**
 * POST: 중단 요청 생성
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const body = await request.json();
    const { submission_type, submission_id, reason } = body;

    // Validation
    if (!submission_type || !submission_id) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const tableName = SUBMISSION_TABLE_MAP[submission_type];
    if (!tableName) {
      return NextResponse.json(
        { error: '지원되지 않는 상품 유형입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 해당 submission 조회
    const { data: submission, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', submission_id)
      .eq('client_id', user.id)
      .single();

    if (fetchError || !submission) {
      console.error('Error fetching submission:', fetchError);
      return NextResponse.json(
        { error: '접수 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. 중복 요청 체크
    const { data: existingRequest } = await supabase
      .from('cancellation_requests')
      .select('id, status')
      .eq('submission_id', submission_id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 처리 대기 중인 중단 요청이 있습니다.' },
        { status: 400 }
      );
    }

    // 3. 진행 상황 계산
    let totalCount = 0;
    let completedCount = 0;

    // 상품 유형별 진행 상황 계산
    if (submission_type === 'blog' || submission_type === 'cafe') {
      // content_items 조회
      const contentTable = submission_type === 'blog'
        ? 'blog_content_items'
        : 'cafe_content_items';

      const { data: contentItems } = await supabase
        .from(contentTable)
        .select('id, status')
        .eq('submission_id', submission_id);

      totalCount = submission.total_count || (submission.daily_count * submission.total_days) || 0;
      completedCount = contentItems?.filter((item: any) =>
        item.status === 'approved' || item.status === 'completed'
      ).length || 0;
    } else if (submission_type === 'kakaomap' || submission_type === 'receipt') {
      // review content items 조회
      const contentTable = submission_type === 'kakaomap'
        ? 'kakaomap_content_items'
        : 'receipt_content_items';

      const { data: contentItems } = await supabase
        .from(contentTable)
        .select('id, review_status')
        .eq('submission_id', submission_id);

      totalCount = submission.total_count || (submission.daily_count * submission.total_days) || 0;
      completedCount = contentItems?.filter((item: any) =>
        item.review_status === 'approved' || item.review_status === 'completed'
      ).length || 0;
    } else if (submission_type === 'place') {
      // 플레이스 유입 (일별 진행)
      totalCount = submission.daily_count * submission.total_days;
      completedCount = (submission.current_day || 0) * submission.daily_count;
    }

    // 4. 진행률 및 환불 금액 계산
    const progressRate = calculateProgressRate(completedCount, totalCount);
    const totalPoints = submission.total_points || 0;

    const refundResult = calculateRefund({
      totalPoints,
      progressRate,
      submissionType: submission_type as SubmissionType,
    });

    // 5. 중단 요청 생성
    const { data: cancellationRequest, error: createError } = await supabase
      .from('cancellation_requests')
      .insert({
        client_id: user.id,
        submission_type,
        submission_id,
        reason: reason || null,
        total_count: totalCount,
        completed_count: completedCount,
        progress_rate: progressRate,
        total_points: totalPoints,
        calculated_refund: refundResult.calculatedRefund,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating cancellation request:', createError);
      return NextResponse.json(
        { error: '중단 요청 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 6. submission 상태를 'cancellation_requested'로 변경
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        status: 'cancellation_requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission_id);

    if (updateError) {
      console.error('Error updating submission status:', updateError);
      // 요청은 생성되었으므로 에러 무시
    }

    return NextResponse.json({
      success: true,
      cancellationRequest,
      refundDetails: refundResult,
    });
  } catch (error) {
    console.error('Error in POST /api/cancellation-requests:', error);
    return NextResponse.json(
      { error: '중단 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET: 중단 요청 목록 조회
 * - 클라이언트: 자신의 요청만 조회
 * - 관리자: 전체 요청 조회
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'client']);
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('cancellation_requests')
      .select('*, clients(company_name)')
      .order('created_at', { ascending: false });

    // 클라이언트는 자신의 요청만 조회
    if (user.type === 'client') {
      query = query.eq('client_id', user.id);
    }

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cancellation requests:', error);
      return NextResponse.json(
        { error: '중단 요청 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 각 요청에 대해 submission의 업체명 가져오기
    const requestsWithBusinessName = await Promise.all(
      (data || []).map(async (request) => {
        let businessName = null;

        try {
          const tableName = SUBMISSION_TABLE_MAP[request.submission_type];
          if (tableName) {
            const { data: submission } = await supabase
              .from(tableName)
              .select('company_name, submission_number')
              .eq('id', request.submission_id)
              .single();

            if (submission) {
              businessName = submission.company_name;
            }
          }
        } catch (e) {
          console.error('업체명 조회 실패:', e);
        }

        return {
          ...request,
          business_name: businessName,
        };
      })
    );

    // 통계 계산
    const stats = {
      total: requestsWithBusinessName.length,
      pending: requestsWithBusinessName.filter(r => r.status === 'pending').length,
      approved: requestsWithBusinessName.filter(r => r.status === 'approved').length,
      rejected: requestsWithBusinessName.filter(r => r.status === 'rejected').length,
      total_refunded: requestsWithBusinessName
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.final_refund || 0), 0),
    };

    return NextResponse.json({
      cancellationRequests: requestsWithBusinessName,
      stats,
    });
  } catch (error) {
    console.error('Error in GET /api/cancellation-requests:', error);
    return NextResponse.json(
      { error: '중단 요청 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
