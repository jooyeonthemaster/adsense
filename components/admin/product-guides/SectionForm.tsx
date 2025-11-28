'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPickerComponent } from './ColorPickerComponent';
import { ImageUploader } from './ImageUploader';

interface GuideImage {
  url: string;
  mobile_url?: string;
  link?: string;
  alt?: string;
}

interface Section {
  id: string;
  section_type: string;
  title: string;
  content: string;
  icon: string;
  is_collapsible: boolean;
  is_expanded_default: boolean;
  is_active: boolean;
  bg_color?: string;
  text_color?: string;
  images?: GuideImage[];
  image_layout?: string;
}

interface SectionFormProps {
  section: Section | null;
  onSave: (data: Partial<Section>) => void;
  onCancel: () => void;
}

const SECTION_TYPES = [
  { value: 'features', label: '서비스 특징', icon: 'CheckCircle', color: 'bg-blue-50' },
  { value: 'notice', label: '주요 공지', icon: 'AlertCircle', color: 'bg-yellow-50' },
  { value: 'pricing', label: '요금 안내', icon: 'DollarSign', color: 'bg-green-50' },
  { value: 'steps', label: '점수 가이드', icon: 'ListOrdered', color: 'bg-purple-50' },
  { value: 'faq', label: 'FAQ', icon: 'HelpCircle', color: 'bg-orange-50' },
  { value: 'warning', label: '주의사항', icon: 'AlertTriangle', color: 'bg-red-50' },
  { value: 'custom', label: '사용자 정의', icon: 'FileText', color: 'bg-gray-50' },
];

export function SectionForm({ section, onSave, onCancel }: SectionFormProps) {
  const [formData, setFormData] = useState({
    section_type: section?.section_type || 'custom',
    title: section?.title || '',
    content: section?.content || '',
    icon: section?.icon || '',
    is_collapsible: section?.is_collapsible ?? true,
    is_expanded_default: section?.is_expanded_default ?? false,
    is_active: section?.is_active ?? true,
    bg_color: section?.bg_color || '',
    text_color: section?.text_color || '',
    images: section?.images || [] as GuideImage[],
    image_layout: section?.image_layout || 'grid',
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용은 필수입니다');
      return;
    }
    onSave(formData);
  };

  // 섹션 타입 변경 시 기본 템플릿 적용
  const handleTypeChange = (type: string) => {
    const typeConfig = SECTION_TYPES.find(t => t.value === type);
    setFormData({
      ...formData,
      section_type: type,
      icon: typeConfig?.icon || '',
      bg_color: typeConfig?.color || '',
    });
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {section ? '섹션 수정' : '새 섹션 추가'}
          </DialogTitle>
          <DialogDescription>
            서비스 안내 섹션의 내용을 입력하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>섹션 타입 *</Label>
              <Select
                value={formData.section_type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>제목 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="섹션 제목"
              />
            </div>
          </div>

          {/* 내용 */}
          <div>
            <Label>내용 * (HTML 지원)</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="섹션 내용을 입력하세요. HTML 태그를 사용할 수 있습니다."
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              HTML 사용 예: &lt;ul&gt;&lt;li&gt;항목 1&lt;/li&gt;&lt;li&gt;항목 2&lt;/li&gt;&lt;/ul&gt;
            </p>
          </div>

          {/* 옵션 */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between space-x-2">
              <Label>접기/펴기 가능</Label>
              <Switch
                checked={formData.is_collapsible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_collapsible: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label>기본으로 펼쳐짐</Label>
              <Switch
                checked={formData.is_expanded_default}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_expanded_default: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label>활성화</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          {/* 스타일 & 이미지 */}
          <Tabs defaultValue="style" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="style">색상 설정</TabsTrigger>
              <TabsTrigger value="images">이미지 추가</TabsTrigger>
            </TabsList>
            
            <TabsContent value="style" className="mt-4">
              <ColorPickerComponent
                bgColor={formData.bg_color || ''}
                textColor={formData.text_color || ''}
                onChange={(bg, text) => setFormData({ ...formData, bg_color: bg, text_color: text })}
              />
            </TabsContent>
            
            <TabsContent value="images" className="mt-4 space-y-4">
              {/* 이미지 레이아웃 선택 */}
              <div>
                <Label>이미지 레이아웃</Label>
                <Select
                  value={formData.image_layout}
                  onValueChange={(value) => setFormData({ ...formData, image_layout: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                        <span>배너형 (전체 너비, 1장)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="grid">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <div className="w-3 h-3 bg-purple-500 rounded"></div>
                          <div className="w-3 h-3 bg-pink-500 rounded"></div>
                        </div>
                        <span>그리드형 (2-3열)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gallery">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded"></div>
                        <span>갤러리형 (슬라이드)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inline">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>인라인형 (텍스트 사이)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.image_layout === 'banner' && '전체 너비를 사용하는 큰 배너 이미지 (1장 권장)'}
                  {formData.image_layout === 'grid' && '2-3열 그리드로 여러 이미지 표시'}
                  {formData.image_layout === 'gallery' && '좌우 스크롤 가능한 갤러리'}
                  {formData.image_layout === 'inline' && '텍스트와 함께 인라인으로 표시'}
                </p>
              </div>

              <ImageUploader
                images={formData.images}
                onChange={(imgs) => setFormData({ ...formData, images: imgs })}
              />
            </TabsContent>
          </Tabs>

          {/* 미리보기 */}
          <div>
            <Label>미리보기</Label>
            <div className={`p-4 rounded-lg border ${formData.bg_color || 'bg-gray-50'} ${formData.text_color || ''}`}>
              <h3 className="font-semibold mb-2">{formData.title || '제목을 입력하세요'}</h3>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.content || '<p>내용을 입력하세요</p>' }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={handleSubmit}>
            {section ? '수정' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

