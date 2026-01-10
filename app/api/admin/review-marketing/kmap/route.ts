import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    // Get all kakaomap review submissions
    const { data: submissions, error } = await supabase
      .from('kakaomap_review_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching kakaomap submissions:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ submissions: [] }, { status: 200 });
    }

    if (submissions && submissions.length > 0) {
      // Get client information
      const clientIds = [...new Set(submissions.map(s => s.client_id))];
      const { data: clients } = await supabase
        .from('clients')
        .select('id, company_name, contact_person, email, phone')
        .in('id', clientIds);

      const clientMap = new Map(clients?.map(c => [c.id, c]) || []);

      // Get content items count and unread messages count for each submission
      const submissionsWithDetails = await Promise.all(
        submissions.map(async (sub) => {
          // Content items count (전체)
          const { count: contentCount } = await supabase
            .from('kakaomap_content_items')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id);

          // Completed count (리포트에 등록된 것만 = review_registered_date가 있는 것)
          const { count: completedCount } = await supabase
            .from('kakaomap_content_items')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id)
            .not('review_registered_date', 'is', null);

          // Unread messages count (from client) - kakaomap_messages 테이블
          const { count: unreadMsgCount } = await supabase
            .from('kakaomap_messages')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id)
            .eq('sender_type', 'client')
            .eq('is_read', false);

          // Unread feedbacks count (from client) - kakaomap_content_item_feedbacks 테이블
          const { count: unreadFeedbackCount } = await supabase
            .from('kakaomap_content_item_feedbacks')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id)
            .eq('sender_type', 'client')
            .eq('is_read', false);

          // 총 미읽 수 = 메시지 + 피드백
          const unreadCount = (unreadMsgCount || 0) + (unreadFeedbackCount || 0);

          // Pending revision requests count
          const { count: revisionCount } = await supabase
            .from('kakaomap_revision_requests')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id)
            .in('status', ['pending', 'in_progress']);

          // Daily records - actual count total (실제 유입 합계)
          const { data: dailyRecords } = await supabase
            .from('kakaomap_review_daily_records')
            .select('actual_count')
            .eq('submission_id', sub.id);

          const actualCountTotal = dailyRecords?.reduce(
            (sum, record) => sum + (record.actual_count || 0),
            0
          ) || 0;

          return {
            ...sub,
            clients: clientMap.get(sub.client_id) || null,
            content_items_count: contentCount || 0,
            completed_count: completedCount || 0,  // 리포트에 등록된 콘텐츠 수
            unread_messages_count: unreadCount || 0,
            pending_revision_count: revisionCount || 0,
            actual_count_total: actualCountTotal,
          };
        })
      );

      return NextResponse.json({ submissions: submissionsWithDetails }, { status: 200 });
    }

    return NextResponse.json({ submissions: submissions || [] }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ submissions: [] }, { status: 200 });
  }
}
