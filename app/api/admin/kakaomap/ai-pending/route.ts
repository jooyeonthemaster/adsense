import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    // AI 원고 타입이고 script_type = 'ai'인 접수건만 조회
    const { data: submissions, error } = await supabase
      .from('kakaomap_review_submissions')
      .select('*')
      .eq('script_type', 'ai')
      .not('status', 'in', '("completed","cancelled")')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI pending submissions:', error);
      return NextResponse.json(
        { error: '접수 내역 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({
        success: true,
        submissions: [],
        stats: {
          totalSubmissions: 0,
          totalRemaining: 0,
          inProgress: 0,
          byClient: {},
        },
      });
    }

    // 클라이언트 정보 조회
    const clientIds = [...new Set(submissions.map((s) => s.client_id))];
    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name, contact_person')
      .in('id', clientIds);

    const clientMap = new Map(clients?.map((c) => [c.id, c]) || []);

    // 각 접수건별 콘텐츠 수 조회
    const submissionsWithCounts = await Promise.all(
      submissions.map(async (sub) => {
        const { count: contentCount } = await supabase
          .from('kakaomap_content_items')
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', sub.id);

        const client = clientMap.get(sub.client_id);
        const remainingCount = sub.total_count - (contentCount || 0);

        return {
          id: sub.id,
          submission_number: sub.submission_number,
          company_name: sub.company_name,
          client_name: client?.company_name || '알 수 없음',
          client_id: sub.client_id,
          total_count: sub.total_count,
          content_items_count: contentCount || 0,
          remaining_count: remainingCount,
          created_at: sub.created_at,
          status: sub.status,
          has_photo: sub.has_photo,
          photo_ratio: sub.photo_ratio || 0,
          star_rating: sub.star_rating,
        };
      })
    );

    // 남은 수량이 있는 것만 필터링
    const pendingSubmissions = submissionsWithCounts.filter(
      (sub) => sub.remaining_count > 0
    );

    // 통계 계산
    const byClient: Record<string, { count: number; remaining: number }> = {};
    let totalRemaining = 0;

    pendingSubmissions.forEach((sub) => {
      totalRemaining += sub.remaining_count;

      if (!byClient[sub.client_name]) {
        byClient[sub.client_name] = { count: 0, remaining: 0 };
      }
      byClient[sub.client_name].count += 1;
      byClient[sub.client_name].remaining += sub.remaining_count;
    });

    return NextResponse.json({
      success: true,
      submissions: pendingSubmissions,
      stats: {
        totalSubmissions: pendingSubmissions.length,
        totalRemaining,
        inProgress: 0, // 클라이언트에서 계산
        byClient,
      },
    });
  } catch (error) {
    console.error('Unexpected error in ai-pending API:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
