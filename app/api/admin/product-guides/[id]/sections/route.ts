import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET: 특정 가이드의 섹션 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();
    const { id } = await params;

    const { data: sections, error } = await supabase
      .from('product_guide_sections')
      .select('*')
      .eq('guide_id', id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('섹션 조회 오류:', error);
      return NextResponse.json({ error: '섹션을 불러오는데 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(sections || []);
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST: 새 섹션 생성
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const {
      section_type,
      title,
      content,
      icon,
      is_collapsible,
      is_expanded_default,
      display_order,
      bg_color,
      text_color
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수입니다' },
        { status: 400 }
      );
    }

    const { data: section, error } = await supabase
      .from('product_guide_sections')
      .insert({
        guide_id: id,
        section_type: section_type || 'custom',
        title,
        content,
        icon,
        is_collapsible: is_collapsible ?? true,
        is_expanded_default: is_expanded_default ?? false,
        display_order: display_order ?? 0,
        bg_color,
        text_color
      })
      .select()
      .single();

    if (error) {
      console.error('섹션 생성 오류:', error);
      return NextResponse.json({ error: '섹션 생성에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PUT: 섹션 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { section_id, ...updateData } = body;

    if (!section_id) {
      return NextResponse.json({ error: '섹션 ID가 필요합니다' }, { status: 400 });
    }

    const { data: section, error } = await supabase
      .from('product_guide_sections')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', section_id)
      .eq('guide_id', id)
      .select()
      .single();

    if (error) {
      console.error('섹션 수정 오류:', error);
      return NextResponse.json({ error: '섹션 수정에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// DELETE: 섹션 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const section_id = searchParams.get('section_id');

    if (!section_id) {
      return NextResponse.json({ error: '섹션 ID가 필요합니다' }, { status: 400 });
    }

    const { error } = await supabase
      .from('product_guide_sections')
      .delete()
      .eq('id', section_id)
      .eq('guide_id', id);

    if (error) {
      console.error('섹션 삭제 오류:', error);
      return NextResponse.json({ error: '섹션 삭제에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ message: '섹션이 삭제되었습니다' });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

