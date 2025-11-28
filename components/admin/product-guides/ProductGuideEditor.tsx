'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Save,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SectionForm } from './SectionForm';
import { useToast } from '@/hooks/use-toast';

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

interface ProductGuideEditorProps {
  guide: Guide;
  onUpdate: (guide: Guide) => void;
  onSave: () => void;
  saving: boolean;
}

export function ProductGuideEditor({ guide, onUpdate, onSave, saving }: ProductGuideEditorProps) {
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showSectionForm, setShowSectionForm] = useState(false);

  const sections = guide.sections || [];

  // 섹션 추가
  const handleAddSection = async (sectionData: Partial<Section>) => {
    try {
      const response = await fetch(`/api/admin/product-guides/${guide.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sectionData,
          display_order: sections.length,
        }),
      });

      if (!response.ok) throw new Error('섹션 추가 실패');

      const newSection = await response.json();
      onUpdate({
        ...guide,
        sections: [...sections, newSection],
      });

      toast({
        title: '성공',
        description: '섹션이 추가되었습니다',
      });

      setShowSectionForm(false);
    } catch (error) {
      toast({
        title: '오류',
        description: '섹션 추가에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 섹션 수정
  const handleUpdateSection = async (sectionData: Partial<Section>) => {
    if (!editingSection) return;

    try {
      const response = await fetch(`/api/admin/product-guides/${guide.id}/sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: editingSection.id,
          ...sectionData,
        }),
      });

      if (!response.ok) throw new Error('섹션 수정 실패');

      const updatedSection = await response.json();
      onUpdate({
        ...guide,
        sections: sections.map(s => s.id === updatedSection.id ? updatedSection : s),
      });

      toast({
        title: '성공',
        description: '섹션이 수정되었습니다',
      });

      setEditingSection(null);
      setShowSectionForm(false);
    } catch (error) {
      toast({
        title: '오류',
        description: '섹션 수정에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 섹션 삭제
  const handleDeleteSection = async (section: Section) => {
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(
        `/api/admin/product-guides/${guide.id}/sections?section_id=${section.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('섹션 삭제 실패');

      onUpdate({
        ...guide,
        sections: sections.filter(s => s.id !== section.id),
      });

      toast({
        title: '성공',
        description: '섹션이 삭제되었습니다',
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '섹션 삭제에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 섹션 순서 변경
  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    newSections.forEach((s, i) => s.display_order = i);
    onUpdate({ ...guide, sections: newSections });
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    newSections.forEach((s, i) => s.display_order = i);
    onUpdate({ ...guide, sections: newSections });
  };

  return (
    <div className="space-y-6">
      {/* 가이드 기본 정보 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">기본 정보</h2>
          <div className="flex items-center gap-2">
            <Label>활성화</Label>
            <Switch
              checked={guide.is_active}
              onCheckedChange={(checked) => onUpdate({ ...guide, is_active: checked })}
            />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>제목</Label>
            <Input
              value={guide.title}
              onChange={(e) => onUpdate({ ...guide, title: e.target.value })}
              placeholder="가이드 제목"
            />
          </div>
          <div>
            <Label>상품 키</Label>
            <Input value={guide.product_key} disabled className="bg-muted" />
          </div>
          <div className="md:col-span-2">
            <Label>설명</Label>
            <Textarea
              value={guide.description || ''}
              onChange={(e) => onUpdate({ ...guide, description: e.target.value })}
              placeholder="가이드 설명"
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* 섹션 목록 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">섹션 관리</h2>
          <Button
            onClick={() => {
              setEditingSection(null);
              setShowSectionForm(true);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            섹션 추가
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {sections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>등록된 섹션이 없습니다</p>
                <p className="text-sm">위의 &quot;섹션 추가&quot; 버튼을 눌러 시작하세요</p>
              </div>
            ) : (
              sections.map((section, index) => (
                <Card key={section.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSectionDown(index)}
                        disabled={index === sections.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{section.section_type}</Badge>
                        <h3 className="font-semibold truncate">{section.title}</h3>
                        {!section.is_active && (
                          <Badge variant="outline">비활성</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {section.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSection(section);
                          setShowSectionForm(true);
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-2">
        <Button onClick={onSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>

      {/* 섹션 폼 다이얼로그 */}
      {showSectionForm && (
        <SectionForm
          section={editingSection}
          onSave={editingSection ? handleUpdateSection : handleAddSection}
          onCancel={() => {
            setShowSectionForm(false);
            setEditingSection(null);
          }}
        />
      )}
    </div>
  );
}

