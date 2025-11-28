import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET: 특정 상품의 활성 가이드 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();
    const { key } = await params;

    const { data: guide, error } = await supabase
      .from('product_guides')
      .select(`
        *,
        sections:product_guide_sections!inner(*)
      `)
      .eq('product_key', key)
      .eq('is_active', true)
      .eq('sections.is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('가이드 조회 오류:', error);
      return NextResponse.json({ error: '가이드를 불러오는데 실패했습니다' }, { status: 500 });
    }

    if (!guide) {
      return NextResponse.json({ guide: null, sections: [] });
    }

    // 섹션 정렬
    const sortedSections = guide.sections?.sort((a: any, b: any) => a.display_order - b.display_order) || [];

    return NextResponse.json({
      guide: {
        id: guide.id,
        title: guide.title,
        description: guide.description,
        icon: guide.icon
      },
      sections: sortedSections
    });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

