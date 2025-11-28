'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Wallet, TrendingUp } from 'lucide-react';
import { ChargeRequestDialog } from './charge-request-dialog';
import { motion } from 'framer-motion';

export function PointsPageHeader() {
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 포인트 조회
    fetch('/api/client/profile')
      .then(res => res.json())
      .then(data => {
        setCurrentPoints(data.points || 0);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

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
      </div>

      <ChargeRequestDialog
        open={chargeDialogOpen}
        onOpenChange={setChargeDialogOpen}
      />
    </>
  );
}

