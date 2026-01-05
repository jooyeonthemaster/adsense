import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET: 모든 가이드 조회
export async function GET() {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();

    const { data: guides, error } = await supabase
      .from('product_guides')
      .select(`
        *,
        sections:product_guide_sections(*)
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('가이드 조회 오류:', error);
      return NextResponse.json({ error: '가이드를 불러오는데 실패했습니다' }, { status: 500 });
    }

    // 섹션 정렬
    const guidesWithSortedSections = guides?.map((guide: any) => ({
      ...guide,
      sections: guide.sections?.sort((a: any, b: any) => a.display_order - b.display_order) || []
    }));

    return NextResponse.json(guidesWithSortedSections || []);
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST: 새 가이드 생성
export async function POST(request: Request) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();
    const body = await request.json();

    const { product_key, title, description, icon, is_active, display_order } = body;

    if (!product_key || !title) {
      return NextResponse.json(
        { error: '상품 키와 제목은 필수입니다' },
        { status: 400 }
      );
    }

    const { data: guide, error } = await supabase
      .from('product_guides')
      .insert({
        product_key,
        title,
        description,
        icon,
        is_active: is_active ?? true,
        display_order: display_order ?? 0,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('가이드 생성 오류:', error);
      return NextResponse.json({ error: '가이드 생성에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PUT: 가이드 수정
export async function PUT(request: Request) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();
    const body = await request.json();

    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: '가이드 ID가 필요합니다' }, { status: 400 });
    }

    const { data: guide, error } = await supabase
      .from('product_guides')
      .update({
        ...updateData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('가이드 수정 오류:', error);
      return NextResponse.json({ error: '가이드 수정에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(guide);
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// DELETE: 가이드 삭제
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '가이드 ID가 필요합니다' }, { status: 400 });
    }

    const { error } = await supabase
      .from('product_guides')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('가이드 삭제 오류:', error);
      return NextResponse.json({ error: '가이드 삭제에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ message: '가이드가 삭제되었습니다' });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}














