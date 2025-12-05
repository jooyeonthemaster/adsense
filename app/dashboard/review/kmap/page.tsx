'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxRadioGroup, CheckboxRadioItem } from '@/components/ui/checkbox-radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Sparkles, Star, MapPin, CheckCircle2, Info, AlertCircle, BookOpen, ChevronDown, AlertTriangle, CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';
import { format, addDays, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { extractKakaoPlaceMID, fetchKakaoBusinessInfoByMID } from '@/utils/kakao-place';

export default function KmapReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    businessName: '',
    kmapUrl: '',
    dailyCount: 1,
    startDate: null as Date | null,
    endDate: null as Date | null,
    hasPhoto: false,
    emailImageConfirmed: false, // 이메일로 이미지 전송 확인
    scriptOption: 'custom' as 'custom' | 'ai',
    photoRatio: 50,
    starRating: 'mixed' as 'mixed' | 'five' | 'four',
    guideline: '',
  });

  // 주말/금요일 18시 이후 접수 시 최소 시작일 계산
  const getMinStartDate = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = now.getDay(); // 0=일, 1=월, ..., 5=금, 6=토
    const hour = now.getHours();

    // 금요일 18시 이후, 토요일, 일요일 접수 시 → 화요일부터 시작 가능
    const isWeekendSubmission =
      dayOfWeek === 6 || // 토요일
      dayOfWeek === 0 || // 일요일
      (dayOfWeek === 5 && hour >= 18); // 금요일 18시 이후

    if (isWeekendSubmission) {
      // 다음 화요일까지 남은 일수 계산
      let daysUntilTuesday = 0;
      if (dayOfWeek === 5) daysUntilTuesday = 4; // 금→화: 4일
      else if (dayOfWeek === 6) daysUntilTuesday = 3; // 토→화: 3일
      else if (dayOfWeek === 0) daysUntilTuesday = 2; // 일→화: 2일

      return addDays(today, daysUntilTuesday);
    }

    // 평일 접수 시 내일부터 가능
    return addDays(today, 1);
  };

  const minStartDate = getMinStartDate();
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const isWeekendSubmission =
    dayOfWeek === 6 || dayOfWeek === 0 || (dayOfWeek === 5 && hour >= 18);

  // 총 작업일 계산 (캘린더 기반)
  const totalDays = formData.startDate && formData.endDate
    ? differenceInDays(formData.endDate, formData.startDate) + 1
    : 0;

  // 총 건수 계산
  const totalCount = formData.dailyCount * totalDays;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricePerUnit, setPricePerUnit] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);
  const [dialogEmailConfirmed, setDialogEmailConfirmed] = useState(false);
  const [fetchingBusinessName, setFetchingBusinessName] = useState(false);

  // 카카오맵 URL 변경 시 업체명 자동 추출
  const handleKmapUrlChange = async (url: string) => {
    setFormData(prev => ({ ...prev, kmapUrl: url }));

    // URL에서 MID 추출
    const mid = extractKakaoPlaceMID(url);
    if (!mid) return;

    // 이미 업체명이 입력되어 있으면 덮어쓰지 않음
    if (formData.businessName.trim()) return;

    setFetchingBusinessName(true);
    try {
      const result = await fetchKakaoBusinessInfoByMID(mid);
      if (result?.businessName) {
        setFormData(prev => ({ ...prev, businessName: result.businessName }));
        toast({
          title: '업체명 자동 입력',
          description: `"${result.businessName}" 업체 정보를 불러왔습니다.`,
        });
      }
    } catch (error) {
      console.error('업체 정보 조회 실패:', error);
    } finally {
      setFetchingBusinessName(false);
    }
  };

  // 가격 정보 불러오기
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        if (response.ok) {
          const data = await response.json();
          setPricePerUnit(data.pricing['kakaomap-review']);
        } else {
          toast({
            variant: 'destructive',
            title: '가격 정보 오류',
            description: '가격 정보를 불러올 수 없습니다. 관리자에게 문의하세요.',
          });
        }
      } catch (error) {
        console.error('가격 정보 조회 실패:', error);
        toast({
          variant: 'destructive',
          title: '가격 정보 오류',
          description: '가격 정보를 불러오는 중 오류가 발생했습니다.',
        });
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPricing();
  }, [toast]);

  const handleDailyCountChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      dailyCount: value,
    }));
  };

  const calculateTotalCost = () => {
    if (!pricePerUnit) return 0;
    return totalCount * pricePerUnit;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pricePerUnit) {
      toast({
        variant: 'destructive',
        title: '가격 정보 오류',
        description: '가격 정보를 불러올 수 없습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.',
      });
      return;
    }

    if (!formData.businessName || !formData.kmapUrl) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '시작일과 종료일을 선택해주세요.',
      });
      return;
    }

    if (formData.dailyCount < 1) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '일 발행수량은 최소 1건 이상이어야 합니다.',
      });
      return;
    }

    if (totalCount < 10) {
      toast({
        variant: 'destructive',
        title: '최소 주문건수 미달',
        description: 'K맵 리뷰는 최소 10건 이상 주문하셔야 합니다.',
      });
      return;
    }

    // [임시 비활성화] 사진 포함 시 이메일 확인 다이얼로그 표시
    // if (formData.hasPhoto) {
    //   setDialogEmailConfirmed(false);
    //   setShowEmailConfirmDialog(true);
    //   return;
    // }

    // 사진 포함 여부와 관계없이 바로 제출
    await executeSubmit();
  };

  const executeSubmit = async () => {
    setShowEmailConfirmDialog(false);
    setIsSubmitting(true);

    const totalCost = calculateTotalCost();

    try {
      const response = await fetch('/api/submissions/kakaomap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.businessName,
          kakaomap_url: formData.kmapUrl,
          daily_count: formData.dailyCount,
          total_count: totalCount,
          total_days: totalDays,
          total_points: totalCost,
          start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
          script: formData.guideline || null,
          photo_urls: null,
          script_urls: null,
          text_review_count: formData.hasPhoto ? Math.floor(totalCount * (1 - formData.photoRatio / 100)) : totalCount,
          photo_review_count: formData.hasPhoto ? Math.floor(totalCount * (formData.photoRatio / 100)) : 0,
          photo_ratio: formData.photoRatio,
          star_rating: formData.starRating,
          script_type: formData.scriptOption,
          notes: formData.guideline || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '접수에 실패했습니다.');
      }

      const data = await response.json();

      // Toast 알림 표시
      toast({
        title: '✅ 카카오맵 접수 완료!',
        description: (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg border border-sky-200">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium text-sky-900">
                차감 포인트: {data.submission?.total_points?.toLocaleString() || '0'}P
              </span>
            </div>
            <div className="text-sm text-gray-600">
              남은 포인트: {data.new_balance?.toLocaleString() || '0'}P
            </div>
          </div>
        ) as React.ReactNode,
        duration: 5000,
      });

      // 1.5초 후 접수 현황 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/review/kmap/status');
        router.refresh(); // 서버 데이터 새로고침
      }, 1500);
    } catch (error) {
      console.error('접수 실패:', error);
      toast({
        variant: 'destructive',
        title: '접수 실패',
        description: error instanceof Error ? error.message : '접수 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-7xl mx-auto">
        <ProductGuideSection productKey="kakaomap-review" />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 상단 2열 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 왼쪽: 접수 정보 (먼저 입력) */}
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
                    {fetchingBusinessName && (
                      <span className="flex items-center gap-1 text-sky-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">불러오는 중...</span>
                      </span>
                    )}
                  </Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="업체명을 입력하세요"
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                </div>

                {/* 카카오맵 링크 */}
                <div className="space-y-1.5">
                  <Label htmlFor="kmapUrl" className="text-xs font-medium text-gray-700">
                    카카오맵 링크 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="kmapUrl"
                    type="url"
                    value={formData.kmapUrl}
                    onChange={(e) => handleKmapUrlChange(e.target.value)}
                    placeholder="https://place.map.kakao.com/..."
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                  <span className="text-xs text-gray-500">카카오맵 URL 입력 시 업체명이 자동으로 입력됩니다</span>
                </div>

                {/* 일 발행수량 */}
                <div className="space-y-1.5">
                  <Label htmlFor="dailyCount" className="text-xs font-medium text-gray-700">
                    일 발행수량 (최소 1건) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="dailyCount"
                    type="number"
                    min="1"
                    value={formData.dailyCount}
                    onChange={(e) => handleDailyCountChange(Number(e.target.value))}
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                  <span className="text-xs text-gray-500">최소 1건, 최대 제한 없음</span>
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
                          !formData.startDate ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate
                          ? format(formData.startDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
                          : '시작일 선택'}
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
                            endDate: date && prev.endDate && date > prev.endDate ? null : prev.endDate,
                          }));
                        }}
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
                        disabled={!formData.startDate}
                        className={`w-full justify-start text-left font-normal h-9 text-sm ${
                          !formData.endDate ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate
                          ? format(formData.endDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
                          : '종료일 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date || null }))}
                        disabled={(date) => !formData.startDate || date < formData.startDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-xs text-gray-500">시작일 이후 날짜 선택</span>
                </div>

                {/* 총 작업일 표시 */}
                {formData.startDate && formData.endDate && (
                  <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200">
                    <span className="text-xs text-sky-700">총 작업일: </span>
                    <span className="text-base font-bold text-sky-900">{totalDays}일</span>
                    <span className="text-xs text-sky-600 ml-1">
                      ({format(formData.startDate, 'M/d', { locale: ko })} ~ {format(formData.endDate, 'M/d', { locale: ko })})
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 오른쪽: 옵션 및 가이드 (나중에 입력) */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base">옵션 및 가이드</CardTitle>
                <CardDescription className="text-gray-600 text-sm">리뷰 작성 옵션을 선택하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {/* 사진 포함 체크박스 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    사진 옵션
                  </Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={formData.hasPhoto}
                      onClick={() => setFormData(prev => ({ ...prev, hasPhoto: !prev.hasPhoto }))}
                      className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                        formData.hasPhoto
                          ? 'bg-sky-500 border-sky-500 shadow-lg'
                          : 'bg-white border-gray-300 hover:border-sky-400'
                      }`}
                    >
                      {formData.hasPhoto && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      )}
                    </button>
                    <label
                      onClick={() => setFormData(prev => ({ ...prev, hasPhoto: !prev.hasPhoto }))}
                      className="text-sm font-medium cursor-pointer select-none text-gray-700"
                    >
                      사진 포함
                    </label>
                  </div>
                </div>

                {/* 사진 비율 및 이메일 안내 (사진 포함 시에만 표시) */}
                {formData.hasPhoto && (
                  <div className="space-y-3">
                    {/* 사진 비율 슬라이더 */}
                    <div className="space-y-1.5 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                      <Label className="text-xs font-medium text-sky-700">
                        사진 비율: <span className="text-base font-bold">{formData.photoRatio}%</span>
                      </Label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="10"
                        value={formData.photoRatio}
                        onChange={(e) => setFormData(prev => ({ ...prev, photoRatio: Number(e.target.value) }))}
                        className="w-full h-2 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                      <div className="flex justify-between text-xs text-sky-600">
                        <span>10%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* 이미지 이메일 안내 - 주석 처리됨 (사용자 요청: 이메일 안내 UI 숨김) */}
                    {/* <div className="space-y-3 p-4 bg-sky-50 border border-sky-200 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="bg-sky-100 p-2 rounded-full shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-sky-800">
                              사진은 이메일로 보내주세요
                            </p>
                            <p className="text-xs text-sky-700 mt-1">
                              아래 이메일 주소로 사진 파일을 전송해 주세요.
                            </p>
                            <p className="text-sm font-bold text-sky-900 mt-2 bg-white px-3 py-1.5 rounded border border-sky-200 inline-block">
                              sense-ad@naver.com
                            </p>
                            <p className="text-xs text-sky-600 mt-2">
                              📌 이메일 제목은 <span className="font-semibold">업체명 or 대행사명</span>으로 작성해 주세요.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 이메일 전송 확인 체크박스 (필수) */}
                    {/*   <div className="flex items-center gap-2 pt-3 border-t border-sky-200">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={formData.emailImageConfirmed}
                          onClick={() => setFormData(prev => ({ ...prev, emailImageConfirmed: !prev.emailImageConfirmed }))}
                          className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                            formData.emailImageConfirmed
                              ? 'bg-sky-500 border-sky-500 shadow-lg'
                              : 'bg-white border-gray-300 hover:border-sky-400'
                          }`}
                        >
                          {formData.emailImageConfirmed && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                              <path d="M20 6 9 17l-5-5"></path>
                            </svg>
                          )}
                        </button>
                        <label
                          onClick={() => setFormData(prev => ({ ...prev, emailImageConfirmed: !prev.emailImageConfirmed }))}
                          className="text-sm font-medium cursor-pointer select-none text-sky-800"
                        >
                          위 이메일 주소로 사진을 전송했습니다 <span className="text-rose-500">*</span>
                        </label>
                      </div>
                    </div> */}
                  </div>
                )}

                {/* 원고 옵션 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    원고 옵션 <span className="text-rose-500">*</span>
                  </Label>
                  <CheckboxRadioGroup
                    value={formData.scriptOption}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, scriptOption: value as 'custom' | 'ai' }))}
                  >
                    <CheckboxRadioItem value="custom" id="script-custom" label="지정원고" />
                    <CheckboxRadioItem value="ai" id="script-ai" label="AI 제작 원고" />
                  </CheckboxRadioGroup>
                </div>

                {/* 별점 선택 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    별점 옵션 <span className="text-rose-500">*</span>
                  </Label>
                  <CheckboxRadioGroup
                    value={formData.starRating}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, starRating: value as 'mixed' | 'five' | 'four' }))}
                  >
                    <CheckboxRadioItem value="mixed" id="star-mixed" label="4~5점대 섞어서" />
                    <CheckboxRadioItem value="five" id="star-five" label="5점대만" />
                    <CheckboxRadioItem value="four" id="star-four" label="4점대만" />
                  </CheckboxRadioGroup>
                </div>

                {/* 가이드 및 요청사항 */}
                <div className="space-y-1.5">
                  <Label htmlFor="guideline" className="text-xs font-medium text-gray-700">
                    가이드 및 요청사항
                  </Label>
                  <Textarea
                    id="guideline"
                    value={formData.guideline}
                    onChange={(e) => setFormData(prev => ({ ...prev, guideline: e.target.value }))}
                    placeholder="리뷰 작성 시 참고할 가이드나 요청사항을 입력하세요"
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[80px]"
                  />
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 총 작업수량 */}
                <div className="space-y-1.5">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    totalCount < 10
                      ? 'bg-rose-50 border border-rose-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <span className={`text-xs font-medium ${
                      totalCount < 10 ? 'text-rose-700' : 'text-gray-700'
                    }`}>총 작업수량</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-bold ${
                        totalCount < 10 ? 'text-rose-900' : 'text-gray-900'
                      }`}>
                        {totalCount}
                      </span>
                      <span className={`text-xs ${
                        totalCount < 10 ? 'text-rose-600' : 'text-gray-600'
                      }`}>건</span>
                    </div>
                  </div>
                  {totalCount < 10 && (
                    <p className="text-xs text-rose-600 px-1">
                      ⚠️ 최소 10건 이상 필요
                    </p>
                  )}
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
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">
                        {calculateTotalCost().toLocaleString()}
                      </span>
                      <span className="text-sm text-white/90">P</span>
                    </div>
                    <div className="text-xs text-white/80">
                      일 {formData.dailyCount}건 × {totalDays}일
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
                      <div>{formData.hasPhoto ? `사진 포함 (${formData.photoRatio}%)` : '사진 없음'}</div>
                      <div>{formData.scriptOption === 'ai' ? 'AI 제작 원고' : '지정원고'}</div>
                      <div>
                        별점: {formData.starRating === 'mixed' ? '4~5점 혼합' : formData.starRating === 'five' ? '5점대만' : '4점대만'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 접수 신청 버튼 */}
              <Button
                type="submit"
                disabled={isSubmitting || loadingPrice || !pricePerUnit}
                className="w-full h-11 text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPrice ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    가격 정보 불러오는 중...
                  </div>
                ) : isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    접수 중...
                  </div>
                ) : !pricePerUnit ? (
                  <div className="flex items-center gap-2">
                    가격 정보 없음 - 관리자에게 문의
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

      {/* [임시 비활성화] 이메일 확인 다이얼로그 */}
      {/* <AlertDialog open={showEmailConfirmDialog} onOpenChange={setShowEmailConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              잠깐!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-base text-gray-700 font-medium">
                  이메일로 사진은 보내셨나요?
                </p>
                <p className="text-sm text-gray-600">
                  보내셔야 주문이 정상적으로 처리됩니다.
                </p>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                  <p className="text-xs text-sky-700 mb-1">전송 이메일 주소</p>
                  <p className="text-sm font-bold text-sky-900">sense-ad@naver.com</p>
                  <p className="text-xs text-sky-600 mt-1">
                    📌 이메일 제목은 <span className="font-semibold">업체명 or 대행사명</span>으로 작성해 주세요.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={dialogEmailConfirmed}
                    onClick={() => setDialogEmailConfirmed(!dialogEmailConfirmed)}
                    className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                      dialogEmailConfirmed
                        ? 'bg-sky-500 border-sky-500 shadow-lg'
                        : 'bg-white border-gray-300 hover:border-sky-400'
                    }`}
                  >
                    {dialogEmailConfirmed && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    )}
                  </button>
                  <label
                    onClick={() => setDialogEmailConfirmed(!dialogEmailConfirmed)}
                    className="text-sm font-medium cursor-pointer select-none text-gray-700"
                  >
                    네, 사진을 이메일로 보냈습니다
                  </label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="flex-1">취소</AlertDialogCancel>
            <Button
              onClick={executeSubmit}
              disabled={!dialogEmailConfirmed || isSubmitting}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
            >
              {isSubmitting ? '접수 중...' : '접수하기'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
    </div>
  );
}
