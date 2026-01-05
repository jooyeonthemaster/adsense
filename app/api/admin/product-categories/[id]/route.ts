import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// PATCH: 상품 카테고리 활성화 상태 변경
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active 값이 필요합니다' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('product_categories')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('상품 카테고리 수정 오류:', error);
      return NextResponse.json({ error: '상품 카테고리 수정에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
