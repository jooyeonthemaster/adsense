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

    // 1. 활성화된 상품 카테고리 목록 조회 (is_active 기반 - 관리자 숨김 토글)
    const { data: activeCategories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('id, slug')
      .eq('is_active', true);

    if (categoriesError) {
      console.error('Error fetching active categories:', categoriesError);
      return NextResponse.json(
        { error: '상품 카테고리 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 2. 기본 가격 조회
    const { data: defaultPrices, error: defaultPricesError } = await supabase
      .from('default_product_prices')
      .select('category_id, price_per_unit, product_categories!inner(slug)');

    if (defaultPricesError) {
      console.error('Error fetching default prices:', defaultPricesError);
      // 기본 가격 조회 실패해도 계속 진행 (기존 로직 유지)
    }

    // 기본 가격 맵 생성 (slug → price)
    const defaultPricingMap: Record<string, number> = {};
    (defaultPrices || []).forEach((dp: any) => {
      if (dp.product_categories?.slug && dp.price_per_unit > 0) {
        defaultPricingMap[dp.product_categories.slug] = dp.price_per_unit;
      }
    });

    // 3. 클라이언트에게 설정된 가격 조회 (is_visible=true만 - is_active 필터 제거)
    // 가격은 활성화 여부와 별개로 조회해야 "준비중" 표시 가능
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

    // slug를 키로 하는 가격 맵 생성 (클라이언트 개별 가격)
    const clientPricingMap: Record<string, number> = {};
    (prices || []).forEach((price: any) => {
      if (price.product_categories?.slug) {
        clientPricingMap[price.product_categories.slug] = price.price_per_unit;
      }
    });

    // 4. 최종 가격 맵 생성: 클라이언트 가격 > 기본 가격 우선순위
    const pricingMap: Record<string, number> = {};
    const activeProductSlugs = (activeCategories || []).map((c: any) => c.slug);

    activeProductSlugs.forEach((slug: string) => {
      // 클라이언트 개별 가격이 있으면 사용, 없으면 기본 가격 사용
      if (clientPricingMap[slug] !== undefined) {
        pricingMap[slug] = clientPricingMap[slug];
      } else if (defaultPricingMap[slug] !== undefined) {
        pricingMap[slug] = defaultPricingMap[slug];
      }
      // 둘 다 없으면 가격 맵에 포함하지 않음 (미설정 상태)
    });

    return NextResponse.json({
      success: true,
      pricing: pricingMap,
      activeProducts: activeProductSlugs, // 관리자가 활성화한 상품 목록 (is_active=true)
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
