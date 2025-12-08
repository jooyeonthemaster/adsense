import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// 관리자용 블로그 배포 목록 조회
export async function GET() {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    // 모든 블로그 배포 제출 조회 (클라이언트 정보 포함)
    const { data: submissions, error } = await supabase
      .from('blog_distribution_submissions')
      .select(`
        *,
        clients:client_id (
          id,
          username,
          company_name,
          points
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog distribution submissions:', error);
      return NextResponse.json(
        { error: '제출 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Fetch content items for all submissions to calculate progress (콘텐츠 아이템 기반)
    const { data: allContentItems } = await supabase
      .from('blog_content_items')
      .select('submission_id');

    // Create a map of submission_id to content item count
    const completedCountMap = new Map<string, number>();
    if (allContentItems) {
      allContentItems.forEach((item: { submission_id: string }) => {
        const currentCount = completedCountMap.get(item.submission_id) || 0;
        completedCountMap.set(item.submission_id, currentCount + 1);
      });
    }

    // Add progress to each submission
    const submissionsWithProgress = (submissions || []).map((sub: any) => {
      const completedCount = completedCountMap.get(sub.id) || 0;
      // 콘텐츠가 있으면 최소 1% 보장 (0.5% 같은 경우도 1%로 표시)
      const rawPercentage = sub.total_count > 0
        ? (completedCount / sub.total_count) * 100
        : 0;
      const progressPercentage = completedCount > 0
        ? Math.max(1, Math.min(Math.round(rawPercentage), 100))
        : 0;

      return {
        ...sub,
        completed_count: completedCount,
        progress_percentage: progressPercentage,
      };
    });

    return NextResponse.json({
      success: true,
      submissions: submissionsWithProgress,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/blog-distribution:', error);
    return NextResponse.json(
      { error: '제출 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
