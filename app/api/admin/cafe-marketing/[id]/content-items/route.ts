import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/service';

export interface CafeContentItem {
  id: string;
  submission_id: string;
  upload_order: number;
  post_title: string | null;
  published_date: string | null;
  status: string | null;
  post_url: string | null;
  writer_id: string | null;
  cafe_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 상태 한글 -> 영문 매핑
function mapCafeStatus(koreanStatus?: string): 'pending' | 'approved' | 'revision_requested' {
  switch (koreanStatus) {
    case '승인됨':
      return 'approved';
    case '수정요청':
      return 'revision_requested';
    case '대기':
    default:
      return 'pending';
  }
}

// GET: 콘텐츠 아이템 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const supabase = createClient();

    // submission 정보 조회
    const { data: submission, error: submissionError } = await supabase
      .from('cafe_marketing_submissions')
      .select('id, company_name, total_count, submission_number')
      .eq('id', id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: '제출 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 콘텐츠 아이템 조회
    const { data: contentItems, error: contentError } = await supabase
      .from('cafe_content_items')
      .select('*')
      .eq('submission_id', id)
      .order('upload_order', { ascending: true });

    if (contentError) {
      console.error('Error fetching cafe content items:', contentError);
      return NextResponse.json(
        { error: '콘텐츠 아이템 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contentItems: contentItems || [],
      submission,
      total: contentItems?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/cafe-marketing/[id]/content-items:', error);
    return NextResponse.json(
      { error: '콘텐츠 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 콘텐츠 아이템 일괄 업로드 (엑셀)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id: submissionId } = await params;
    const supabase = createClient();

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '업로드할 콘텐츠가 없습니다.' },
        { status: 400 }
      );
    }

    // submission 존재 확인
    const { data: submission, error: submissionError } = await supabase
      .from('cafe_marketing_submissions')
      .select('id, company_name')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: '제출 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기존 콘텐츠 삭제 (덮어쓰기 방식)
    const { error: deleteError } = await supabase
      .from('cafe_content_items')
      .delete()
      .eq('submission_id', submissionId);

    if (deleteError) {
      console.error('Error deleting existing content items:', deleteError);
      return NextResponse.json(
        { error: '기존 콘텐츠 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 새 콘텐츠 아이템 생성
    const contentItems = items.map((item: any, index: number) => ({
      submission_id: submissionId,
      upload_order: index + 1,
      post_title: item.post_title || null,
      published_date: item.published_date || null,
      status: mapCafeStatus(item.status),
      post_url: item.post_url || null,
      writer_id: item.writer_id || null,
      cafe_name: item.cafe_name || null,
      notes: item.notes || null,
    }));

    const { data: insertedItems, error: insertError } = await supabase
      .from('cafe_content_items')
      .insert(contentItems)
      .select();

    if (insertError) {
      console.error('Error inserting content items:', insertError);
      return NextResponse.json(
        { error: '콘텐츠 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${insertedItems?.length || 0}개의 콘텐츠가 업로드되었습니다.`,
      count: insertedItems?.length || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/cafe-marketing/[id]/content-items:', error);
    return NextResponse.json(
      { error: '콘텐츠 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 모든 콘텐츠 아이템 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id: submissionId } = await params;
    const supabase = createClient();

    const { error } = await supabase
      .from('cafe_content_items')
      .delete()
      .eq('submission_id', submissionId);

    if (error) {
      console.error('Error deleting content items:', error);
      return NextResponse.json(
        { error: '콘텐츠 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '모든 콘텐츠가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/cafe-marketing/[id]/content-items:', error);
    return NextResponse.json(
      { error: '콘텐츠 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
