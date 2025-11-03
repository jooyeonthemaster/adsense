'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client, ProductCategory, ClientProductPrice } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface PricingFormProps {
  clientId: string;
  client: Client;
  categories: ProductCategory[];
  existingPrices: (ClientProductPrice & { product_categories: ProductCategory })[];
}

export function PricingForm({
  clientId,
  categories,
  existingPrices,
}: PricingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        body: JSON.stringify({ prices }),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => {
          const existingPrice = existingPriceMap.get(category.id);
          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor={`price_${category.id}`}>단가 (포인트)</Label>
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
                  <Label htmlFor={`visible_${category.id}`}>
                    거래처에 표시
                  </Label>
                  <Switch
                    id={`visible_${category.id}`}
                    name={`visible_${category.id}`}
                    defaultChecked={existingPrice?.is_visible ?? true}
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
