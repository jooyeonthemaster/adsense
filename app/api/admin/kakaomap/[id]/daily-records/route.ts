import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const supabase = await createClient();

    // kakaomap_content_items에서 review_registered_date 기준으로 날짜별 건수 집계
    // (방문자 리뷰와 동일한 방식)
    const { data: contentItems, error } = await supabase
      .from('kakaomap_content_items')
      .select('review_registered_date')
      .eq('submission_id', id)
      .not('review_registered_date', 'is', null);

    if (error) {
      console.error('Error fetching content items:', error);
      return NextResponse.json({ records: [] }, { status: 200 });
    }

    // 날짜별로 그룹화하여 건수 계산
    const dateCountMap = new Map<string, number>();
    for (const item of contentItems || []) {
      if (item.review_registered_date) {
        const dateStr = item.review_registered_date;
        dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
      }
    }

    // DailyRecordCalendar에서 사용하는 형식으로 변환
    const records = Array.from(dateCountMap.entries()).map(([date, count]) => ({
      date,
      actual_count: count,
      notes: '',
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ records: [] }, { status: 200 });
  }
}

// POST는 더 이상 사용하지 않음 (자동 집계 방식으로 변경)
// 하지만 기존 코드 호환성을 위해 유지하되 무시
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);

    // 자동 집계 방식으로 변경되어 수동 입력은 무시
    return NextResponse.json({
      success: true,
      message: '일별 기록은 콘텐츠 배포 시 자동으로 집계됩니다.'
    }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
