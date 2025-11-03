import { createClient } from '@/utils/supabase/server';

export async function getClientPricing(clientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('client_product_prices')
    .select('*, product_categories(*)')
    .eq('client_id', clientId)
    .eq('is_visible', true);

  if (error) {
    console.error('Error fetching client pricing:', error);
    return [];
  }

  return data || [];
}

export async function getProductPrice(
  clientId: string,
  categorySlug: string
): Promise<number | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('client_product_prices')
    .select('price_per_unit, product_categories!inner(slug)')
    .eq('client_id', clientId)
    .eq('product_categories.slug', categorySlug)
    .eq('is_visible', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data.price_per_unit;
}

export async function getClientPricingMap(
  clientId: string
): Promise<Record<string, number | null>> {
  const pricing = await getClientPricing(clientId);

  const pricingMap: Record<string, number | null> = {
    'place-traffic': null,
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
