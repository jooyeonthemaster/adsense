import { createClient } from '@/utils/supabase/server';

export async function getClientPricing(clientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('client_product_prices')
    .select('*, product_categories!inner(*)')
    .eq('client_id', clientId)
    .eq('is_visible', true)
    .eq('product_categories.is_active', true);

  if (error) {
    console.error('Error fetching client pricing:', error);
    return [];
  }

  return data || [];
}

/**
 * 상품 가격 조회 (클라이언트 개별 가격 > 기본 가격 우선순위)
 */
export async function getProductPrice(
  clientId: string,
  categorySlug: string
): Promise<number | null> {
  const supabase = await createClient();

  // 1. 클라이언트 개별 가격 조회
  const { data: clientPrice } = await supabase
    .from('client_product_prices')
    .select('price_per_unit, product_categories!inner(slug, is_active)')
    .eq('client_id', clientId)
    .eq('product_categories.slug', categorySlug)
    .eq('is_visible', true)
    .eq('product_categories.is_active', true)
    .single();

  // 클라이언트 개별 가격이 있으면 반환
  if (clientPrice && clientPrice.price_per_unit > 0) {
    return clientPrice.price_per_unit;
  }

  // 2. 기본 가격 조회 (fallback)
  const { data: defaultPrice } = await supabase
    .from('default_product_prices')
    .select('price_per_unit, product_categories!inner(slug, is_active)')
    .eq('product_categories.slug', categorySlug)
    .eq('product_categories.is_active', true)
    .single();

  if (defaultPrice && defaultPrice.price_per_unit > 0) {
    return defaultPrice.price_per_unit;
  }

  return null;
}

export async function getClientPricingMap(
  clientId: string
): Promise<Record<string, number | null>> {
  const pricing = await getClientPricing(clientId);

  const pricingMap: Record<string, number | null> = {
    'twoople-reward': null,
    'eureka-reward': null,
    'receipt-review': null,
    'kakaomap-review': null,
    'blog-reviewer': null,
    'blog-video': null,
    'blog-automation': null,
  };

  for (const item of pricing) {
    if (item.product_categories && 'slug' in item.product_categories) {
      pricingMap[item.product_categories.slug as string] = item.price_per_unit;
    }
  }

  return pricingMap;
}

export function calculatePlacePrice(
  pricePerUnit: number,
  dailyCount: number,
  totalDays: number
): number {
  return pricePerUnit * dailyCount * totalDays;
}
