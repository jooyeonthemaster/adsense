import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceConfig } from '@/types/blog-distribution/types';

interface PaymentInfoCardProps {
  totalCount: number;
  totalCost: number;
  selectedService: ServiceConfig | undefined;
  dailyCount: number;
  operationDays: number;
  pricingLoading: boolean;
}

export function PaymentInfoCard({
  totalCount,
  totalCost,
  selectedService,
  dailyCount,
  operationDays,
  pricingLoading,
}: PaymentInfoCardProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 text-base">결제 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* 총 작업수량 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
          <span className="text-xs font-medium text-gray-700">총 작업수량</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900">{totalCount}</span>
            <span className="text-xs text-gray-600">건</span>
          </div>
        </div>

        {/* 예상 비용 */}
        <div className="p-3 rounded-lg bg-sky-500 shadow-md">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white">예상 비용</span>
              <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs px-2 py-0">
                {totalCount}건
              </Badge>
            </div>
            {pricingLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                <span className="text-sm text-white/90">P</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">
                  {totalCost.toLocaleString()}
                </span>
                <span className="text-sm text-white/90">P</span>
              </div>
            )}
            <div className="text-xs text-white/80">
              일 {dailyCount}건 × {operationDays}일
            </div>
          </div>
        </div>

        {/* 가격 정보 */}
        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
          <div className="space-y-0.5 text-xs text-gray-700">
            {pricingLoading ? (
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div>건당 가격: {selectedService?.pricePerPost.toLocaleString()}P</div>
            )}
            <div>최소 수량: 30건 (일 3건 × 10일)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






