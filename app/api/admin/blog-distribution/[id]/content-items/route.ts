import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export interface BlogContentItem {
  id: string;
  submission_id: string;
  upload_order: number;
  blog_url: string | null;
  blog_title: string | null;
  keyword: string | null;
  published_date: string | null;
  notes: string | null;
  status: string | null;
  blog_id: string | null;
  distribution_type: string | null;
  created_at: string;
  updated_at: string;
}

// 한글 상태값을 DB status 값으로 변환
function mapBlogStatus(koreanStatus?: string): 'pending' | 'approved' | 'revision_requested' {
  if (!koreanStatus) return 'pending';
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

// GET: 블로그 콘텐츠 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const supabase = await createClient();

    // 해당 submission의 모든 콘텐츠 아이템 조회
    const { data: contentItems, error } = await supabase
      .from('blog_content_items')
      .select('*')
      .eq('submission_id', id)
      .order('upload_order', { ascending: true });

    if (error) {
      console.error('Error fetching blog content items:', error);
      return NextResponse.json({
        contentItems: [],
        error: error.message
      }, { status: 200 });
    }

    // submission 정보도 함께 조회 (업체명 등)
    const { data: submission } = await supabase
      .from('blog_distribution_submissions')
      .select('company_name')
      .eq('id', id)
      .single();

    return NextResponse.json({
      contentItems: contentItems || [],
      submission: submission || null,
      total: contentItems?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      contentItems: [],
      error: 'Internal server error'
    }, { status: 200 });
  }
}

// POST: 엑셀에서 블로그 콘텐츠 업로드
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id: submissionId } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const { items } = body as { items: Array<{
      blog_url?: string;
      blog_title?: string;
      keyword?: string;
      published_date?: string;
      notes?: string;
      status?: string;
      blog_id?: string;
    }> };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '업로드할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 해당 submission의 distribution_type 조회
    const { data: submissionData } = await supabase
      .from('blog_distribution_submissions')
      .select('distribution_type')
      .eq('id', submissionId)
      .single();

    const distributionType = submissionData?.distribution_type || null;

    // 기존 콘텐츠 삭제 (덮어쓰기)
    await supabase
      .from('blog_content_items')
      .delete()
      .eq('submission_id', submissionId);

    // 새 콘텐츠 추가
    const contentItems = items.map((item, index) => ({
      submission_id: submissionId,
      upload_order: index + 1,
      blog_url: item.blog_url || null,
      blog_title: item.blog_title || null,
      keyword: item.keyword || null,
      published_date: item.published_date || null,
      notes: item.notes || null,
      status: mapBlogStatus(item.status),
      blog_id: item.blog_id || null,
      distribution_type: distributionType,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('blog_content_items')
      .insert(contentItems)
      .select();

    if (insertError) {
      console.error('Error inserting blog content items:', insertError);
      return NextResponse.json(
        { error: '콘텐츠 업로드 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
      message: `${inserted?.length || 0}건의 콘텐츠가 업로드되었습니다.`,
    });
  } catch (error) {
    console.error('Error uploading blog content:', error);
    return NextResponse.json(
      { error: '콘텐츠 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 모든 콘텐츠 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id: submissionId } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('blog_content_items')
      .delete()
      .eq('submission_id', submissionId);

    if (error) {
      console.error('Error deleting blog content items:', error);
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
    console.error('Error deleting blog content:', error);
    return NextResponse.json(
      { error: '콘텐츠 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
