import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { PricingForm } from './pricing-form';

async function getClientWithPricing(clientId: string) {
  const supabase = await createClient();

  const [clientResult, categoriesResult, pricesResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    // 모든 활성화된 상품 카테고리 조회
    supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
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

  return {
    client: clientResult.data,
    categories: categoriesResult.data, // 모든 활성화된 카테고리
    prices: pricesResult.data || [],
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
