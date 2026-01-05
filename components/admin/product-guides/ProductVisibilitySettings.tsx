'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
  Newspaper,
  Star,
  Gift,
  Coffee,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface ProductVisibilitySettingsProps {
  categories: ProductCategory[];
  onUpdate: () => void;
}

// 상품명 display 매핑 (DB 이름 → 표시 이름)
const displayNameMap: Record<string, string> = {
  '방문자 리뷰': '네이버 영수증',
  'K맵 리뷰': '카카오맵',
};

// 대분류 카테고리 그룹 정의
const categoryGroups = [
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
    name: '리뷰 마케팅',
    icon: Star,
    slugs: ['receipt-review', 'kakaomap-review'],
  },
  {
    name: '리워드',
    icon: Gift,
    slugs: ['twoople-reward', 'eureka-reward'],
  },
  {
    name: '침투 마케팅',
    icon: Coffee,
    slugs: ['cafe-marketing', 'community-marketing'],
  },
];

export function ProductVisibilitySettings({ categories, onUpdate }: ProductVisibilitySettingsProps) {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    category: ProductCategory | null;
    newValue: boolean;
  }>({ open: false, category: null, newValue: false });

  const handleToggle = async (category: ProductCategory, newValue: boolean) => {
    if (!newValue) {
      setConfirmDialog({ open: true, category, newValue });
      return;
    }
    await updateVisibility(category, newValue);
  };

  const updateVisibility = async (category: ProductCategory, newValue: boolean) => {
    setLoadingId(category.id);

    try {
      const response = await fetch(`/api/admin/product-categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newValue }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '상품 상태 변경에 실패했습니다');
      }

      const displayName = displayNameMap[category.name] || category.name;
      toast({
        title: '성공',
        description: newValue
          ? `${displayName} 상품이 활성화되었습니다`
          : `${displayName} 상품이 숨김 처리되었습니다`,
      });

      onUpdate();
    } catch (error) {
      console.error('상품 상태 변경 오류:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '상품 상태 변경에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoadingId(null);
      setConfirmDialog({ open: false, category: null, newValue: false });
    }
  };

  // 카테고리를 slug로 매핑
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  // 그룹별 카테고리 정리
  const groupedCategories = categoryGroups.map(group => ({
    ...group,
    categories: group.slugs
      .map(slug => categoryBySlug.get(slug))
      .filter((c): c is ProductCategory => c !== undefined),
  })).filter(group => group.categories.length > 0);

  // 통계
  const activeCount = categories.filter(c => c.is_active).length;
  const hiddenCount = categories.length - activeCount;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">상품 노출 설정</CardTitle>
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 font-medium">
                  노출: {activeCount}개
                </span>
                {hiddenCount > 0 && (
                  <span className="text-red-600 font-medium">
                    숨김: {hiddenCount}개
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
            상품을 숨기면 모든 클라이언트에게 해당 상품이 보이지 않습니다
          </p>
        </CardHeader>

        {!isCollapsed && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700 w-32">대분류</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">상품명</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700 w-24">상태</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700 w-20">노출</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedCategories.map((group, groupIndex) => (
                    group.categories.map((category, catIndex) => (
                      <tr
                        key={category.id}
                        className={`border-b border-gray-100 ${
                          !category.is_active ? 'bg-slate-50' : 'hover:bg-slate-50/50'
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
                          <div className="flex items-center gap-2">
                            {category.is_active ? (
                              <Eye className="h-4 w-4 text-green-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-slate-400" />
                            )}
                            <span className={!category.is_active ? 'text-slate-500' : ''}>
                              {displayNameMap[category.name] || category.name}
                            </span>
                          </div>
                          {category.description && (
                            <p className="text-xs text-slate-500 mt-0.5 ml-6">{category.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {loadingId === category.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400 mx-auto" />
                          ) : (
                            <Badge
                              variant={category.is_active ? 'default' : 'secondary'}
                              className={`text-xs ${
                                category.is_active
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {category.is_active ? '노출 중' : '숨김'}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Switch
                            checked={category.is_active}
                            disabled={loadingId !== null}
                            onCheckedChange={(checked) => handleToggle(category, checked)}
                          />
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, category: null, newValue: false })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              상품 숨김 확인
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <strong>{confirmDialog.category ? (displayNameMap[confirmDialog.category.name] || confirmDialog.category.name) : ''}</strong> 상품을 숨기시겠습니까?
                <br /><br />
                <span className="text-red-600 font-medium">
                  모든 클라이언트에게 해당 상품이 보이지 않게 됩니다.
                </span>
                <br />
                진행 중인 접수가 있을 경우 클라이언트가 상태를 확인할 수 없을 수 있습니다.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (confirmDialog.category) {
                  updateVisibility(confirmDialog.category, confirmDialog.newValue);
                }
              }}
            >
              숨김 처리
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
