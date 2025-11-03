import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { calculateInsightMetrics, calculateHourlyPattern, calculateClientROI } from '@/lib/analytics';

/**
 * GET /api/analytics/insights
 * 인사이트 지표 조회
 */
export async function GET() {
  try {
    await requireAuth(['admin']);

    const [insights, hourlyPattern, clientROI] = await Promise.all([
      calculateInsightMetrics(),
      calculateHourlyPattern(),
      calculateClientROI(10),
    ]);

    return NextResponse.json({
      insights,
      hourlyPattern,
      clientROI,
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/insights:', error);
    return NextResponse.json(
      { error: '인사이트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
