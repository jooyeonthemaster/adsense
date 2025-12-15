'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { ReviewType, ReviewServiceConfig, VisitorFormData, KmapFormData } from '@/types/review-marketing/types';

interface PaymentInfoCardProps {
  selectedType: ReviewType;
  currentService: ReviewServiceConfig | undefined;
  totalCount: number;
  totalCost: number;
  totalDays: number;
  dailyCount: number;
  visitorFormData: VisitorFormData;
  kmapFormData: KmapFormData;
}

export function PaymentInfoCard({
  selectedType,
  currentService,
  totalCount,
  totalCost,
  totalDays,
  dailyCount,
  visitorFormData,
  kmapFormData,
}: PaymentInfoCardProps) {
  const minCount = currentService?.minCount || 10;
  const isBelowMinCount = totalCount < minCount;

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 text-base">결제 정보</CardTitle>
        <CardDescription className="text-gray-600 text-sm">예상 비용을 확인하고 접수하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 총 작업수량 */}
          <div className="space-y-1.5">
            <div
              className={`flex items-center justify-between p-3 rounded-lg ${isBelowMinCount
                ? 'bg-rose-50 border border-rose-200'
                : 'bg-gray-50 border border-gray-200'
                }`}
            >
              <span
                className={`text-xs font-medium ${isBelowMinCount ? 'text-rose-700' : 'text-gray-700'
                  }`}
              >
                총 작업수량
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-xl font-bold ${isBelowMinCount ? 'text-rose-900' : 'text-gray-900'
                    }`}
                >
                  {totalCount}
                </span>
                <span className={`text-xs ${isBelowMinCount ? 'text-rose-600' : 'text-gray-600'}`}>
                  건
                </span>
              </div>
            </div>
            {isBelowMinCount && (
              <p className="text-xs text-rose-600 px-1">⚠️ 최소 {minCount}건 이상 필요</p>
            )}
          </div>

          {/* 예상 비용 */}
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sky-700">예상 비용</span>
                <Badge
                  variant="secondary"
                  className="bg-sky-100 text-sky-700 border-0 text-xs px-2 py-0"
                >
                  {totalCount}건
                </Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-sky-900">{totalCost.toLocaleString()}</span>
                <span className="text-sm text-sky-700">P</span>
              </div>
              <div className="text-xs text-sky-600">
                일 {dailyCount}건 × {totalDays}일
              </div>
            </div>
          </div>

          {/* 옵션 정보 */}
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">옵션 정보</span>
              </div>
              <div className="space-y-0.5 text-xs text-amber-700">
                {selectedType === 'visitor' ? (
                  <>
                    <div>{visitorFormData.photoOption === 'with' ? '사진 포함' : '사진 없음'}</div>
                    <div>
                      {visitorFormData.scriptOption === 'ai' ? 'AI 제작 원고' : '지정원고'}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      {kmapFormData.hasPhoto
                        ? `사진 포함 (${kmapFormData.photoRatio}%)`
                        : '사진 없음'}
                    </div>
                    <div>{kmapFormData.scriptOption === 'ai' ? 'AI 제작 원고' : '지정원고'}</div>
                    <div>
                      별점:{' '}
                      {kmapFormData.starRating === 'mixed'
                        ? '4~5점 혼합'
                        : kmapFormData.starRating === 'five'
                          ? '5점대만'
                          : '4점대만'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
