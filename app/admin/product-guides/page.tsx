'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  Plus,
  Eye,
  Save,
  RotateCcw,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Settings,
  Package,
  DollarSign,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductGuideEditor } from '@/components/admin/product-guides/ProductGuideEditor';
import { GuidePreview } from '@/components/admin/product-guides/GuidePreview';
import { ProductVisibilitySettings } from '@/components/admin/product-guides/ProductVisibilitySettings';
import { DefaultPricingSettings } from '@/components/admin/product-guides/DefaultPricingSettings';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface Guide {
  id: string;
  product_key: string;
  title: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
  sections?: Section[];
}

interface Section {
  id: string;
  guide_id: string;
  section_type: string;
  title: string;
  content: string;
  icon: string;
  is_collapsible: boolean;
  is_expanded_default: boolean;
  display_order: number;
  is_active: boolean;
  bg_color?: string;
  text_color?: string;
}

export default function ProductGuidesPage() {
  const { toast } = useToast();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [activeTab, setActiveTab] = useState<'visibility' | 'pricing' | 'guides'>('visibility');

  // 상품 카테고리 목록 불러오기
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/product-categories');
      if (!response.ok) throw new Error('상품 카테고리를 불러오는데 실패했습니다');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast({
        title: '오류',
        description: '상품 카테고리를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 가이드 목록 불러오기
  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/product-guides');
      if (!response.ok) throw new Error('가이드를 불러오는데 실패했습니다');
      const data = await response.json();
      setGuides(data);

      // 첫 번째 가이드 자동 선택
      if (data.length > 0 && !selectedGuide) {
        setSelectedGuide(data[0]);
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '가이드를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchGuides();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 가이드 저장
  const handleSaveGuide = async () => {
    if (!selectedGuide) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/product-guides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedGuide),
      });

      if (!response.ok) throw new Error('저장 실패');

      toast({
        title: '성공',
        description: '가이드가 저장되었습니다',
      });

      fetchGuides();
    } catch (error) {
      toast({
        title: '오류',
        description: '저장에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // 가이드 선택 시 최신 데이터로 업데이트
  const handleSelectGuide = (guide: Guide) => {
    const updatedGuide = guides.find(g => g.id === guide.id) || guide;
    setSelectedGuide(updatedGuide);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">전체 상품 설정 및 가이드 관리</h1>
            <p className="text-sm text-muted-foreground">
              상품 노출을 관리하고, 각 상품별 서비스 안내를 편집합니다
            </p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'visibility' | 'pricing' | 'guides')}>
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="visibility" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            상품 노출 설정
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            기본 가격 설정
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            가이드 관리
          </TabsTrigger>
        </TabsList>

        {/* 상품 노출 설정 탭 */}
        <TabsContent value="visibility" className="mt-6">
          <ProductVisibilitySettings
            categories={categories}
            onUpdate={fetchCategories}
          />
        </TabsContent>

        {/* 기본 가격 설정 탭 */}
        <TabsContent value="pricing" className="mt-6">
          <DefaultPricingSettings
            categories={categories}
            onUpdate={fetchCategories}
          />
        </TabsContent>

        {/* 가이드 관리 탭 */}
        <TabsContent value="guides" className="mt-6">
          <div className="flex justify-end mb-4 gap-2">
            <Button
              variant={viewMode === 'edit' ? 'default' : 'outline'}
              onClick={() => setViewMode('edit')}
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              편집
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              onClick={() => setViewMode('preview')}
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              미리보기
            </Button>
          </div>

          {/* 메인 레이아웃 */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* 왼쪽: 상품 목록 */}
            <Card className="lg:col-span-3 p-4">
              <h3 className="font-semibold mb-4">상품 목록</h3>
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-2">
                  {guides.map((guide) => (
                    <button
                      key={guide.id}
                      onClick={() => handleSelectGuide(guide)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedGuide?.id === guide.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${
                          guide.is_active ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium text-sm">{guide.title}</span>
                      </div>
                      <p className="text-xs opacity-80 truncate">{guide.description}</p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span>{guide.sections?.length || 0}개 섹션</span>
                        <span className="opacity-60">{guide.product_key}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* 중앙/오른쪽: 에디터 또는 미리보기 */}
            <div className="lg:col-span-9">
              {!selectedGuide ? (
                <Card className="p-12 text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">상품을 선택하세요</h3>
                  <p className="text-muted-foreground">
                    왼쪽 목록에서 편집할 상품을 선택하세요
                  </p>
                </Card>
              ) : viewMode === 'edit' ? (
                <ProductGuideEditor
                  guide={selectedGuide}
                  onUpdate={(updated) => {
                    setSelectedGuide(updated);
                    // 메모리상의 guides도 업데이트
                    setGuides(guides.map(g => g.id === updated.id ? updated : g));
                  }}
                  onSave={handleSaveGuide}
                  saving={saving}
                />
              ) : (
                <GuidePreview guide={selectedGuide} />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

