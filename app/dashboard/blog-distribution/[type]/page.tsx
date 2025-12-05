'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Sparkles, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';
import { extractNaverPlaceMID, fetchBusinessInfoByMID } from '@/utils/naver-place';
import { Video, Zap, Users } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  DistributionType,
  BlogDistributionFormData,
  ServiceConfig,
  mapTypeParam,
  mapTypeToUrl,
  mapTypeToSlug,
} from '@/types/blog-distribution/types';
import { ServiceTypeSelector } from '@/components/dashboard/blog-distribution/ServiceTypeSelector';
import { PaymentInfoCard } from '@/components/dashboard/blog-distribution/PaymentInfoCard';
import { BlogDistributionForm } from '@/components/dashboard/blog-distribution/BlogDistributionForm';

export default function BlogDistributionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const typeParam = params?.type as string;
  
  const [selectedType, setSelectedType] = useState<DistributionType>(mapTypeParam(typeParam));
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [pricingLoading, setPricingLoading] = useState(true);
  const [isApprovedForAutoDistribution, setIsApprovedForAutoDistribution] = useState(false);
  const [loadingBusinessName, setLoadingBusinessName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);
  const [dialogEmailConfirmed, setDialogEmailConfirmed] = useState(false);

  const [formData, setFormData] = useState<BlogDistributionFormData>({
    businessName: '',
    placeUrl: '',
    placeMid: '',
    linkType: 'place',
    contentType: 'review',
    dailyCount: 3,
    startDate: null as Date | null,
    endDate: null as Date | null,
    keywords: '',
    guideline: '',
    externalAccountId: '',
    chargeCount: 0,
    useExternalAccount: false,
    emailMediaConfirmed: false,
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
  const operationDays = formData.startDate && formData.endDate
    ? differenceInDays(formData.endDate, formData.startDate) + 1
    : 0;

  // 총 건수 계산
  const totalCount = formData.dailyCount * operationDays;

  // URL 파라미터가 변경되면 selectedType 업데이트
  useEffect(() => {
    if (typeParam) {
      setSelectedType(mapTypeParam(typeParam));
    }
  }, [typeParam]);

  // 가격 정보 및 승인 상태 불러오기
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.success && data.pricing) {
          setPricing(data.pricing);
          setIsApprovedForAutoDistribution(data.auto_distribution_approved || false);
        }
      } catch (error) {
        console.error('가격 정보 로드 실패:', error);
      } finally {
        setPricingLoading(false);
      }
    };

    fetchPricing();
  }, []);

  const services: ServiceConfig[] = [
    {
      id: 'video',
      name: '영상 배포',
      icon: Video,
      color: 'bg-blue-500',
      available: !!pricing['video-distribution'],
      pricePerPost: pricing['video-distribution'] || 0,
      description: '영상 블로그 배포 서비스'
    },
    {
      id: 'auto',
      name: '자동화 배포',
      icon: Zap,
      color: 'bg-emerald-500',
      available: !!pricing['auto-distribution'],
      pricePerPost: pricing['auto-distribution'] || 0,
      description: '자동화 블로그 배포'
    },
    {
      id: 'reviewer',
      name: '리뷰어 배포',
      icon: Users,
      color: 'bg-amber-500',
      available: !!pricing['reviewer-distribution'],
      pricePerPost: pricing['reviewer-distribution'] || 0,
      description: '실계정 리뷰어 배포'
    },
  ];

  // 선택된 서비스의 가격이 설정되어 있는지 확인
  const selectedServicePrice = services.find(s => s.id === selectedType)?.pricePerPost;
  const isPriceConfigured = !!(selectedServicePrice && selectedServicePrice > 0);

  const handleDailyCountChange = (value: number) => {
    setFormData(prev => ({ ...prev, dailyCount: value }));
  };

  const handleStartDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      startDate: date,
      endDate: date && prev.endDate && date > prev.endDate ? null : prev.endDate,
    }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, endDate: date }));
  };

  const handlePlaceUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, placeUrl: url }));

    const mid = extractNaverPlaceMID(url);

    if (mid) {
      setFormData(prev => ({ ...prev, placeMid: mid }));

      setLoadingBusinessName(true);
      try {
        const businessInfo = await fetchBusinessInfoByMID(mid);

        if (businessInfo && businessInfo.businessName) {
          setFormData(prev => ({ ...prev, businessName: businessInfo.businessName }));

          toast({
            title: '✅ 업체명 자동 입력 완료',
            description: `업체명: ${businessInfo.businessName}`,
          });
        }
      } catch (error) {
        console.error('업체명 조회 실패:', error);
      } finally {
        setLoadingBusinessName(false);
      }
    } else {
      setFormData(prev => ({ ...prev, placeMid: '' }));
    }
  };

  const calculateTotalCost = () => {
    const service = services.find(s => s.id === selectedType);
    const pricePerPost = service?.pricePerPost || 15000;
    return totalCount * pricePerPost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 자동화 배포 - 외부 계정 사용 시
    if (selectedType === 'auto' && formData.useExternalAccount) {
      if (!formData.externalAccountId || formData.chargeCount < 1) {
        toast({
          variant: 'destructive',
          title: '입력 오류',
          description: '외부 계정 ID와 충전건수를 입력해주세요.',
        });
        return;
      }
      // 외부 계정은 이메일 확인 없이 바로 제출
      await executeSubmit();
    } else {
      // 일반 접수 검증
      if (!formData.businessName || !formData.placeUrl) {
        toast({
          variant: 'destructive',
          title: '입력 오류',
          description: '업체명과 플레이스 링크를 입력해주세요.',
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

      if (formData.dailyCount < 3 || totalCount < 30) {
        toast({
          variant: 'destructive',
          title: '입력 오류',
          description: '일 접수량 최소 3건, 총 작업수량 최소 30건이 필요합니다.',
        });
        return;
      }

      // 리뷰어 배포만 이메일 확인 다이얼로그 표시 (2025-12-05)
      if (selectedType === 'reviewer') {
        setDialogEmailConfirmed(false);
        setShowEmailConfirmDialog(true);
      } else {
        // 영상/자동화 배포는 바로 제출
        await executeSubmit();
      }
    }
  };

  const executeSubmit = async () => {
    setShowEmailConfirmDialog(false);
    setIsSubmitting(true);

    try {
      const service = services.find(s => s.id === selectedType);
      const totalCost = calculateTotalCost();
      const backendDistributionType = selectedType === 'auto' ? 'automation' : selectedType;

      const requestData = {
        company_name: formData.businessName,
        distribution_type: backendDistributionType,
        content_type: formData.contentType,
        place_url: formData.placeUrl || '',
        daily_count: formData.dailyCount,
        total_count: totalCount,
        total_days: operationDays,
        total_points: totalCost,
        start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
        guide_text: formData.guideline || null,
        account_id: formData.useExternalAccount ? formData.externalAccountId : null,
        charge_count: formData.useExternalAccount ? formData.chargeCount : null,
        notes: null,
      };

      const response = await fetch('/api/submissions/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '접수 중 오류가 발생했습니다.');
      }

      const serviceName = service?.name;

      toast({
        title: `✅ ${serviceName} 접수 완료!`,
        description: `차감 포인트: ${data.submission?.total_points?.toLocaleString() || totalCost.toLocaleString()}P`,
        duration: 5000,
      });

      setTimeout(() => {
        router.push('/dashboard/blog-distribution/status');
        router.refresh();
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

  const serviceKey = mapTypeToSlug(selectedType);
  const selectedService = services.find(s => s.id === selectedType);

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-7xl mx-auto">
        <ProductGuideSection productKey={`blog-${selectedType}`} />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 왼쪽: 서비스 선택 및 결제 정보 */}
            <div className="space-y-4">
              <ServiceTypeSelector
                services={services}
                selectedType={selectedType}
                onTypeChange={(type) => router.push(`/dashboard/blog-distribution/${mapTypeToUrl(type)}`)}
              />

              <PaymentInfoCard
                totalCount={totalCount}
                totalCost={calculateTotalCost()}
                selectedService={selectedService}
                dailyCount={formData.dailyCount}
                operationDays={operationDays}
                pricingLoading={pricingLoading}
              />
            </div>

            {/* 오른쪽: 접수 정보 입력 */}
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <BlogDistributionForm
                  formData={formData}
                  selectedType={selectedType}
                  isApprovedForAutoDistribution={isApprovedForAutoDistribution}
                  loadingBusinessName={loadingBusinessName}
                  onFormChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                  onPlaceUrlChange={handlePlaceUrlChange}
                  onDailyCountChange={handleDailyCountChange}
                  onStartDateChange={handleStartDateChange}
                  onEndDateChange={handleEndDateChange}
                  minStartDate={minStartDate}
                  isWeekendSubmission={isWeekendSubmission}
                  operationDays={operationDays}
                  totalCount={totalCount}
                />
              </CardContent>
            </Card>
          </div>

          {/* 하단: 접수 신청 버튼 */}
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              {!isPriceConfigured && !pricingLoading && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  ⚠️ 가격이 설정되지 않았습니다. 관리자에게 문의하세요.
                </div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !isPriceConfigured || pricingLoading}
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
                    {selectedType === 'auto' && formData.useExternalAccount ? '충전 요청하기' : '접수 신청하기'}
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* 리뷰어 배포 전용 이메일 확인 다이얼로그 */}
      <AlertDialog open={showEmailConfirmDialog} onOpenChange={setShowEmailConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-sky-700">
              <Mail className="h-5 w-5" />
              이미지 전송 확인
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-base text-gray-700 font-medium">
                  이메일로 이미지를 보내셨나요?
                </p>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg space-y-2">
                  <p className="text-sm font-bold text-sky-900">sense-ad@naver.com</p>
                  <p className="text-xs text-sky-600">
                    이메일 제목은 <span className="font-semibold">업체명 or 대행사명</span>으로 작성
                  </p>
                  <p className="text-xs font-medium text-sky-700 pt-1 border-t border-sky-200">
                    사진 100장 이상 전달 필수
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
                    네, 이미지를 이메일로 보냈습니다
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
