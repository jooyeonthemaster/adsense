import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    // 클라이언트 정보 조회 (승인 상태 포함)
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('auto_distribution_approved')
      .eq('id', user.id)
      .single();

    if (clientError) {
      console.error('Error fetching client data:', clientError);
      return NextResponse.json(
        { error: '클라이언트 정보 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 클라이언트에게 설정된 가격 조회 (is_visible=true만)
    const { data: prices, error } = await supabase
      .from('client_product_prices')
      .select('price_per_unit, product_categories!inner(slug, name)')
      .eq('client_id', user.id)
      .eq('is_visible', true);

    if (error) {
      console.error('Error fetching pricing:', error);
      return NextResponse.json(
        { error: '가격 정보 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // slug를 키로 하는 가격 맵 생성
    const pricingMap: Record<string, number> = {};
    (prices || []).forEach((price: any) => {
      if (price.product_categories?.slug) {
        pricingMap[price.product_categories.slug] = price.price_per_unit;
      }
    });

    return NextResponse.json({
      success: true,
      pricing: pricingMap,
      auto_distribution_approved: clientData?.auto_distribution_approved || false,
    });
  } catch (error) {
    console.error('Error in GET /api/pricing:', error);
    return NextResponse.json(
      { error: '가격 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
