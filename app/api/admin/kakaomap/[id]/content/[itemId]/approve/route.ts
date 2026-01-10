import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';

// POST: 콘텐츠 아이템 승인 및 배포
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const { id: submissionId, itemId } = await context.params;
    const supabase = await createClient();
    const serviceSupabase = createServiceClient(); // Service role for updates

    // 콘텐츠 아이템 존재 확인
    const { data: existingItem, error: fetchError } = await supabase
      .from('kakaomap_content_items')
      .select('*')
      .eq('id', itemId)
      .eq('submission_id', submissionId)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { error: '콘텐츠를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 승인된 콘텐츠인지 확인
    if (existingItem.review_status === 'approved') {
      return NextResponse.json(
        { error: '이미 승인된 콘텐츠입니다.' },
        { status: 400 }
      );
    }

    // Get submission info for notification
    const { data: submission } = await supabase
      .from('kakaomap_review_submissions')
      .select('client_id, company_name, total_count')
      .eq('id', submissionId)
      .single();

    // 승인 및 배포 (use service role to bypass RLS)
    const { data: updatedItem, error: updateError } = await serviceSupabase
      .from('kakaomap_content_items')
      .update({
        review_status: 'approved',
        is_published: true,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving content item:', updateError);
      return NextResponse.json(
        { error: '승인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 일별 기록 자동 생성
    const today = new Date().toISOString().split('T')[0];

    // 오늘 날짜의 기록 확인
    const { data: existingRecord } = await serviceSupabase
      .from('kakaomap_review_daily_records')
      .select('actual_count')
      .eq('submission_id', submissionId)
      .eq('date', today)
      .single();

    // 기록 업데이트 또는 생성
    const newCount = existingRecord ? existingRecord.actual_count + 1 : 1;

    await serviceSupabase
      .from('kakaomap_review_daily_records')
      .upsert({
        submission_id: submissionId,
        date: today,
        actual_count: newCount,
      }, {
        onConflict: 'submission_id,date'
      });

    // 클라이언트에게 콘텐츠 승인 알림 발송
    if (submission) {
      // 현재까지 승인된 콘텐츠 수 확인
      const { count: approvedCount } = await serviceSupabase
        .from('kakaomap_content_items')
        .select('*', { count: 'exact', head: true })
        .eq('submission_id', submissionId)
        .eq('review_status', 'approved');

      await serviceSupabase.from('notifications').insert({
        recipient_id: submission.client_id,
        recipient_role: 'client',
        type: 'kakaomap_content_approved',
        title: '카카오맵 콘텐츠 승인',
        message: `${submission.company_name} 카카오맵 리뷰 콘텐츠가 승인되었습니다. (${approvedCount}/${submission.total_count})`,
        data: {
          submission_id: submissionId,
          content_item_id: itemId,
          submission_type: 'kakaomap_review_submissions',
          approved_count: approvedCount,
          total_count: submission.total_count,
        },
        read: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 승인되어 유저에게 배포되었습니다.',
      content_item: updatedItem,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/kakaomap/[id]/content/[itemId]/approve:', error);
    return NextResponse.json(
      { error: '승인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
