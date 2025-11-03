import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { PricingForm } from './pricing-form';

// [UPDATED 2025-11-02] 4가지 고정 상품만 사용
const FIXED_PRODUCTS = [
  {
    id: 'place-traffic',
    slug: 'place-traffic',
    name: '플레이스 유입',
    description: '네이버 플레이스 유입 접수 서비스',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'receipt-review',
    slug: 'receipt-review',
    name: '영수증 리뷰',
    description: '영수증 기반 리뷰 작성 서비스',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'kakaomap-review',
    slug: 'kakaomap-review',
    name: '카카오맵 리뷰',
    description: '카카오맵 리뷰 작성 서비스',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'blog-distribution',
    slug: 'blog-distribution',
    name: '블로그 배포',
    description: '블로그 콘텐츠 배포 서비스',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

async function getClientWithPricing(clientId: string) {
  const supabase = await createClient();

  const [clientResult, pricesResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase
      .from('client_product_prices')
      .select('*, product_categories(*)')
      .eq('client_id', clientId),
  ]);

  if (clientResult.error || !clientResult.data) {
    return null;
  }

  // [UPDATED 2025-11-02] 4가지 고정 상품만 필터링
  const filteredPrices = (pricesResult.data || []).filter((price: any) => {
    const slug = price.product_categories?.slug;
    return FIXED_PRODUCTS.some((p) => p.slug === slug);
  });

  return {
    client: clientResult.data,
    categories: FIXED_PRODUCTS, // 4가지 고정 상품만 사용
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
