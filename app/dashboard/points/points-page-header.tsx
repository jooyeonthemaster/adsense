'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Wallet, TrendingUp, Clock } from 'lucide-react';
import { ChargeRequestDialog } from './charge-request-dialog';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface ChargeRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// VAT 계산 (10%)
const calculateWithVAT = (amount: number) => Math.round(amount * 1.1);

export function PointsPageHeader() {
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ChargeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    // 현재 포인트 조회
    fetch('/api/client/profile')
      .then(res => res.json())
      .then(data => {
        setCurrentPoints(data.points || 0);
      })
      .catch(() => {});

    // 대기 중인 충전 요청 조회
    fetch('/api/client/charge-requests')
      .then(res => res.json())
      .then(data => {
        const pending = (data.chargeRequests || []).filter(
          (r: ChargeRequest) => r.status === 'pending'
        );
        setPendingRequests(pending);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDialogClose = (open: boolean) => {
    setChargeDialogOpen(open);
    if (!open) {
      // 다이얼로그 닫힐 때 데이터 새로고침
      fetchData();
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">포인트 관리</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            포인트 충전 및 사용 내역을 확인할 수 있습니다
          </p>
        </div>

        {/* 포인트 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            
            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* 좌측: 포인트 정보 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-3 shadow-lg shadow-primary/30">
                      <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base text-muted-foreground font-medium">보유 포인트</p>
                      {loading ? (
                        <div className="h-10 w-48 bg-muted animate-pulse rounded-md mt-1" />
                      ) : (
                        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mt-1 tracking-tight">
                          {currentPoints?.toLocaleString() || '0'} <span className="text-2xl sm:text-3xl lg:text-4xl">P</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>충전 요청 시 관리자 승인 후 즉시 반영됩니다</span>
                  </div>
                </div>

                {/* 우측: 충전 버튼 */}
                <div className="flex flex-col gap-3 lg:items-end">
                  <Button
                    onClick={() => setChargeDialogOpen(true)}
                    size="lg"
                    className="w-full lg:w-auto gradient-primary hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300 h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-bold group"
                  >
                    <Plus className="h-6 w-6 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    포인트 충전하기
                  </Button>
                  <p className="text-xs text-center lg:text-right text-muted-foreground">
                    필요한 금액을 요청하세요
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 대기 중인 충전 요청 */}
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">대기 중인 충전 요청</h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    {pendingRequests.length}건
                  </Badge>
                </div>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-background rounded-lg border border-primary/20"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">요청 금액</span>
                          <span className="font-semibold">{request.amount.toLocaleString()}원</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">VAT 포함 입금액</span>
                          <span className="font-bold text-primary">{calculateWithVAT(request.amount).toLocaleString()}원</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          승인 대기중
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * 입금 확인 후 영업일 기준 1일 이내 포인트가 충전됩니다
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <ChargeRequestDialog
        open={chargeDialogOpen}
        onOpenChange={handleDialogClose}
      />
    </>
  );
}

