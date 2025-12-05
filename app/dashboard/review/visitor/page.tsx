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
import { Sparkles, CheckCircle2, AlertTriangle, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractNaverPlaceMID, fetchBusinessInfoByMID } from '@/utils/naver-place';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';
import { format, addDays, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function VisitorReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    businessName: '',
    placeUrl: '',
    placeMid: '',
    dailyCount: 1,
    startDate: null as Date | null,
    endDate: null as Date | null,
    photoOption: 'with', // 'with' | 'without'
    scriptOption: 'custom', // 'custom' | 'ai'
    guideline: '',
    emailDocConfirmed: false, // 이메일로 서류 전송 확인
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
  const [pricePerReview, setPricePerReview] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingBusinessName, setLoadingBusinessName] = useState(false);
  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);
  const [dialogEmailConfirmed, setDialogEmailConfirmed] = useState(false);

  // 가격 설정 여부 확인
  const isPriceConfigured = pricePerReview !== null && pricePerReview > 0;

  // 가격 정보 불러오기
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.success && data.pricing && data.pricing['receipt-review']) {
          setPricePerReview(data.pricing['receipt-review']);
        }
      } catch (error) {
        console.error('가격 정보 로드 실패:', error);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPricing();
  }, []);

  // 플레이스 링크에서 MID 자동 추출 및 업체명 가져오기
  const handlePlaceUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, placeUrl: url }));

    // MID 추출
    const mid = extractNaverPlaceMID(url);

    if (mid) {
      setFormData(prev => ({ ...prev, placeMid: mid }));

      // 업체명 자동 가져오기
      setLoadingBusinessName(true);
      try {
        const businessInfo = await fetchBusinessInfoByMID(mid);

        if (businessInfo && businessInfo.businessName) {
          setFormData(prev => ({ ...prev, businessName: businessInfo.businessName }));

          toast({
            title: '✅ 업체명 자동 입력 완료',
            description: `"${businessInfo.businessName}"이(가) 입력되었습니다.`,
            duration: 3000,
          });
        } else {
          toast({
            variant: 'destructive',
            title: '⚠️ 업체명 추출 실패',
            description: '업체명을 가져올 수 없습니다. 직접 입력해주세요.',
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('업체명 가져오기 실패:', error);
        toast({
          variant: 'destructive',
          title: '⚠️ 업체명 추출 오류',
          description: '업체명을 가져오는 중 오류가 발생했습니다. 직접 입력해주세요.',
          duration: 3000,
        });
      } finally {
        setLoadingBusinessName(false);
      }
    } else {
      setFormData(prev => ({ ...prev, placeMid: '' }));
    }
  };

  const handleDailyCountChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      dailyCount: value,
    }));
  };

  const calculateTotalCost = () => {
    return totalCount * (pricePerReview || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.placeUrl) {
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

    // 구동일수 최소 3일 검증 (클라이언트 요청 - 2025-12-05)
    if (totalDays < 3) {
      toast({
        variant: 'destructive',
        title: '⚠️ 구동일수 부족',
        description: '구동일수는 3일 이상부터 접수가 가능합니다.',
      });
      return;
    }

    // 최소 주문건수 검증을 가장 먼저 수행 (화면에 경고가 보이므로 사용자가 이해하기 쉬움)
    if (totalCount < 30) {
      toast({
        variant: 'destructive',
        title: '⚠️ 최소 주문건수 미달',
        description: `방문자 리뷰는 최소 30건 이상 주문하셔야 합니다. (현재: ${totalCount}건)`,
      });
      return;
    }

    if (!formData.placeMid) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '플레이스 링크에서 MID를 추출할 수 없습니다. 올바른 링크를 입력해주세요.',
      });
      return;
    }

    if (formData.dailyCount < 1 || formData.dailyCount > 10) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '일 발행수량은 최소 1건, 최대 10건입니다.',
      });
      return;
    }

    // 이메일 확인 다이얼로그 표시
    setDialogEmailConfirmed(false);
    setShowEmailConfirmDialog(true);
  };

  const executeSubmit = async () => {
    setShowEmailConfirmDialog(false);
    setIsSubmitting(true);

    try {
      // 서류는 이메일로 받음 (sense-ad@naver.com)
      const response = await fetch('/api/submissions/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.businessName,
          place_url: formData.placeUrl,
          daily_count: formData.dailyCount,
          total_days: totalDays,
          total_count: totalCount,
          total_points: calculateTotalCost(),
          start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
          photo_option: formData.photoOption,
          script_option: formData.scriptOption,
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
        title: '✅ 네이버 영수증 접수 완료!',
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
        router.push('/dashboard/review/visitor/status');
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
        <ProductGuideSection productKey="receipt-review" />
        
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
                  <Label htmlFor="businessName" className="text-xs font-medium text-gray-700">
                    업체명 <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder={loadingBusinessName ? "업체명 가져오는 중..." : "업체명을 입력하세요"}
                      className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                      disabled={loadingBusinessName}
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

                {/* 일 발행수량 */}
                <div className="space-y-1.5">
                  <Label htmlFor="dailyCount" className="text-xs font-medium text-gray-700">
                    일 발행수량 (1~10건) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="dailyCount"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.dailyCount}
                    onChange={(e) => handleDailyCountChange(Number(e.target.value))}
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                  <span className="text-xs text-gray-500">최소 1건, 최대 10건</span>
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
                  <span className="text-xs text-gray-500">시작일 이후 날짜 선택 (최소 3일)</span>
                </div>

                {/* 총 작업일 표시 */}
                {formData.startDate && formData.endDate && (
                  <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200">
                    <span className="text-xs text-sky-700">총 작업일: </span>
                    <span className="text-base font-bold text-sky-900">{totalDays}일</span>
                    <span className="text-xs text-sky-600 ml-1">
                      ({format(formData.startDate, 'M/d', { locale: ko })} ~ {format(formData.endDate, 'M/d', { locale: ko })})
                    </span>
                    {totalDays < 3 && (
                      <p className="text-xs text-rose-600 mt-1">⚠️ 최소 3일 이상 필요</p>
                    )}
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
                {/* 사진 옵션 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    사진 옵션 <span className="text-rose-500">*</span>
                  </Label>
                  <CheckboxRadioGroup
                    value={formData.photoOption}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, photoOption: value as 'with' | 'without' }))}
                  >
                    <CheckboxRadioItem value="with" id="photo-with" label="사진 있음" />
                    <CheckboxRadioItem value="without" id="photo-without" label="사진 없음" />
                  </CheckboxRadioGroup>
                </div>

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
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[100px]"
                  />
                </div>

                {/* 필수 서류 안내 - 이메일 제출 */}
                <div className="space-y-3 p-4 bg-sky-50 border border-sky-200 rounded-lg">
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
                          필수 서류를 이메일로 보내주세요
                        </p>
                        <p className="text-xs text-sky-700 mt-1">
                          사업자등록증 or 샘플 영수증을 아래 이메일로 전송해 주세요.
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
                  <div className="flex items-center gap-2 pt-3 border-t border-sky-200">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={formData.emailDocConfirmed}
                      onClick={() => setFormData(prev => ({ ...prev, emailDocConfirmed: !prev.emailDocConfirmed }))}
                      className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                        formData.emailDocConfirmed
                          ? 'bg-sky-500 border-sky-500 shadow-lg'
                          : 'bg-white border-gray-300 hover:border-sky-400'
                      }`}
                    >
                      {formData.emailDocConfirmed && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      )}
                    </button>
                    <label
                      onClick={() => setFormData(prev => ({ ...prev, emailDocConfirmed: !prev.emailDocConfirmed }))}
                      className="text-sm font-medium cursor-pointer select-none text-sky-800"
                    >
                      위 이메일 주소로 서류를 전송했습니다 <span className="text-rose-500">*</span>
                    </label>
                  </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 총 작업수량 */}
                <div className="space-y-1.5">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    totalCount < 30
                      ? 'bg-rose-50 border border-rose-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <span className={`text-xs font-medium ${
                      totalCount < 30 ? 'text-rose-700' : 'text-gray-700'
                    }`}>총 작업수량</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-bold ${
                        totalCount < 30 ? 'text-rose-900' : 'text-gray-900'
                      }`}>
                        {totalCount}
                      </span>
                      <span className={`text-xs ${
                        totalCount < 30 ? 'text-rose-600' : 'text-gray-600'
                      }`}>건</span>
                    </div>
                  </div>
                  {totalCount < 30 && (
                    <p className="text-xs text-rose-600 px-1">
                      ⚠️ 최소 30건 이상 필요
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

      {/* 이메일 확인 다이얼로그 */}
      <AlertDialog open={showEmailConfirmDialog} onOpenChange={setShowEmailConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              잠깐!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-base text-gray-700 font-medium">
                  이메일로 필수 서류는 보내셨나요?
                </p>
                <p className="text-sm text-gray-600">
                  보내셔야 주문이 정상적으로 처리됩니다.
                </p>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                  <p className="text-xs text-sky-700 mb-1">전송 이메일 주소</p>
                  <p className="text-sm font-bold text-sky-900">sense-ad@naver.com</p>
                  <p className="text-xs text-sky-600 mt-2">
                    📌 이메일 제목은 <span className="font-semibold">업체명 or 대행사명</span>으로 작성해 주세요.
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    📎 필수 서류: 사업자등록증 or 샘플 영수증 (둘 중 하나)
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
                    네, 서류를 이메일로 보냈습니다
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
      </AlertDialog>
    </div>
  );
}
