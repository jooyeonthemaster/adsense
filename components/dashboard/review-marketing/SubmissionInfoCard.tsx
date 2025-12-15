'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ReviewType, VisitorFormData, KmapFormData } from '@/types/review-marketing/types';

interface SubmissionInfoCardProps {
  selectedType: ReviewType;
  visitorFormData: VisitorFormData;
  kmapFormData: KmapFormData;
  loadingBusinessName: boolean;
  minStartDate: Date;
  isWeekendSubmission: boolean;
  totalDays: number;
  onVisitorChange: React.Dispatch<React.SetStateAction<VisitorFormData>>;
  onKmapChange: React.Dispatch<React.SetStateAction<KmapFormData>>;
  onNaverPlaceUrlChange: (url: string) => void;
  onKmapUrlChange: (url: string) => void;
}

export function SubmissionInfoCard({
  selectedType,
  visitorFormData,
  kmapFormData,
  loadingBusinessName,
  minStartDate,
  isWeekendSubmission,
  totalDays,
  onVisitorChange,
  onKmapChange,
  onNaverPlaceUrlChange,
  onKmapUrlChange,
}: SubmissionInfoCardProps) {
  const businessName = selectedType === 'visitor' ? visitorFormData.businessName : kmapFormData.businessName;
  const placeUrl = selectedType === 'visitor' ? visitorFormData.placeUrl : kmapFormData.kmapUrl;
  const dailyCount = selectedType === 'visitor' ? visitorFormData.dailyCount : kmapFormData.dailyCount;
  const startDate = selectedType === 'visitor' ? visitorFormData.startDate : kmapFormData.startDate;
  const endDate = selectedType === 'visitor' ? visitorFormData.endDate : kmapFormData.endDate;

  const handleBusinessNameChange = (value: string) => {
    if (selectedType === 'visitor') {
      onVisitorChange((prev) => ({ ...prev, businessName: value }));
    } else {
      onKmapChange((prev) => ({ ...prev, businessName: value }));
    }
  };

  const handleDailyCountChange = (value: number) => {
    if (selectedType === 'visitor') {
      onVisitorChange((prev) => ({ ...prev, dailyCount: value }));
    } else {
      onKmapChange((prev) => ({ ...prev, dailyCount: value }));
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (selectedType === 'visitor') {
      onVisitorChange((prev) => ({
        ...prev,
        startDate: date || null,
        endDate: date && prev.endDate && date > prev.endDate ? null : prev.endDate,
      }));
    } else {
      onKmapChange((prev) => ({
        ...prev,
        startDate: date || null,
        endDate: date && prev.endDate && date > prev.endDate ? null : prev.endDate,
      }));
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (selectedType === 'visitor') {
      onVisitorChange((prev) => ({ ...prev, endDate: date || null }));
    } else {
      onKmapChange((prev) => ({ ...prev, endDate: date || null }));
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 text-base">접수 정보</CardTitle>
        <CardDescription className="text-gray-600 text-sm">필수 정보를 입력해주세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        {/* 업체명 */}
        <div className="space-y-1.5">
          <Label htmlFor="businessName" className="text-xs font-medium text-gray-700 flex items-center gap-2">
            업체명 <span className="text-rose-500">*</span>
            {loadingBusinessName && (
              <span className="flex items-center gap-1 text-sky-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">불러오는 중...</span>
              </span>
            )}
          </Label>
          <Input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            placeholder="업체명을 입력하세요"
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-9 text-sm"
            disabled={loadingBusinessName}
          />
        </div>

        {/* 플레이스 링크 */}
        <div className="space-y-1.5">
          <Label htmlFor="placeUrl" className="text-xs font-medium text-gray-700">
            {selectedType === 'visitor' ? '네이버 플레이스 링크' : '카카오맵 링크'}{' '}
            <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="placeUrl"
            type="url"
            value={placeUrl}
            onChange={(e) => {
              if (selectedType === 'visitor') {
                onNaverPlaceUrlChange(e.target.value);
              } else {
                onKmapUrlChange(e.target.value);
              }
            }}
            placeholder={
              selectedType === 'visitor'
                ? 'https://m.place.naver.com/place/...'
                : 'https://place.map.kakao.com/...'
            }
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-9 text-sm"
          />
          {selectedType === 'visitor' && visitorFormData.placeMid && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs text-emerald-700">MID: {visitorFormData.placeMid} (자동 추출됨)</span>
            </div>
          )}
          {selectedType === 'kmap' && (
            <span className="text-xs text-gray-500">카카오맵 URL 입력 시 업체명이 자동으로 입력됩니다</span>
          )}
        </div>

        {/* 일 발행수량 */}
        <div className="space-y-1.5">
          <Label htmlFor="dailyCount" className="text-xs font-medium text-gray-700">
            일 발행수량 {selectedType === 'visitor' ? '(1~10건)' : '(최소 1건)'}{' '}
            <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="dailyCount"
            type="number"
            min="1"
            max={selectedType === 'visitor' ? 10 : undefined}
            value={dailyCount}
            onChange={(e) => handleDailyCountChange(Number(e.target.value))}
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-9 text-sm"
          />
          <span className="text-xs text-gray-500">
            {selectedType === 'visitor' ? '최소 1건, 최대 10건' : '최소 1건, 최대 제한 없음'}
          </span>
        </div>

        {/* 구동 시작일 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            구동 시작일 <span className="text-rose-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={`w-full justify-start text-left font-normal h-9 text-sm ${
                  !startDate ? 'text-gray-400' : 'text-gray-900'
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'yyyy년 M월 d일 (EEE)', { locale: ko }) : '시작일 선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={handleStartDateChange}
                disabled={(date) => date < minStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-gray-500">
            {isWeekendSubmission
              ? `주말 접수 확인 불가로 인해 ${format(minStartDate, 'M월 d일 (EEE)', { locale: ko })}부터 가능`
              : '내일부터 선택 가능'}
          </span>
        </div>

        {/* 구동 종료일 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            구동 종료일 <span className="text-rose-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={!startDate}
                className={`w-full justify-start text-left font-normal h-9 text-sm ${
                  !endDate ? 'text-gray-400' : 'text-gray-900'
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'yyyy년 M월 d일 (EEE)', { locale: ko }) : '종료일 선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={handleEndDateChange}
                disabled={(date) => !startDate || date < startDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-gray-500">
            {selectedType === 'visitor' ? '시작일 이후 날짜 선택 (최소 3일)' : '시작일 이후 날짜 선택'}
          </span>
        </div>

        {/* 총 작업일 표시 */}
        {startDate && endDate && (
          <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
            <span className="text-xs text-purple-700">총 작업일: </span>
            <span className="text-base font-bold text-purple-900">{totalDays}일</span>
            <span className="text-xs text-purple-600 ml-1">
              ({format(startDate, 'M/d', { locale: ko })} ~ {format(endDate, 'M/d', { locale: ko })})
            </span>
            {selectedType === 'visitor' && totalDays < 3 && (
              <p className="text-xs text-rose-600 mt-1">⚠️ 최소 3일 이상 필요</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
