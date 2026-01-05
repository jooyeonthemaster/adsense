import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET: 모든 상품 카테고리 조회
export async function GET() {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('상품 카테고리 조회 오류:', error);
      return NextResponse.json({ error: '상품 카테고리를 불러오는데 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(categories || []);
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
