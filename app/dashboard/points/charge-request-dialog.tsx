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
import { Copy, Check, Building2, CreditCard, User, ArrowRight } from 'lucide-react';

interface ChargeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 입금 계좌 정보
const BANK_ACCOUNT = {
  bank: '신한은행',
  account: '110-613-141483',
  holder: '센스애드(문주영)',
};

// VAT 계산 (10%)
const calculateWithVAT = (amount: number) => Math.round(amount * 1.1);

export function ChargeRequestDialog({
  open,
  onOpenChange,
}: ChargeRequestDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBankInfo, setShowBankInfo] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState<number>(0);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

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

      // 성공 시 계좌 안내 화면으로 전환
      setRequestedAmount(amount);
      setShowBankInfo(true);
    } catch (err) {
      const errorMsg = '충전 요청 중 오류가 발생했습니다.';
      setError(errorMsg);
      toast({
        title: "충전 요청 실패",
        description: errorMsg,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, accountType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccount(accountType);
      toast({
        title: "복사 완료",
        description: "계좌번호가 클립보드에 복사되었습니다.",
        duration: 2000,
      });
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (err) {
      toast({
        title: "복사 실패",
        description: "복사에 실패했습니다. 직접 복사해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setShowBankInfo(false);
    setRequestedAmount(0);
    setError('');
    onOpenChange(false);
    router.refresh();
  };

  // 계좌 안내 화면
  if (showBankInfo) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto p-0">
          {/* 헤더 영역 - 그라데이션 배경 */}
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">충전 요청 완료</h3>
                <p className="text-sky-100 text-sm">아래 계좌로 입금해주세요</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sky-100 text-sm">요청 금액</span>
                <span className="text-lg text-sky-100">{requestedAmount.toLocaleString()}원</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/20 pt-2">
                <span className="text-sky-100 text-sm">VAT 포함 입금액</span>
                <span className="text-2xl font-bold">{calculateWithVAT(requestedAmount).toLocaleString()}원</span>
              </div>
            </div>
          </div>

          {/* 계좌 정보 영역 */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 text-center mb-4">
              아래 계좌로 입금해주세요
            </p>

            {/* 입금 계좌 */}
            <div className="group relative p-4 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-white to-sky-50 transition-all duration-300 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{BANK_ACCOUNT.bank}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-bold text-gray-900 tracking-wide">
                      {BANK_ACCOUNT.account}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(BANK_ACCOUNT.account, 'main')}
                    className="h-8 px-3 text-xs gap-1.5 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300"
                  >
                    {copiedAccount === 'main' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        복사
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{BANK_ACCOUNT.holder}</span>
                </div>
              </div>
            </div>

            {/* 안내 문구 */}
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
              <p className="text-xs text-gray-600 leading-relaxed text-center">
                <span className="font-semibold text-sky-700">VAT 포함 금액</span>으로 입금해주세요.
                <br />
                입금 확인 후 <span className="font-semibold text-sky-600">영업일 기준 1일 이내</span>로 포인트가 충전됩니다.
                <br />
                입금자명은 <span className="font-semibold">회사명 또는 본인 성함</span>으로 해주세요.
              </p>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="px-6 pb-6">
            <Button
              onClick={handleClose}
              className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-all duration-300"
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 충전 요청 폼
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
              className="h-8 sm:h-9 text-xs sm:text-sm gap-1.5"
            >
              {loading ? '처리 중...' : (
                <>
                  충전 요청
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
