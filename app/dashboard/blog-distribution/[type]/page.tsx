'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';
import { extractNaverPlaceMID, fetchBusinessInfoByMID } from '@/utils/naver-place';
import { Video, Zap, Users } from 'lucide-react';
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

  const [formData, setFormData] = useState<BlogDistributionFormData>({
    businessName: '',
    placeUrl: '',
    placeMid: '',
    linkType: 'place',
    contentType: 'review',
    dailyCount: 3,
    operationDays: 10,
    totalCount: 30,
    keywords: '',
    guideline: '',
    externalAccountId: '',
    chargeCount: 0,
    useExternalAccount: false,
  });

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
    const total = value * formData.operationDays;
    setFormData(prev => ({ ...prev, dailyCount: value, totalCount: total }));
  };

  const handleOperationDaysChange = (value: number) => {
    const total = formData.dailyCount * value;
    setFormData(prev => ({ ...prev, operationDays: value, totalCount: total }));
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
    return formData.totalCount * pricePerPost;
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

      if (formData.dailyCount < 3 || formData.operationDays < 10 || formData.totalCount < 30) {
        toast({
          variant: 'destructive',
          title: '입력 오류',
          description: '일 접수량 최소 3건, 구동일수 최소 10일, 총 작업수량 최소 30건이 필요합니다.',
        });
        return;
      }
    }

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
        total_count: formData.totalCount,
        total_points: totalCost,
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
                totalCount={formData.totalCount}
                totalCost={calculateTotalCost()}
                selectedService={selectedService}
                dailyCount={formData.dailyCount}
                operationDays={formData.operationDays}
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
                  onOperationDaysChange={handleOperationDaysChange}
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
    </div>
  );
}
