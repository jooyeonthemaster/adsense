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
  reward: 'place_submissions', // 리워드는 place_submissions 사용
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;

    const body = await request.json();
    const { status, admin_response } = body;

    const supabase = createClient();

    // 1. AS 요청 정보 먼저 조회 (submission_type, submission_id, client_id 필요)
    const { data: asRequest, error: fetchError } = await supabase
      .from('as_requests')
      .select('*, clients(company_name)')
      .eq('id', id)
      .single();

    if (fetchError || !asRequest) {
      console.error('Error fetching AS request:', fetchError);
      return NextResponse.json(
        { error: 'AS 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. AS 요청 상태 업데이트
    const { data, error } = await supabase
      .from('as_requests')
      .update({
        status,
        admin_response,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating AS request:', error);
      return NextResponse.json(
        { error: 'AS 요청 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 3. 승인된 경우: 해당 submission 상태를 'as_in_progress'로 변경 + 알림 발송
    if (status === 'approved') {
      const tableName = SUBMISSION_TABLE_MAP[asRequest.submission_type];

      if (tableName && asRequest.submission_id) {
        // submission 상태 변경 (as_request_id 컬럼 없이 status만 변경)
        const { error: submissionError } = await supabase
          .from(tableName)
          .update({
            status: 'as_in_progress',
            updated_at: new Date().toISOString(),
          })
          .eq('id', asRequest.submission_id);

        if (submissionError) {
          console.error('Error updating submission status:', submissionError);
          console.error('Table:', tableName, 'Submission ID:', asRequest.submission_id);
          // submission 업데이트 실패해도 AS 요청은 승인된 상태로 유지
        } else {
          console.log('Successfully updated submission status to as_in_progress');
        }
      }

      // 클라이언트에게 알림 발송 (올바른 스키마 사용)
      const missingCount = asRequest.expected_count - asRequest.actual_count;
      const { error: notificationError } = await supabase.from('notifications').insert({
        recipient_id: asRequest.client_id,
        recipient_role: 'client',
        type: 'as_approved',
        title: 'AS 요청이 승인되었습니다',
        message: `AS 요청이 승인되어 재작업이 진행됩니다. (미달 수량: ${missingCount}건)`,
        data: {
          as_request_id: id,
          submission_type: asRequest.submission_type,
          submission_id: asRequest.submission_id,
        },
        read: false,
      });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      } else {
        console.log('Successfully created AS approval notification');
      }
    }

    // 4. 거절된 경우: 알림만 발송
    if (status === 'rejected') {
      const { error: notificationError } = await supabase.from('notifications').insert({
        recipient_id: asRequest.client_id,
        recipient_role: 'client',
        type: 'as_rejected',
        title: 'AS 요청이 거절되었습니다',
        message: admin_response || 'AS 요청이 거절되었습니다. 자세한 내용은 관리자에게 문의해주세요.',
        data: {
          as_request_id: id,
          submission_type: asRequest.submission_type,
          submission_id: asRequest.submission_id,
        },
        read: false,
      });

      if (notificationError) {
        console.error('Error creating rejection notification:', notificationError);
      }
    }

    return NextResponse.json({ success: true, asRequest: data });
  } catch (error) {
    console.error('Error in PATCH /api/as-requests/[id]:', error);
    return NextResponse.json(
      { error: 'AS 요청 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
