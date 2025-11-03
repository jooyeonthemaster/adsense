import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { PricingForm } from './pricing-form';

// [UPDATED 2025-11-02] 4가지 고정 상품의 slug 목록
const FIXED_PRODUCT_SLUGS = [
  'place-traffic',
  'receipt-review',
  'kakaomap-review',
  'blog-distribution',
];

async function getClientWithPricing(clientId: string) {
  const supabase = await createClient();

  const [clientResult, categoriesResult, pricesResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    // 데이터베이스에서 실제 product_categories 조회 (UUID 포함)
    supabase
      .from('product_categories')
      .select('*')
      .in('slug', FIXED_PRODUCT_SLUGS)
      .eq('is_active', true),
    supabase
      .from('client_product_prices')
      .select('*, product_categories(*)')
      .eq('client_id', clientId),
  ]);

  if (clientResult.error || !clientResult.data) {
    return null;
  }

  if (categoriesResult.error || !categoriesResult.data) {
    return null;
  }

  // 4가지 고정 상품만 필터링
  const filteredPrices = (pricesResult.data || []).filter((price: any) => {
    const slug = price.product_categories?.slug;
    return FIXED_PRODUCT_SLUGS.includes(slug);
  });

  return {
    client: clientResult.data,
    categories: categoriesResult.data, // 실제 DB에서 조회한 카테고리 (UUID 포함)
    prices: filteredPrices,
  };
}

export default async function ClientPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth(['admin']);
  const { id } = await params;
  const data = await getClientWithPricing(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">상품 가격 설정</h1>
        <p className="text-muted-foreground">
          {data.client.company_name}의 상품별 단가를 설정합니다
        </p>
      </div>

      <PricingForm
        clientId={id}
        client={data.client}
        categories={data.categories}
        existingPrices={data.prices}
      />
    </div>
  );
}
