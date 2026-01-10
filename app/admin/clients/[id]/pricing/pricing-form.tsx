'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client, ProductCategory, ClientProductPrice } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PricingFormProps {
  clientId: string;
  client: Client;
  categories: ProductCategory[];
  existingPrices: (ClientProductPrice & { product_categories: ProductCategory })[];
}

interface FormState {
  autoDistributionApproved: boolean;
}

// 대분류 카테고리 그룹 정의
const categoryGroups = {
  '리워드': ['twoople-reward', 'eureka-reward'],
  '리뷰 마케팅': ['receipt-review', 'kakaomap-review'],
  '체험단 마케팅': ['blog-experience', 'xiaohongshu', 'journalist', 'influencer'],
  '블로그 배포': ['video-distribution', 'auto-distribution', 'reviewer-distribution', 'blog-distribution'],
  '침투 마케팅': ['cafe-marketing', 'community-marketing'],
};

export function PricingForm({
  clientId,
  client,
  categories,
  existingPrices,
}: PricingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoDistributionApproved, setAutoDistributionApproved] = useState(
    client.auto_distribution_approved || false
  );
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(false);

  const existingPriceMap = new Map(
    existingPrices.map((p) => [p.category_id, p])
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const prices = categories.map((category) => ({
      category_id: category.id,
      price_per_unit: parseInt(formData.get(`price_${category.id}`) as string) || 0,
      is_visible: formData.get(`visible_${category.id}`) === 'on',
    }));

    try {
      const response = await fetch(`/api/admin/clients/${clientId}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prices,
          auto_distribution_approved: autoDistributionApproved,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '가격 설정에 실패했습니다.');
        return;
      }

      router.push('/admin/clients');
      router.refresh();
    } catch (err) {
      setError('가격 설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리를 slug로 매핑
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  // 가격 설정 개요 데이터 생성
  const pricingOverview = categories.map((category) => {
    const existingPrice = existingPriceMap.get(category.id);
    const groupName = Object.entries(categoryGroups).find(([_, slugs]) =>
      slugs.includes(category.slug)
    )?.[0] || '기타';

    return {
      category,
      groupName,
      price: existingPrice?.price_per_unit || 0,
      isVisible: existingPrice?.is_visible ?? true,
      isConfigured: existingPrice && existingPrice.price_per_unit > 0,
    };
  });

  const configuredCount = pricingOverview.filter(p => p.isConfigured).length;
  const notConfiguredCount = categories.length - configuredCount;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 가격 설정 개요 - 접기/펼치기 가능 */}
      <Card className="border-sky-200 bg-sky-50/50">
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setIsOverviewCollapsed(!isOverviewCollapsed)}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">가격 설정 개요</CardTitle>
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 font-medium">
                  설정완료: {configuredCount}개
                </span>
                {notConfiguredCount > 0 && (
                  <span className="text-orange-600 font-medium">
                    미설정: {notConfiguredCount}개
                  </span>
                )}
              </div>
            </div>
            {isOverviewCollapsed ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </CardHeader>
        {!isOverviewCollapsed && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">대분류</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">상품명</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">단가</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">표시</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingOverview.map(({ category, groupName, price, isVisible, isConfigured }) => (
                    <tr key={category.id} className="border-b border-gray-200 hover:bg-white/50">
                      <td className="py-2 px-3 text-gray-600">{groupName}</td>
                      <td className="py-2 px-3 font-medium">{category.name}</td>
                      <td className="py-2 px-3 text-right">
                        {price > 0 ? (
                          <span className="font-semibold text-gray-900">
                            {price.toLocaleString()}P
                          </span>
                        ) : (
                          <span className="text-gray-400">미설정</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isVisible ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isConfigured ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            설정완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            미설정
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
      {Object.entries(categoryGroups).map(([groupName, slugs]) => {
        // 이 그룹에 속한 카테고리들만 필터링
        const groupCategories = slugs
          .map((slug) => categoryBySlug.get(slug))
          .filter((c): c is ProductCategory => c !== undefined);

        if (groupCategories.length === 0) return null;

        return (
          <div key={groupName} className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-xl font-semibold">{groupName}</h2>
              <p className="text-sm text-muted-foreground">
                {groupCategories.length}개 상품
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupCategories.map((category) => {
                const existingPrice = existingPriceMap.get(category.id);
                const isAutoDistribution = category.slug === 'auto-distribution';

                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`price_${category.id}`}>
                          {category.slug === 'twoople-reward' || category.slug === 'eureka-reward'
                            ? '단가 (1타당 포인트)'
                            : '단가 (포인트)'}
                        </Label>
                        <Input
                          id={`price_${category.id}`}
                          name={`price_${category.id}`}
                          type="number"
                          min="0"
                          defaultValue={existingPrice?.price_per_unit || 0}
                          placeholder="0"
                          disabled={loading}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor={`visible_${category.id}`} className="text-sm">
                          거래처에 표시
                        </Label>
                        <Switch
                          id={`visible_${category.id}`}
                          name={`visible_${category.id}`}
                          defaultChecked={existingPrice?.is_visible ?? true}
                          disabled={loading}
                        />
                      </div>

                      {isAutoDistribution && (
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="auto-distribution-approval" className="text-sm font-medium">
                                자동화 배포 승인
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                승인된 회원만 자동화 배포 사용 가능
                              </p>
                            </div>
                            <Switch
                              id="auto-distribution-approval"
                              checked={autoDistributionApproved}
                              onCheckedChange={setAutoDistributionApproved}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* 저장/취소 버튼 - 하단 고정 */}
      <div className="sticky bottom-0 z-10 mt-8">
        <Card className="border-gray-200 bg-gradient-to-r from-sky-50 to-white shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                모든 변경사항을 확인하셨나요?
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px] bg-sky-500 hover:bg-sky-600 text-white shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      저장 중...
                    </span>
                  ) : (
                    '저장하기'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
