/**
 * [DISABLED] 상품 생성 다이얼로그 - 비활성화됨 (2025-11-02)
 * 이유: 4가지 고정 상품만 사용, 동적 상품 추가 불필요
 */
/*
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Wand2 } from 'lucide-react';
import { FormSchemaBuilder } from '@/components/form-schema-builder';
import type { FormSchema } from '@/types/form-schema';

interface CreateProductDialogProps {
  onSuccess: () => void;
}

const DEFAULT_FORM_SCHEMA: FormSchema = {
  fields: [
    {
      name: 'company_name',
      label: '업체명',
      type: 'text',
      required: true,
      placeholder: '업체명을 입력하세요',
    },
    {
      name: 'count',
      label: '수량',
      type: 'number',
      required: true,
      validation: { min: 1 },
      defaultValue: 1,
    },
    {
      name: 'notes',
      label: '비고',
      type: 'textarea',
      required: false,
      placeholder: '추가 요청사항',
    },
  ],
  calculation: {
    formula: 'pricePerUnit * count',
    variables: ['pricePerUnit', 'count'],
  },
};

export function CreateProductDialog({ onSuccess }: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true,
  });
  const [formSchema, setFormSchema] = useState<FormSchema>(DEFAULT_FORM_SCHEMA);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (formSchema.fields.length === 0) {
      setError('최소 1개의 필드가 필요합니다');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          form_schema: formSchema,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '상품 생성에 실패했습니다.');
      }

      setFormData({
        name: '',
        slug: '',
        description: '',
        is_active: true,
      });
      setFormSchema(DEFAULT_FORM_SCHEMA);
      setOpen(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          상품 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 상품 추가</DialogTitle>
            <DialogDescription>
              새로운 상품 카테고리를 추가합니다.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm mt-4">
              {error}
            </div>
          )}

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">기본 정보</TabsTrigger>
              <TabsTrigger value="schema">
                <Wand2 className="w-4 h-4 mr-2" />
                접수 양식
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">상품명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="예: 플레이스 유입"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">상품 코드 *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="예: place-traffic"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  영문 소문자, 숫자, 하이픈(-)만 사용 가능
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="상품에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">활성 상태</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="schema" className="mt-4">
              <FormSchemaBuilder value={formSchema} onChange={setFormSchema} />
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading || formSchema.fields.length === 0}>
              {loading ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
*/
