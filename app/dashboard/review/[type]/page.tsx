'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle } from 'lucide-react';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';
import { mapTypeParam, mapTypeToUrl } from '@/types/review-marketing/types';
import { useReviewForm } from '@/hooks/review/useReviewForm';
import {
  ServiceTypeSelector,
  PaymentInfoCard,
  SubmissionInfoCard,
  VisitorOptionsCard,
  KmapOptionsCard,
  EmailConfirmDialog,
} from '@/components/dashboard/review-marketing';

export default function ReviewMarketingPage() {
  const params = useParams();
  const router = useRouter();
  const typeParam = params?.type as string;

  // 이메일 확인 다이얼로그 상태
  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);

  // 커스텀 훅에서 모든 상태와 핸들러 가져오기
  const {
    selectedType,
    setSelectedType,
    activeProducts,
    loadingPrice,
    isSubmitting,
    loadingBusinessName,
    visitorFormData,
    kmapFormData,
    services,
    currentService,
    isPriceConfigured,
    noActiveProducts,
    totalDays,
    totalCount,
    totalCost,
    minStartDate,
    isWeekendSubmission,
    setVisitorFormData,
    setKmapFormData,
    handleNaverPlaceUrlChange,
    handleKmapUrlChange,
    validateAndSubmit,
    executeSubmit,
  } = useReviewForm(mapTypeParam(typeParam));

  // URL 파라미터 변경 시 selectedType 업데이트
  useEffect(() => {
    if (typeParam) {
      setSelectedType(mapTypeParam(typeParam));
    }
  }, [typeParam, setSelectedType]);

  // 현재 선택된 서비스가 비활성화된 경우 활성화된 서비스로 리다이렉트
  useEffect(() => {
    if (loadingPrice || activeProducts.length === 0) return;

    const typeSlugMap: Record<string, string> = {
      visitor: 'receipt-review',
      kmap: 'kakaomap-review',
    };
    const urlMap: Record<string, string> = {
      'receipt-review': 'visitor',
      'kakaomap-review': 'kmap',
    };

    const currentSlug = typeSlugMap[selectedType];
    if (!activeProducts.includes(currentSlug)) {
      // 현재 서비스가 비활성화됨 - 활성화된 다른 서비스로 리다이렉트
      const reviewSlugs = ['receipt-review', 'kakaomap-review'];
      const activeSlug = reviewSlugs.find(slug => activeProducts.includes(slug));
      if (activeSlug) {
        router.replace(`/dashboard/review/${urlMap[activeSlug]}`);
      }
    }
  }, [loadingPrice, activeProducts, selectedType, router]);

  // 서비스 타입 변경 핸들러
  const handleTypeChange = (type: typeof selectedType) => {
    router.push(`/dashboard/review/${mapTypeToUrl(type)}`);
  };

  // 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    const shouldShowDialog = await validateAndSubmit(e);
    if (shouldShowDialog) {
      setShowEmailConfirmDialog(true);
    }
  };

  // 다이얼로그에서 확인 후 실제 제출
  const handleConfirmSubmit = () => {
    setShowEmailConfirmDialog(false);
    executeSubmit();
  };

  const dailyCount = selectedType === 'visitor' ? visitorFormData.dailyCount : kmapFormData.dailyCount;

  // 활성화된 상품이 없는 경우
  if (noActiveProducts) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">현재 이용 가능한 서비스가 없습니다</h2>
          <p className="text-gray-600">리뷰 마케팅 서비스가 일시적으로 중단되었습니다.</p>
          <p className="text-gray-600">관리자에게 문의해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-7xl mx-auto">
        <ProductGuideSection productKey={currentService?.productGuideKey || 'receipt-review'} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 서비스 선택 */}
          <div className="grid grid-cols-1 gap-4">
            <ServiceTypeSelector
              services={services}
              selectedType={selectedType}
              onTypeChange={handleTypeChange}
            />
          </div>

          {/* 폼 필드 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SubmissionInfoCard
              selectedType={selectedType}
              visitorFormData={visitorFormData}
              kmapFormData={kmapFormData}
              loadingBusinessName={loadingBusinessName}
              minStartDate={minStartDate}
              isWeekendSubmission={isWeekendSubmission}
              totalDays={totalDays}
              onVisitorChange={setVisitorFormData}
              onKmapChange={setKmapFormData}
              onNaverPlaceUrlChange={handleNaverPlaceUrlChange}
              onKmapUrlChange={handleKmapUrlChange}
            />

            {selectedType === 'visitor' ? (
              <VisitorOptionsCard formData={visitorFormData} onChange={setVisitorFormData} />
            ) : (
              <KmapOptionsCard formData={kmapFormData} onChange={setKmapFormData} />
            )}
          </div>

          {/* 결제 정보 (하단으로 이동) */}
          <PaymentInfoCard
            selectedType={selectedType}
            currentService={currentService}
            totalCount={totalCount}
            totalCost={totalCost}
            totalDays={totalDays}
            dailyCount={dailyCount}
            visitorFormData={visitorFormData}
            kmapFormData={kmapFormData}
          />

          {/* 접수 버튼 */}
          <div className="flex justify-end">
            {!isPriceConfigured && !loadingPrice && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm w-full">
                ⚠️ 가격이 설정되지 않았습니다. 관리자에게 문의하세요.
              </div>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !isPriceConfigured || loadingPrice}
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
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  접수 신청하기
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 이메일 확인 다이얼로그 (네이버 영수증용) */}
      <EmailConfirmDialog
        open={showEmailConfirmDialog}
        onOpenChange={setShowEmailConfirmDialog}
        onConfirm={handleConfirmSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
