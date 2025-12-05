import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const { id: submissionId } = await context.params;
    const supabase = await createClient();

    // Verify submission belongs to this client
    const { data: submission, error: submissionError } = await supabase
      .from('kakaomap_review_submissions')
      .select('id, client_id')
      .eq('id', submissionId)
      .eq('client_id', user.id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: '접수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get content items - 클라이언트용: 모든 콘텐츠 조회 (관리자가 업로드한 데이터)
    const { data: contentItems, error: itemsError } = await supabase
      .from('kakaomap_content_items')
      .select('*')
      .eq('submission_id', submissionId)
      .order('upload_order', { ascending: true });

    if (itemsError) {
      console.error('Error fetching content items:', itemsError);
      return NextResponse.json(
        { error: '콘텐츠를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items: contentItems || [],
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/kakaomap/[id]/content:', error);
    return NextResponse.json(
      { error: '콘텐츠를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
