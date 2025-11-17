import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// 관리자용 카페 마케팅 목록 조회
export async function GET() {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    // 모든 카페 마케팅 제출 조회 (클라이언트 정보 포함)
    const { data: submissions, error } = await supabase
      .from('cafe_marketing_submissions')
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
      console.error('Error fetching cafe marketing submissions:', error);
      return NextResponse.json(
        { error: '제출 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Fetch daily records for all submissions to calculate progress
    const { data: allDailyRecords } = await supabase
      .from('cafe_marketing_daily_records')
      .select('submission_id, completed_count');

    // Create a map of submission_id to total completed count
    const completedCountMap = new Map<string, number>();
    if (allDailyRecords) {
      allDailyRecords.forEach((record: any) => {
        const currentCount = completedCountMap.get(record.submission_id) || 0;
        completedCountMap.set(record.submission_id, currentCount + record.completed_count);
      });
    }

    // Add progress to each submission
    const submissionsWithProgress = (submissions || []).map((sub: any) => {
      const completedCount = completedCountMap.get(sub.id) || 0;
      const progressPercentage = sub.total_count > 0
        ? Math.round((completedCount / sub.total_count) * 100)
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
    console.error('Error in GET /api/admin/cafe-marketing:', error);
    return NextResponse.json(
      { error: '제출 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
