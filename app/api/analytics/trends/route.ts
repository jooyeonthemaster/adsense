import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { calculateComprehensiveTrends } from '@/lib/trend-analytics';

/**
 * GET /api/analytics/trends
 * 실시간 거래량 및 증감률 조회
 */
export async function GET() {
  try {
    await requireAuth(['admin']);

    const trends = await calculateComprehensiveTrends();

    return NextResponse.json({ trends });
  } catch (error) {
    console.error('Error in GET /api/analytics/trends:', error);
    return NextResponse.json(
      { error: '트렌드 분석 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
