import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { KakaomapManagementTable } from './kakaomap-management-table';

async function getKakaomapSubmissions() {
  try {
    const supabase = await createClient();

    // Get all kakaomap review submissions
    const { data: submissions, error } = await supabase
      .from('kakaomap_review_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching kakaomap submissions:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
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
            .from('kakaomap_content_items')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id);

          // Unread messages count (from client)
          const { count: unreadCount } = await supabase
            .from('kakaomap_messages')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id)
            .eq('sender_type', 'client')
            .eq('is_read', false);

          // Pending revision requests count
          const { count: revisionCount } = await supabase
            .from('kakaomap_revision_requests')
            .select('*', { count: 'exact', head: true })
            .eq('submission_id', sub.id)
            .in('status', ['pending', 'in_progress']);

          return {
            ...sub,
            clients: clientMap.get(sub.client_id) || null,
            content_items_count: contentCount || 0,
            unread_messages_count: unreadCount || 0,
            pending_revision_count: revisionCount || 0,
          };
        })
      );

      return submissionsWithDetails;
    }

    return submissions || [];
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
}

export default async function KakaomapManagementPage() {
  await requireAuth(['admin']);
  const submissions = await getKakaomapSubmissions();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">카카오맵 관리</h1>
        <p className="text-muted-foreground">
          카카오맵 캠페인을 관리하고 콘텐츠를 업로드하세요
        </p>
      </div>

      <KakaomapManagementTable submissions={submissions} />
    </div>
  );
}
