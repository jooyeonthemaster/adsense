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

interface DeleteClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteClientDialog({ client, open, onOpenChange }: DeleteClientDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '거래처 삭제에 실패했습니다.');
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError('거래처 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-base sm:text-lg">거래처 삭제</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            정말로 이 거래처를 삭제하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 sm:py-4">
          <div className="rounded-md bg-destructive/10 p-3 sm:p-4 space-y-1.5 sm:space-y-2">
            <p className="text-xs sm:text-sm font-medium">삭제할 거래처 정보:</p>
            <p className="text-xs sm:text-sm">
              <span className="font-medium">아이디:</span> {client.username}
            </p>
            <p className="text-xs sm:text-sm">
              <span className="font-medium">회사명:</span> {client.company_name}
            </p>
            <p className="text-xs sm:text-sm text-destructive font-medium mt-2 sm:mt-3">
              ⚠️ 이 작업은 되돌릴 수 없습니다. 관련된 모든 데이터가 함께 삭제됩니다.
            </p>
          </div>
        </div>

        {error && (
          <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md">
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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="h-8 sm:h-9 text-xs sm:text-sm"
          >
            {loading ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
