'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';

interface ChargeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChargeRequestDialog({
  open,
  onOpenChange,
}: ChargeRequestDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const amount = parseInt(formData.get('amount') as string);
    const description = formData.get('description') as string;

    if (!amount || amount <= 0) {
      setError('올바른 충전 금액을 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/client/charge-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '충전 요청에 실패했습니다.');
        return;
      }

      // 성공 토스트 표시
      toast({
        title: "✅ 충전 요청이 접수되었습니다!",
        description: "영업일 기준 1일 이내로 확인 후 처리됩니다. 승인 시 자동으로 포인트가 충전됩니다.",
        duration: 5000,
      });

      // 다이얼로그 닫기 및 페이지 새로고침
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      const errorMsg = '충전 요청 중 오류가 발생했습니다.';
      setError(errorMsg);
      toast({
        title: "❌ 충전 요청 실패",
        description: errorMsg,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-base sm:text-lg">포인트 충전 요청</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            충전하실 포인트 금액을 입력해주세요. 관리자 승인 후 충전됩니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="amount" className="text-xs sm:text-sm">
                충전 금액 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="1"
                placeholder="충전할 포인트 (예: 100000)"
                required
                disabled={loading}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                원하는 금액을 자유롭게 입력하세요
              </p>
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="description" className="text-xs sm:text-sm">
                요청 사유 (선택)
              </Label>
              <Textarea
                id="description"
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
            <Button 
              type="submit" 
              disabled={loading} 
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              {loading ? '처리 중...' : '충전 요청'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

