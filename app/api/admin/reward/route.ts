import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// 관리자용 리워드(플레이스 유입) 목록 조회
export async function GET() {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    // 모든 리워드 제출 조회 (클라이언트 정보 포함)
    const { data: submissions, error } = await supabase
      .from('place_submissions')
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
      console.error('Error fetching place submissions:', error);
      return NextResponse.json(
        { error: '제출 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Fetch daily records for all submissions to calculate progress
    const { data: allDailyRecords } = await supabase
      .from('place_submissions_daily_records')
      .select('submission_id, actual_count, date');

    // Create a map of submission_id to progress info
    const progressMap = new Map<string, { completed: number; currentDay: number }>();
    if (allDailyRecords) {
      allDailyRecords.forEach((record: any) => {
        const current = progressMap.get(record.submission_id) || { completed: 0, currentDay: 0 };
        progressMap.set(record.submission_id, {
          completed: current.completed + record.actual_count,
          currentDay: current.currentDay + 1,
        });
      });
    }

    // Add progress to each submission
    const submissionsWithProgress = (submissions || []).map((sub: any) => {
      const progress = progressMap.get(sub.id) || { completed: 0, currentDay: 0 };
      const totalExpected = sub.daily_count * sub.total_days;
      const progressPercentage = totalExpected > 0
        ? Math.round((progress.completed / totalExpected) * 100)
        : 0;

      return {
        ...sub,
        completed_count: progress.completed,
        current_day: progress.currentDay,
        progress_percentage: progressPercentage,
      };
    });

    return NextResponse.json({
      success: true,
      submissions: submissionsWithProgress,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/reward:', error);
    return NextResponse.json(
      { error: '제출 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
