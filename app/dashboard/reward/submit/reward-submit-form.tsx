'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, CalendarIcon, AlertCircle } from 'lucide-react';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRewardSubmit } from '@/hooks/dashboard/useRewardSubmit';
import type { RewardSubmitFormProps } from '@/components/dashboard/reward-submit';
import { RewardMediaSelector } from '@/components/dashboard/reward-submit';

export default function RewardSubmitForm({ initialPoints }: RewardSubmitFormProps) {
  const {
    formData,
    setFormData,
    isSubmitting,
    pricing,
    activeMediaConfigs,
    noActiveProducts,
    loadingPrice,
    loadingBusinessName,
    operationDays,
    isPriceConfigured,
    minStartDate,
    isWeekendSubmission,
    totalCost,
    handlePlaceUrlChange,
    handleSubmit,
  } = useRewardSubmit(initialPoints);

  // 활성화된 리워드 상품이 없는 경우
  if (noActiveProducts) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">현재 이용 가능한 서비스가 없습니다</h2>
          <p className="text-gray-600">리워드 서비스가 일시적으로 중단되었습니다.</p>
          <p className="text-gray-600">관리자에게 문의해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* 관리자가 편집 가능한 서비스 안내 */}
        <ProductGuideSection productKey="reward" />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 상단 2열 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 왼쪽 열 */}
            <div className="space-y-4">
              {/* 리워드 매체 선택 */}
              <RewardMediaSelector
                mediaConfigs={activeMediaConfigs}
                selectedMedia={formData.mediaType}
                onMediaChange={(media) => setFormData(prev => ({ ...prev, mediaType: media }))}
                pricing={pricing}
              />

              {/* 업체 정보 */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 text-base">업체 정보</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">업체명과 플레이스 링크를 입력하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-0">
                  {/* 업체명 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="businessName" className="text-xs font-medium text-gray-700">
                      업체명 <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="businessName"
                        type="text"
                        value={formData.businessName}
                        readOnly
                        placeholder="플레이스 링크 입력 시 자동 입력됩니다"
                        className="border-gray-200 bg-gray-50 h-9 text-sm cursor-not-allowed"
                      />
                      {loadingBusinessName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="h-4 w-4 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 플레이스 링크 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="placeUrl" className="text-xs font-medium text-gray-700">
                      플레이스 링크 <span className="text-rose-500">*</span>
                    </Label>
                    <div className="space-y-1.5">
                      <Input
                        id="placeUrl"
                        type="url"
                        value={formData.placeUrl}
                        onChange={handlePlaceUrlChange}
                        placeholder="https://m.place.naver.com/place/..."
                        className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                      />
                      {formData.placeMid && (
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-xs text-emerald-700">
                            MID: {formData.placeMid} (자동 추출됨)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽 열: 접수 정보 */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base">접수 정보</CardTitle>
                <CardDescription className="text-gray-600 text-sm">일 접수량과 구동일수를 입력하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {/* 일 접수량 */}
                <div className="space-y-1.5">
                  <Label htmlFor="dailyVolume" className="text-xs font-medium text-gray-700">
                    일 접수량 (최소 100타) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="dailyVolume"
                    type="number"
                    step="100"
                    value={formData.dailyVolume}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailyVolume: Number(e.target.value) }))}
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                  <span className="text-xs text-gray-500">100단위로 입력 (100, 200, 300...)</span>
                </div>

                {/* 구동 시작일 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    구동 시작일 <span className="text-rose-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full h-9 justify-start text-left font-normal border-gray-200 ${
                          !formData.startDate && 'text-muted-foreground'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(formData.startDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
                        ) : (
                          <span>시작일을 선택하세요</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate || undefined}
                        onSelect={(date) => {
                          setFormData(prev => ({
                            ...prev,
                            startDate: date || null,
                            endDate: null, // 시작일 변경 시 마감일 초기화
                          }));
                        }}
                        disabled={(date) => {
                          // minStartDate 이전 날짜는 선택 불가
                          return date < minStartDate;
                        }}
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-xs text-gray-500">
                    {isWeekendSubmission
                      ? `주말 접수 확인 불가로 인해 ${format(minStartDate, 'M월 d일 (EEE)', { locale: ko })}부터 가능`
                      : '내일부터 선택 가능'}
                  </span>
                </div>

                {/* 구동 마감일 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    구동 마감일 <span className="text-rose-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={!formData.startDate}
                        className={`w-full h-9 justify-start text-left font-normal border-gray-200 ${
                          !formData.endDate && 'text-muted-foreground'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? (
                          format(formData.endDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
                        ) : (
                          <span>{formData.startDate ? '마감일을 선택하세요' : '시작일을 먼저 선택하세요'}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date || null }))}
                        disabled={(date) => {
                          if (!formData.startDate) return true;
                          // 시작일+2일(최소 3일) ~ 시작일+6일(최대 7일)까지만 선택 가능
                          const minDate = addDays(formData.startDate, 2);
                          const maxDate = addDays(formData.startDate, 6);
                          return date < minDate || date > maxDate;
                        }}
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-xs text-gray-500">
                    {formData.startDate
                      ? `시작일로부터 최소 3일 ~ 최대 7일까지 선택 가능`
                      : '시작일을 먼저 선택해주세요'}
                  </span>
                </div>

                {/* 구동일수 표시 */}
                {operationDays > 0 && (
                  <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-sky-800">총 구동일수</span>
                      <span className="text-lg font-bold text-sky-600">{operationDays}일</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 하단 전체 확장: 결제 정보 */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 text-base">결제 정보</CardTitle>
              <CardDescription className="text-gray-600 text-sm">예상 비용을 확인하고 접수하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 gap-3">
                {/* 예상 비용 */}
                <div className="p-3 rounded-lg bg-sky-500 shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">예상 비용</span>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs px-2 py-0">
                        총 {(formData.dailyVolume * operationDays).toLocaleString()}타
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">
                        {totalCost.toLocaleString()}
                      </span>
                      <span className="text-sm text-white/90">P</span>
                    </div>
                    <div className="text-xs text-white/80">
                      일 {formData.dailyVolume.toLocaleString()}타 × {operationDays}일
                      {formData.startDate && formData.endDate && (
                        <span className="ml-2">
                          ({format(formData.startDate, 'M/d', { locale: ko })} ~ {format(formData.endDate, 'M/d', { locale: ko })})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 접수 신청 버튼 */}
              {!isPriceConfigured && !loadingPrice && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  ⚠️ 가격이 설정되지 않았습니다. 관리자에게 문의하세요.
                </div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !isPriceConfigured || loadingPrice}
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
        </form>
      </div>
    </div>
  );
}
