'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Newspaper,
  Star,
  Gift,
  Coffee,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

interface DefaultPrice {
  id: string;
  category_id: string;
  price_per_unit: number;
  product_categories: ProductCategory;
}

interface DefaultPricingSettingsProps {
  categories: ProductCategory[];
  onUpdate?: () => void;
}

// 상품명 display 매핑 (DB 이름 → 표시 이름)
const displayNameMap: Record<string, string> = {
  '방문자 리뷰': '네이버 영수증',
  'K맵 리뷰': '카카오맵',
};

// 대분류 카테고리 그룹 정의
const categoryGroups = [
  {
    name: '리워드',
    icon: Gift,
    slugs: ['twoople-reward', 'eureka-reward'],
  },
  {
    name: '리뷰 마케팅',
    icon: Star,
    slugs: ['receipt-review', 'kakaomap-review'],
  },
  {
    name: '체험단 마케팅',
    icon: Sparkles,
    slugs: ['blog-experience', 'xiaohongshu', 'journalist', 'influencer'],
  },
  {
    name: '블로그 배포',
    icon: Newspaper,
    slugs: ['video-distribution', 'auto-distribution', 'reviewer-distribution', 'blog-distribution'],
  },
  {
    name: '침투 마케팅',
    icon: Coffee,
    slugs: ['cafe-marketing', 'community-marketing'],
  },
];

export function DefaultPricingSettings({ categories, onUpdate }: DefaultPricingSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [originalPrices, setOriginalPrices] = useState<Record<string, number>>({});

  // 기본 가격 불러오기
  const fetchDefaultPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/default-pricing');
      if (!response.ok) throw new Error('기본 가격을 불러오는데 실패했습니다');

      const data = await response.json();
      const priceMap: Record<string, number> = {};

      (data.prices || []).forEach((p: DefaultPrice) => {
        priceMap[p.category_id] = p.price_per_unit;
      });

      // 모든 카테고리에 대해 가격이 없으면 0으로 초기화
      categories.forEach((cat) => {
        if (!(cat.id in priceMap)) {
          priceMap[cat.id] = 0;
        }
      });

      setPrices(priceMap);
      setOriginalPrices({ ...priceMap });
    } catch (error) {
      console.error('기본 가격 불러오기 오류:', error);
      toast({
        title: '오류',
        description: '기본 가격을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categories.length > 0) {
      fetchDefaultPrices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // 가격 변경
  const handlePriceChange = (categoryId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setPrices((prev) => ({
      ...prev,
      [categoryId]: numValue,
    }));
  };

  // 저장
  const handleSave = async () => {
    try {
      setSaving(true);

      const priceData = Object.entries(prices).map(([category_id, price_per_unit]) => ({
        category_id,
        price_per_unit,
      }));

      const response = await fetch('/api/admin/default-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: priceData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '저장에 실패했습니다');
      }

      setOriginalPrices({ ...prices });
      toast({
        title: '성공',
        description: '기본 가격이 저장되었습니다',
      });

      onUpdate?.();
    } catch (error) {
      console.error('기본 가격 저장 오류:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '저장에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // 변경사항 있는지 체크
  const hasChanges = JSON.stringify(prices) !== JSON.stringify(originalPrices);

  // 카테고리를 slug로 매핑
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  // 그룹별 카테고리 정리
  const groupedCategories = categoryGroups.map((group) => ({
    ...group,
    categories: group.slugs
      .map((slug) => categoryBySlug.get(slug))
      .filter((c): c is ProductCategory => c !== undefined),
  })).filter((group) => group.categories.length > 0);

  // 통계
  const configuredCount = Object.values(prices).filter((p) => p > 0).length;
  const totalCount = categories.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">기본 가격 설정</CardTitle>
            <div className="flex gap-3 text-sm">
              <span className="text-green-600 font-medium">
                설정완료: {configuredCount}개
              </span>
              {totalCount - configuredCount > 0 && (
                <span className="text-orange-600 font-medium">
                  미설정: {totalCount - configuredCount}개
                </span>
              )}
            </div>
          </div>
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          )}
        </button>
        <p className="text-sm text-muted-foreground mt-1">
          신규 회원에게 자동으로 적용되는 기본 가격입니다. 개별 회원의 가격은 별도로 설정할 수 있습니다.
        </p>
      </CardHeader>

      {!isCollapsed && (
        <CardContent>
          {/* 안내 메시지 */}
          <div className="flex items-start gap-2 p-3 mb-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">기본 가격이란?</p>
              <p className="mt-1">
                신규 회원 가입 시 자동으로 적용되는 가격입니다.
                개별 회원의 가격은 &quot;회원 관리 &gt; 가격 설정&quot;에서 따로 변경할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700 w-32">대분류</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">상품명</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700 w-40">기본 단가 (포인트)</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700 w-24">상태</th>
                </tr>
              </thead>
              <tbody>
                {groupedCategories.map((group) =>
                  group.categories.map((category, catIndex) => (
                    <tr
                      key={category.id}
                      className={`border-b border-gray-100 ${
                        !category.is_active ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      {catIndex === 0 && (
                        <td
                          rowSpan={group.categories.length}
                          className="py-3 px-3 align-top border-r border-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <group.icon className="h-4 w-4 text-primary" />
                            <span className="font-medium text-gray-700">{group.name}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-3">
                        <span className={!category.is_active ? 'text-slate-500' : ''}>
                          {displayNameMap[category.name] || category.name}
                        </span>
                        {(category.slug === 'twoople-reward' || category.slug === 'eureka-reward') && (
                          <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                            1타당
                          </Badge>
                        )}
                        {!category.is_active && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            숨김
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex justify-end">
                          <Input
                            type="number"
                            min="0"
                            value={prices[category.id] || 0}
                            onChange={(e) => handlePriceChange(category.id, e.target.value)}
                            className="w-32 text-right"
                            disabled={!category.is_active}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {prices[category.id] > 0 ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            설정완료
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            미설정
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 저장 버튼 */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {hasChanges ? (
                <span className="text-orange-600 font-medium">변경사항이 있습니다</span>
              ) : (
                <span>모든 변경사항이 저장되었습니다</span>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  저장하기
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
