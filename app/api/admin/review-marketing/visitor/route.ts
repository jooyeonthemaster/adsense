import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    // Get all receipt review submissions
    const { data: submissions, error } = await supabase
      .from('receipt_review_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching visitor review submissions:', error);
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
          // Content items count
          const { count: contentCount } = await supabase
            .from('receipt_content_items')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id);

          // Unread messages count (from client)
          const { count: unreadCount } = await supabase
            .from('receipt_messages')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id)
            .eq('sender_type', 'client')
            .eq('is_read', false);

          // Pending revision requests count
          const { count: revisionCount } = await supabase
            .from('receipt_revision_requests')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id)
            .in('status', ['pending', 'in_progress']);

          // 진행률 계산: content_items 수 / total_count
          // submission에 저장된 progress_percentage 사용, 없으면 계산
          // 콘텐츠가 있으면 최소 1% 보장
          const rawProgress = sub.total_count > 0
            ? (contentCount || 0) / sub.total_count * 100
            : 0;
          const calculatedProgress = (contentCount || 0) > 0
            ? Math.max(1, Math.min(Math.round(rawProgress), 100))
            : 0;
          const progressPercentage = sub.progress_percentage ?? calculatedProgress;

          return {
            ...sub,
            clients: clientMap.get(sub.client_id) || null,
            content_items_count: contentCount || 0,
            unread_messages_count: unreadCount || 0,
            pending_revision_count: revisionCount || 0,
            actual_count_total: contentCount || 0, // 이제 content_items 수를 사용
            progress_percentage: progressPercentage,
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
