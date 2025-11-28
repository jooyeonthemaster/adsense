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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductGuideEditor } from '@/components/admin/product-guides/ProductGuideEditor';
import { GuidePreview } from '@/components/admin/product-guides/GuidePreview';

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
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

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
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">상품별 가이드 관리</h1>
            <p className="text-sm text-muted-foreground">
              각 상품 접수 페이지의 서비스 안내를 편집하고 관리합니다
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'edit' ? 'default' : 'outline'}
            onClick={() => setViewMode('edit')}
          >
            <Settings className="h-4 w-4 mr-2" />
            편집
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            onClick={() => setViewMode('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            미리보기
          </Button>
        </div>
      </div>

      {/* 메인 레이아웃 */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* 왼쪽: 상품 목록 */}
        <Card className="lg:col-span-3 p-4">
          <h3 className="font-semibold mb-4">상품 목록</h3>
          <ScrollArea className="h-[calc(100vh-300px)]">
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
    </div>
  );
}

