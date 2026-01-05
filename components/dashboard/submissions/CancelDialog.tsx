'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertCircle, Calculator } from 'lucide-react';
import { UnifiedSubmission } from '@/types/submission';

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: UnifiedSubmission | null;
  onConfirm: (reason?: string) => Promise<void>;
}

// 상품별 수수료율 (현재 모두 0%)
const SERVICE_FEES: Record<string, number> = {
  blog: 0,
  cafe: 0,
  kakaomap: 0,
  receipt: 0,
  place: 0,
};

// 상품 유형 레이블
const PRODUCT_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '네이버 영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
  cafe: '카페 마케팅',
};

export function CancelDialog({ open, onOpenChange, submission, onConfirm }: CancelDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [refundPreview, setRefundPreview] = useState<{
    progressRate: number;
    completedCount: number;
    totalCount: number;
    calculatedRefund: number;
  } | null>(null);

  // 다이얼로그 열릴 때 환불 예상액 계산
  useEffect(() => {
    if (open && submission) {
      calculateRefundPreview();
    } else {
      setRefundPreview(null);
      setAgreed(false);
      setReason('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submission]);

  const calculateRefundPreview = () => {
    if (!submission) return;

    // 간단한 예상 계산 (실제 계산은 서버에서)
    const totalPoints = submission.total_points || 0;
    const totalCount = submission.daily_count && submission.total_days
      ? submission.daily_count * submission.total_days
      : submission.total_count || 0;

    // 현재 진행 상황 추정
    let completedCount = 0;
    if (submission.current_day && submission.daily_count) {
      completedCount = submission.current_day * submission.daily_count;
    }

    const progressRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const completedPoints = Math.floor(totalPoints * (progressRate / 100));
    const remainingPoints = totalPoints - completedPoints;
    const feeRate = SERVICE_FEES[submission.product_type] || 0;
    const serviceFee = Math.floor(remainingPoints * feeRate);
    const calculatedRefund = Math.max(0, remainingPoints - serviceFee);

    setRefundPreview({
      progressRate,
      completedCount,
      totalCount,
      calculatedRefund,
    });
  };

  const handleClose = () => {
    setAgreed(false);
    setReason('');
    setRefundPreview(null);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!agreed) {
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reason);
      handleClose();
    } catch (error) {
      console.error('Cancel request error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!submission) return null;

  const productLabel = PRODUCT_LABELS[submission.product_type] || submission.product_type;
  const feeRate = SERVICE_FEES[submission.product_type] || 0;
  const feePercent = Math.round(feeRate * 100);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            중단 요청
          </DialogTitle>
          <DialogDescription>
            {submission.company_name} - {productLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 안내 메시지 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              중단 요청 시 관리자 검토 후 환불이 진행됩니다.
              <br />
              진행된 작업량에 따라 환불 금액이 결정됩니다.
            </p>
          </div>

          {/* 환불 예상 금액 */}
          {refundPreview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">환불 예상 금액</span>
                <Badge variant="outline" className="text-xs">예상치</Badge>
              </div>

              <div className="bg-muted rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 결제 포인트</span>
                  <span>{submission.total_points.toLocaleString()}P</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>현재 진행률</span>
                  <span>
                    약 {Math.round(refundPreview.progressRate)}%
                    {refundPreview.totalCount > 0 && (
                      <span className="text-xs ml-1">
                        ({refundPreview.completedCount}/{refundPreview.totalCount})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>수수료율</span>
                  <span>{feePercent}%</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>예상 환불액</span>
                  <span className="text-primary">
                    약 {refundPreview.calculatedRefund.toLocaleString()}P
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                * 실제 환불 금액은 관리자 검토 후 확정됩니다.
              </p>
            </div>
          )}

          <Separator />

          {/* 사유 입력 */}
          <div className="space-y-2">
            <Label htmlFor="reason">중단 사유 (선택)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="중단 사유를 입력해 주세요..."
              className="resize-none"
              rows={2}
            />
          </div>

          {/* 동의 체크박스 */}
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label
              htmlFor="agree"
              className="text-sm leading-tight text-muted-foreground cursor-pointer"
            >
              위 내용을 확인했으며, 중단 요청에 동의합니다.
              환불 금액은 관리자 검토 후 확정됩니다.
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!agreed || loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                요청 중...
              </>
            ) : (
              '중단 요청'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
