'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { CancellationRequest } from '@/types/cancellation-request';
import { getSubmissionTypeLabel, getServiceFeeLabel } from '@/lib/refund-calculator';

interface ProcessCancellationDialogProps {
  request: CancellationRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function ProcessCancellationDialog({
  request,
  open,
  onOpenChange,
  onComplete,
}: ProcessCancellationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [finalRefund, setFinalRefund] = useState<string>('');
  const [adminResponse, setAdminResponse] = useState('');

  // 다이얼로그 열릴 때 초기값 설정
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && request) {
      setFinalRefund(request.calculated_refund.toString());
      setAdminResponse('');
    }
    onOpenChange(newOpen);
  };

  const handleProcess = async (status: 'approved' | 'rejected') => {
    if (!request) return;

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        status,
        admin_response: adminResponse || null,
      };

      if (status === 'approved') {
        const refundAmount = parseInt(finalRefund, 10);
        if (isNaN(refundAmount) || refundAmount < 0) {
          toast({
            variant: 'destructive',
            title: '오류',
            description: '유효한 환불 금액을 입력해주세요.',
          });
          setLoading(false);
          return;
        }
        body.final_refund = refundAmount;
      }

      const response = await fetch(`/api/cancellation-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '처리 중 오류가 발생했습니다.');
      }

      toast({
        title: status === 'approved' ? '승인 완료' : '거절 완료',
        description: status === 'approved'
          ? `${parseInt(finalRefund, 10).toLocaleString()}P가 환불되었습니다.`
          : '중단 요청이 거절되었습니다.',
      });

      onComplete();
    } catch (error) {
      console.error('Error processing cancellation request:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  const isProcessed = request.status !== 'pending';
  const progressPercent = Math.round(request.progress_rate);
  const completedPoints = Math.floor(request.total_points * (request.progress_rate / 100));
  const remainingPoints = request.total_points - completedPoints;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isProcessed ? (
              request.status === 'approved' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            중단 요청 {isProcessed ? '상세' : '처리'}
          </DialogTitle>
          <DialogDescription>
            {request.business_name || request.clients?.company_name || '업체명 없음'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">상품 유형</span>
              <div className="font-medium">
                <Badge variant="outline">
                  {getSubmissionTypeLabel(request.submission_type)}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">거래처</span>
              <div className="font-medium">{request.clients?.company_name || '-'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">요청일</span>
              <div className="font-medium">
                {new Date(request.created_at).toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">상태</span>
              <div>
                <Badge
                  variant={
                    request.status === 'approved'
                      ? 'secondary'
                      : request.status === 'rejected'
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {request.status === 'pending'
                    ? '대기중'
                    : request.status === 'approved'
                    ? '승인됨'
                    : '거절됨'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* 진행 상황 */}
          <div>
            <h4 className="font-medium mb-2">진행 상황</h4>
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행률</span>
                <span className="font-medium">
                  {progressPercent}% ({request.completed_count}/{request.total_count})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 환불 계산 */}
          <div>
            <h4 className="font-medium mb-2">환불 계산</h4>
            <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>총 결제 포인트</span>
                <span>{request.total_points.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>- 진행된 금액 ({progressPercent}%)</span>
                <span>-{completedPoints.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>= 미진행 금액</span>
                <span>{remainingPoints.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>- 수수료 ({getServiceFeeLabel(request.submission_type)})</span>
                <span>-{Math.floor(remainingPoints * 0.1).toLocaleString()}P</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>자동 계산 환불액</span>
                <span className="text-primary">{request.calculated_refund.toLocaleString()}P</span>
              </div>
            </div>
          </div>

          {/* 사유 */}
          {request.reason && (
            <div>
              <h4 className="font-medium mb-2">고객 사유</h4>
              <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                {request.reason}
              </p>
            </div>
          )}

          {/* 처리된 경우 관리자 응답 표시 */}
          {isProcessed && request.admin_response && (
            <div>
              <h4 className="font-medium mb-2">관리자 응답</h4>
              <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                {request.admin_response}
              </p>
            </div>
          )}

          {/* 승인된 경우 최종 환불액 표시 */}
          {isProcessed && request.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">최종 환불액</span>
                <span className="text-xl font-bold text-green-600">
                  {(request.final_refund || 0).toLocaleString()}P
                </span>
              </div>
            </div>
          )}

          {/* 대기중인 경우 처리 폼 */}
          {!isProcessed && (
            <>
              <Separator />

              <div className="space-y-3">
                <div>
                  <Label htmlFor="finalRefund">최종 환불 금액 (P)</Label>
                  <Input
                    id="finalRefund"
                    type="number"
                    value={finalRefund}
                    onChange={(e) => setFinalRefund(e.target.value)}
                    min={0}
                    max={request.total_points}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    자동 계산: {request.calculated_refund.toLocaleString()}P (수정 가능)
                  </p>
                </div>

                <div>
                  <Label htmlFor="adminResponse">관리자 메모 (선택)</Label>
                  <Textarea
                    id="adminResponse"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="처리 관련 메모를 입력하세요..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!isProcessed ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleProcess('rejected')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                거절
              </Button>
              <Button onClick={() => handleProcess('approved')} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                승인 ({parseInt(finalRefund || '0', 10).toLocaleString()}P 환불)
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
