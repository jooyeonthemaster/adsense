import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFilteredSubmissions } from '@/lib/filtering';
import type { FilterOptions } from '@/types/analytics';

/**
 * POST /api/filtered-submissions
 * 고급 필터링된 접수 내역 조회
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const body = await request.json();
    const filters: FilterOptions = body.filters || {};

    const result = await getFilteredSubmissions(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/filtered-submissions:', error);
    return NextResponse.json(
      { error: '필터링된 접수 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
