'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PointManagementDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PointManagementDialog({
  client,
  open,
  onOpenChange,
}: PointManagementDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePointTransaction = async (
    type: 'charge' | 'deduct',
    amount: number,
    description: string
  ) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/clients/${client.id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount, description }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '포인트 처리에 실패했습니다.');
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError('포인트 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    type: 'charge' | 'deduct'
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseInt(formData.get('amount') as string);
    const description = formData.get('description') as string;

    if (!amount || amount <= 0) {
      setError('올바른 포인트 금액을 입력해주세요.');
      return;
    }

    if (type === 'deduct' && amount > client.points) {
      setError('차감할 포인트가 보유 포인트보다 많습니다.');
      return;
    }

    await handlePointTransaction(type, amount, description);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-base sm:text-lg">포인트 관리</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {client.company_name} (현재 포인트: {client.points.toLocaleString()} P)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="charge" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8 sm:h-9">
            <TabsTrigger value="charge" className="text-xs sm:text-sm">충전</TabsTrigger>
            <TabsTrigger value="deduct" className="text-xs sm:text-sm">차감</TabsTrigger>
          </TabsList>

          <TabsContent value="charge" className="space-y-3 sm:space-y-4">
            <form onSubmit={(e) => handleSubmit(e, 'charge')}>
              <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="charge-amount" className="text-xs sm:text-sm">
                    충전 포인트 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="charge-amount"
                    name="amount"
                    type="number"
                    min="1"
                    placeholder="충전할 포인트"
                    required
                    disabled={loading}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>

                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="charge-description" className="text-xs sm:text-sm">사유</Label>
                  <Textarea
                    id="charge-description"
                    name="description"
                    placeholder="충전 사유를 입력하세요"
                    disabled={loading}
                    className="text-xs sm:text-sm min-h-[60px] sm:min-h-[80px]"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md mb-3 sm:mb-4">
                  {error}
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                >
                  취소
                </Button>
                <Button type="submit" disabled={loading} className="h-8 sm:h-9 text-xs sm:text-sm">
                  {loading ? '처리 중...' : '충전'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="deduct" className="space-y-3 sm:space-y-4">
            <form onSubmit={(e) => handleSubmit(e, 'deduct')}>
              <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="deduct-amount" className="text-xs sm:text-sm">
                    차감 포인트 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="deduct-amount"
                    name="amount"
                    type="number"
                    min="1"
                    max={client.points}
                    placeholder="차감할 포인트"
                    required
                    disabled={loading}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    최대: {client.points.toLocaleString()} P
                  </p>
                </div>

                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="deduct-description" className="text-xs sm:text-sm">사유</Label>
                  <Textarea
                    id="deduct-description"
                    name="description"
                    placeholder="차감 사유를 입력하세요"
                    disabled={loading}
                    className="text-xs sm:text-sm min-h-[60px] sm:min-h-[80px]"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md mb-3 sm:mb-4">
                  {error}
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={loading}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                >
                  {loading ? '처리 중...' : '차감'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
