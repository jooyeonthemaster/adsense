import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { ServiceConfig } from '@/types/experience/service-types';

interface PaymentInfoProps {
  teamCount: number;
  totalCost: number;
  selectedService: ServiceConfig | undefined;
  isSubmitting: boolean;
}

export function PaymentInfo({
  teamCount,
  totalCost,
  selectedService,
  isSubmitting,
}: PaymentInfoProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 text-base">결제 정보</CardTitle>
        <CardDescription className="text-gray-600 text-sm">예상 비용을 확인하고 접수하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 gap-3">
          {/* 희망 팀수 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-xs font-medium text-gray-700">희망 팀수</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">{teamCount}</span>
              <span className="text-xs text-gray-600">팀</span>
            </div>
          </div>

          {/* 예상 비용 */}
          <div className="p-3 rounded-lg bg-sky-500 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">예상 비용</span>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs px-2 py-0">
                  {teamCount}팀
                </Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">
                  {totalCost.toLocaleString()}
                </span>
                <span className="text-sm text-white/90">P</span>
              </div>
              <div className="text-xs text-white/80">
                팀당 {selectedService?.pricePerTeam.toLocaleString()}P
              </div>
            </div>
          </div>

          {/* 서비스 정보 */}
          {selectedService && (
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-start gap-3">
                {(() => {
                  const Icon = selectedService.icon;
                  return (
                    <div className={`p-2 rounded-lg ${selectedService.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  );
                })()}
                <div className="flex-1 space-y-1">
                  <span className="text-xs font-medium text-gray-600">선택 서비스</span>
                  <div className="text-lg font-bold text-gray-900 break-words">
                    {selectedService.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedService.description}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 접수 신청 버튼 */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              접수 중...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              접수 신청하기
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

