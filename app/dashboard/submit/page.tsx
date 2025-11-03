/**
 * ============================================================================
 * [UPDATED] 상품 접수 페이지 - 4가지 고정 상품으로 변경 (2025-11-02)
 * ============================================================================
 *
 * 변경 내용:
 * - product_categories 테이블 조회 제거
 * - 4가지 고정 상품 하드코딩
 * - 단가는 여전히 client_product_prices에서 조회 (slug 기반)
 *
 * 고정 상품:
 * 1. place-traffic (플레이스 유입)
 * 2. receipt-review (영수증 리뷰)
 * 3. kakaomap-review (카카오맵 리뷰)
 * 4. blog-distribution (블로그 배포)
 *
 * 관련 문서: claudedocs/CUSTOM_PRODUCT_ANALYSIS.md
 * ============================================================================
 */

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileText, ArrowRight, MapPin } from 'lucide-react';

// 4가지 고정 상품 정의
const FIXED_PRODUCTS = [
  {
    slug: 'place-traffic',
    name: '플레이스 유입 접수',
    description: '네이버 플레이스 유입 서비스를 신청합니다',
    icon: MapPin,
  },
  {
    slug: 'receipt-review',
    name: '영수증 리뷰 접수',
    description: '영수증 기반 리뷰 작성 서비스를 신청합니다',
    icon: FileText,
  },
  {
    slug: 'kakaomap-review',
    name: '카카오맵 리뷰 접수',
    description: '카카오맵 리뷰 작성 서비스를 신청합니다',
    icon: MapPin,
  },
  {
    slug: 'blog-distribution',
    name: '블로그 배포 접수',
    description: '블로그 콘텐츠 배포 서비스를 신청합니다',
    icon: Package,
  },
];

/**
 * 클라이언트별 상품 접근 권한 및 단가 조회
 */
async function getClientProductPrices(clientId: string) {
  const supabase = await createClient();

  // client_product_prices에서 이 클라이언트가 접근 가능한 상품 조회
  const { data: prices, error } = await supabase
    .from('client_product_prices')
    .select('*, product_categories(slug)')
    .eq('client_id', clientId)
    .eq('is_visible', true);

  if (error || !prices) {
    return {};
  }

  // slug를 키로 하는 객체로 변환
  const priceMap: Record<string, number> = {};
  prices.forEach((p: any) => {
    const category = p.product_categories;
    if (category && category.slug) {
      priceMap[category.slug] = p.price_per_unit || 0;
    }
  });

  return priceMap;
}

export default async function SubmitPage() {
  const user = await requireAuth(['client']);
  const clientPrices = await getClientProductPrices(user.id);

  // 클라이언트가 접근 가능한 상품만 필터링
  const availableProducts = FIXED_PRODUCTS.filter(
    (product) => clientPrices[product.slug] !== undefined
  ).map((product) => ({
    ...product,
    pricePerUnit: clientPrices[product.slug],
    href: `/dashboard/submit/${product.slug}`,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">상품 접수</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          이용 가능한 상품을 선택하여 접수하세요
        </p>
      </div>

      {availableProducts.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <p className="text-center text-xs sm:text-sm text-muted-foreground">
              현재 이용 가능한 상품이 없습니다.
              <br />
              관리자에게 문의하세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2">
          {availableProducts.map((product) => {
            const Icon = product.icon;
            return (
              <Card key={product.slug} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base lg:text-lg truncate">{product.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm line-clamp-2">{product.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <Link href={product.href}>
                    <Button className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                      접수하기
                      <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                  {product.pricePerUnit > 0 && (
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground text-center">
                      단가: {product.pricePerUnit.toLocaleString()} P
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
