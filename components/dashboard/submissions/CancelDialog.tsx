import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UnifiedSubmission } from '@/types/submission';

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: UnifiedSubmission | null;
  onConfirm: () => Promise<void>;
}

export function CancelDialog({ open, onOpenChange, submission, onConfirm }: CancelDialogProps) {
  const [agreed, setAgreed] = useState(false);

  const handleClose = () => {
    setAgreed(false);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!agreed) {
      alert('동의하지 않으면 중단 요청을 할 수 없습니다.');
      return;
    }
    await onConfirm();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>작업 중단 확인</DialogTitle>
          <DialogDescription>
            {submission?.product_type === 'place'
              ? '작업 중단은 가능하나, 환불은 어렵습니다.'
              : '이미 예약 구동된 수량 제외 남은 건에 대해 환불이 진행됩니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label
              htmlFor="agree"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              동의합니다
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            동의하지 않습니다
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!agreed}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            중단 신청
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

