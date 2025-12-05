'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractNaverPlaceMID, fetchBusinessInfoByMID } from '@/utils/naver-place';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface RewardSubmitFormProps {
  initialPoints: number;
}

export default function RewardSubmitForm({ initialPoints }: RewardSubmitFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    twopleSelected: true, // 투플 기본 선택
    businessName: '',
    placeUrl: '',
    placeMid: '',
    dailyVolume: 100,
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  // 구동일수 자동 계산
  const operationDays = formData.startDate && formData.endDate
    ? differenceInDays(formData.endDate, formData.startDate) + 1
    : 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricePerHit, setPricePerHit] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingBusinessName, setLoadingBusinessName] = useState(false);

  // 가격 설정 여부 확인
  const isPriceConfigured = pricePerHit !== null && pricePerHit > 0;

  // 가격 정보 불러오기
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.success && data.pricing && data.pricing['place-traffic']) {
          setPricePerHit(data.pricing['place-traffic']);
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

  // 비용 계산 (백엔드 로직과 동일하게)
  const calculateTotalCost = () => {
    const totalCount = formData.dailyVolume * operationDays;
    return Math.round((totalCount / 100) * (pricePerHit || 0));
  };

  // 시작일 선택 가능 최소 날짜 계산
  // - 금요일 18시 이후, 토요일, 일요일 접수 → 다음 화요일부터
  // - 그 외 평일 접수 → 내일부터
  const getMinStartDate = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = now.getDay(); // 0=일, 1=월, ..., 5=금, 6=토
    const hour = now.getHours();

    // 주말 접수 판단: 금요일 18시 이후, 토요일, 일요일
    const isWeekendSubmission =
      dayOfWeek === 6 || // 토요일
      dayOfWeek === 0 || // 일요일
      (dayOfWeek === 5 && hour >= 18); // 금요일 18시 이후

    if (isWeekendSubmission) {
      // 다음 화요일 계산
      let daysUntilTuesday = 0;
      if (dayOfWeek === 5) { // 금요일 18시 이후 → 화요일까지 4일
        daysUntilTuesday = 4;
      } else if (dayOfWeek === 6) { // 토요일 → 화요일까지 3일
        daysUntilTuesday = 3;
      } else if (dayOfWeek === 0) { // 일요일 → 화요일까지 2일
        daysUntilTuesday = 2;
      }
      return addDays(today, daysUntilTuesday);
    }

    // 평일 접수 → 내일부터
    return addDays(today, 1);
  };

  const minStartDate = getMinStartDate();

  // 마감일 최대 날짜 (시작일로부터 7일)
  const maxEndDate = formData.startDate ? addDays(formData.startDate, 6) : null;

  // 주말 접수 여부 확인 (안내 문구용)
  const isWeekendSubmission = (() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    return dayOfWeek === 6 || dayOfWeek === 0 || (dayOfWeek === 5 && hour >= 18);
  })();

  const totalCost = calculateTotalCost();

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.twopleSelected) {
      toast({
        variant: 'destructive',
        title: '⚠️ 투플 매체 선택 필요',
        description: '투플 매체를 선택해주세요.',
      });
      return;
    }

    if (!formData.businessName || !formData.placeUrl) {
      toast({
        variant: 'destructive',
        title: '⚠️ 필수 항목 누락',
        description: '업체명과 플레이스 링크를 입력해주세요.',
      });
      return;
    }

    if (!formData.placeMid) {
      toast({
        variant: 'destructive',
        title: '⚠️ MID 추출 실패',
        description: '플레이스 링크에서 MID를 추출할 수 없습니다. 올바른 링크를 입력해주세요.',
      });
      return;
    }

    if (formData.dailyVolume < 100) {
      toast({
        variant: 'destructive',
        title: '⚠️ 일 접수량 부족',
        description: '일 접수량은 최소 100타 이상이어야 합니다.',
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        variant: 'destructive',
        title: '⚠️ 날짜 선택 필요',
        description: '구동 시작일과 마감일을 선택해주세요.',
      });
      return;
    }

    if (operationDays < 3) {
      toast({
        variant: 'destructive',
        title: '구동일수 부족',
        description: '구동일수는 3일 이상부터 접수가 가능합니다.',
      });
      return;
    }

    if (totalCost > initialPoints) {
      toast({
        variant: 'destructive',
        title: '⚠️ 포인트 부족',
        description: `보유 포인트(${initialPoints.toLocaleString()}P)가 부족합니다.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submissions/reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.businessName,
          place_url: formData.placeUrl,
          place_mid: formData.placeMid,
          daily_count: formData.dailyVolume,
          total_days: operationDays,
          total_points: totalCost,
          start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '접수 중 오류가 발생했습니다.');
      }

      toast({
        title: '✅ 리워드 접수 완료',
        description: `${formData.businessName} - ${formData.dailyVolume}타/일 × ${operationDays}일 접수가 완료되었습니다.`,
        duration: 5000,
      });

      // 폼 초기화
      setFormData({
        twopleSelected: true, // 투플 기본 선택 유지
        businessName: '',
        placeUrl: '',
        placeMid: '',
        dailyVolume: 100,
        startDate: null,
        endDate: null,
      });

      // 페이지 새로고침하여 최신 포인트 반영
      window.location.reload();
    } catch (error: any) {
      console.error('접수 실패:', error);
      toast({
        variant: 'destructive',
        title: '❌ 접수 실패',
        description: error.message || '접수 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {/* 리워드 매체 */}
              <Card className="border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-900 text-base">리워드 매체</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-sky-50 border border-sky-200">
                    <div className="text-3xl">📱</div>
                    <div className="flex-1">
                      <div className="font-bold text-base text-gray-900">투플 (Twoople)</div>
                      <div className="text-xs text-gray-600 leading-relaxed mt-0.5">
                        실사용자 방문 유도를 통한 네이버 플레이스 조회수 증대<br/>
                        리워드 기반의 프리미엄 마케팅 플랫폼
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                disabled={isSubmitting || !formData.twopleSelected || !isPriceConfigured || loadingPrice}
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
