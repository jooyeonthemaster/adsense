import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET: 기본 가격 목록 조회
export async function GET() {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    // 기본 가격과 상품 카테고리 조인하여 조회
    const { data, error } = await supabase
      .from('default_product_prices')
      .select(`
        id,
        category_id,
        price_per_unit,
        created_at,
        updated_at,
        product_categories!inner (
          id,
          name,
          slug,
          description,
          is_active
        )
      `)
      .order('product_categories(name)');

    if (error) {
      console.error('Error fetching default prices:', error);
      return NextResponse.json(
        { error: '기본 가격 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prices: data || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/default-pricing:', error);
    return NextResponse.json(
      { error: '기본 가격을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 기본 가격 저장 (upsert)
export async function POST(request: Request) {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();
    const body = await request.json();

    const { prices } = body as {
      prices: Array<{
        category_id: string;
        price_per_unit: number;
      }>;
    };

    if (!prices || !Array.isArray(prices)) {
      return NextResponse.json(
        { error: '가격 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 기존 기본 가격 모두 삭제
    const { error: deleteError } = await supabase
      .from('default_product_prices')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 전체 삭제

    if (deleteError) {
      console.error('Error deleting default prices:', deleteError);
      return NextResponse.json(
        { error: '기존 가격 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 새 기본 가격 삽입 (가격이 0 이상인 것만)
    const pricesToInsert = prices
      .filter((p) => p.price_per_unit >= 0)
      .map((p) => ({
        category_id: p.category_id,
        price_per_unit: p.price_per_unit,
      }));

    if (pricesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('default_product_prices')
        .insert(pricesToInsert);

      if (insertError) {
        console.error('Error inserting default prices:', insertError);
        return NextResponse.json(
          { error: '기본 가격 저장 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '기본 가격이 저장되었습니다.',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/default-pricing:', error);
    return NextResponse.json(
      { error: '기본 가격 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
