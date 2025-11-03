import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { calculateDashboardStats } from '@/lib/analytics';

/**
 * GET /api/analytics/dashboard
 * 전체 대시보드 통계 조회
 */
export async function GET() {
  try {
    await requireAuth(['admin']);

    const stats = await calculateDashboardStats();

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in GET /api/analytics/dashboard:', error);
    return NextResponse.json(
      { error: '대시보드 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
