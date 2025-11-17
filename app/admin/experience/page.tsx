import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { ExperienceManagementTable } from './experience-management-table';

async function getExperienceSubmissions() {
  try {
    const supabase = await createClient();

    // 먼저 체험단 제출 데이터 가져오기
    const { data: submissions, error } = await supabase
      .from('experience_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching experience submissions:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
    }

    // 각 제출에 대한 거래처 정보를 별도로 가져오기
    if (submissions && submissions.length > 0) {
      const clientIds = [...new Set(submissions.map(s => s.client_id))];
      const { data: clients } = await supabase
        .from('clients')
        .select('id, company_name, contact_person, email')
        .in('id', clientIds);

      // 거래처 정보를 매핑
      const clientMap = new Map(clients?.map(c => [c.id, c]) || []);

      return submissions.map(sub => ({
        ...sub,
        clients: clientMap.get(sub.client_id) || null
      }));
    }

    return submissions || [];
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
}

export default async function ExperienceManagementPage() {
  await requireAuth(['admin']);
  const submissions = await getExperienceSubmissions();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">체험단 마케팅 관리</h1>
        <p className="text-muted-foreground">
          블로거/인플루언서 체험단 캠페인을 관리하세요
        </p>
      </div>

      <ExperienceManagementTable submissions={submissions} />
    </div>
  );
}
