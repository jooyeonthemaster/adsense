'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, Image, Users, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';
import { extractNaverPlaceMID, fetchBusinessInfoByMID } from '@/utils/naver-place';
import { format } from 'date-fns';
import {
  ServiceType,
  ServiceConfig,
  ExperienceFormData,
  mapServiceParam,
  mapServiceToUrl,
  mapServiceToSlug,
} from '@/types/experience/service-types';
import { ServiceSelector } from '@/components/dashboard/experience/service/ServiceSelector';
import { PaymentInfo } from '@/components/dashboard/experience/service/PaymentInfo';
import { BasicInfoForm } from '@/components/dashboard/experience/service/BasicInfoForm';
import { VisitInfoSection } from '@/components/dashboard/experience/service/VisitInfoSection';
import { KeywordSection } from '@/components/dashboard/experience/service/KeywordSection';
import { ReporterSection } from '@/components/dashboard/experience/service/ReporterSection';

export default function ExperienceServicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const serviceParam = params?.service as string;
  
  const [selectedService, setSelectedService] = useState<ServiceType>(mapServiceParam(serviceParam));
  const [formData, setFormData] = useState<ExperienceFormData>({
    businessName: '',
    placeUrl: '',
    placeMid: '',
    providedItems: '',
    teamCount: 1,
    availableDays: [],
    availableTimeStart: '11:00',
    availableTimeEnd: '21:00',
    guideline: '',
    keywords: [],
    publishDates: [],
    progressKeyword: '',
    hasImage: false,
    emailImageConfirmed: false,
    email: '',
    images: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [activeProducts, setActiveProducts] = useState<string[]>([]);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingBusinessName, setLoadingBusinessName] = useState(false);

  // URL 파라미터가 변경되면 selectedService 업데이트
  useEffect(() => {
    if (serviceParam) {
      setSelectedService(mapServiceParam(serviceParam));
    }
  }, [serviceParam]);

  // 가격 정보 및 활성화 상품 불러오기
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.success) {
          if (data.pricing) {
            setPricing(data.pricing);
          }
          if (data.activeProducts) {
            setActiveProducts(data.activeProducts);
          }
        }
      } catch (error) {
        console.error('가격 정보 로드 실패:', error);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPricing();
  }, []);

  // 전체 서비스 목록
  // - available: is_active 기반 (관리자 숨김 토글) - 버튼 표시 여부
  // - pricePerTeam: 가격 기반 - "준비중" 표시 여부
  const allServices: ServiceConfig[] = [
    { id: 'blog', name: '블로그', icon: BookText, color: 'bg-blue-500', available: activeProducts.includes('blog-experience'), pricePerTeam: pricing['blog-experience'] || 0, description: '2주 이내 블로거 리스트 제공' },
    { id: 'xiaohongshu', name: '샤오홍슈', icon: Image, color: 'bg-rose-500', available: activeProducts.includes('xiaohongshu'), pricePerTeam: pricing['xiaohongshu'] || 0, description: '중국 소셜 마케팅' },
    { id: 'reporter', name: '실계정 기자단', icon: Users, color: 'bg-emerald-500', available: activeProducts.includes('journalist'), pricePerTeam: pricing['journalist'] || 0, description: '실제 기자 계정 활용' },
    { id: 'influencer', name: '블로그 인플루언서', icon: Star, color: 'bg-amber-500', available: activeProducts.includes('influencer'), pricePerTeam: pricing['influencer'] || 0, description: '인플루언서 마케팅' },
  ];

  // is_active=false인 서비스는 UI에서 완전히 숨김
  const services = allServices.filter(s => s.available);

  // 현재 선택된 서비스가 숨김 처리된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (!loadingPrice) {
      const currentService = allServices.find(s => s.id === selectedService);
      if (currentService && !currentService.available) {
        toast({
          variant: 'destructive',
          title: '서비스 이용 불가',
          description: '현재 이용할 수 없는 서비스입니다.',
        });
        router.push('/dashboard');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingPrice, selectedService, activeProducts]);

  // 선택된 서비스의 가격이 설정되어 있는지 확인
  const selectedServicePrice = services.find(s => s.id === selectedService)?.pricePerTeam;
  const isPriceConfigured = !!(selectedServicePrice && selectedServicePrice > 0);

  const handleServiceChange = (serviceId: ServiceType) => {
    router.push(`/dashboard/experience/${mapServiceToUrl(serviceId)}`);
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));
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
    const service = services.find(s => s.id === selectedService);
    if (!service) return 0;
    return formData.teamCount * service.pricePerTeam;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 공통 필수 필드 검증
    if (!formData.businessName || !formData.placeUrl) {
      toast({
        variant: 'destructive',
        title: '필수 항목 누락',
        description: '필수 항목을 모두 입력해주세요.',
      });
      return;
    }

    // 서비스별 필수 필드 검증
    if (selectedService === 'blog' || selectedService === 'xiaohongshu' || selectedService === 'influencer') {
      if (!formData.providedItems) {
        toast({
          variant: 'destructive',
          title: '필수 항목 누락',
          description: '제공내역을 입력해주세요.',
        });
        return;
      }
      if (formData.availableDays.length === 0) {
        toast({
          variant: 'destructive',
          title: '필수 항목 누락',
          description: '방문가능요일을 최소 1개 이상 선택해주세요.',
        });
        return;
      }
    }

    if (selectedService === 'reporter') {
      if (formData.publishDates.length === 0 || !formData.progressKeyword || !formData.guideline) {
        toast({
          variant: 'destructive',
          title: '필수 항목 누락',
          description: '희망 발행일, 진행 키워드, 가이드를 모두 입력해주세요.',
        });
        return;
      }
      if (formData.hasImage && !formData.emailImageConfirmed) {
        toast({
          variant: 'destructive',
          title: '필수 항목 누락',
          description: '이미지를 이메일(sense-ad@naver.com)로 전송했는지 확인해주세요.',
        });
        return;
      }
    }

    if (selectedService === 'influencer' && formData.teamCount > 10) {
      toast({
        variant: 'destructive',
        title: '팀 수 초과',
        description: '블로그 인플루언서는 최대 10팀까지만 가능합니다.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 이미지는 이메일로 받음 (sense-ad@naver.com)
      // 더 이상 직접 업로드하지 않음
      const imageUrls: string[] = [];

      const serviceName = services.find(s => s.id === selectedService)?.name;

      // API 호출
      const response = await fetch('/api/submissions/experience/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: selectedService,
          businessName: formData.businessName,
          placeUrl: formData.placeUrl,
          teamCount: formData.teamCount,
          keywords: formData.keywords,
          guideline: formData.guideline,
          availableDays: formData.availableDays,
          availableTimeStart: formData.availableTimeStart,
          availableTimeEnd: formData.availableTimeEnd,
          providedItems: formData.providedItems,
          publishDate: formData.publishDates.map(d => format(d, 'yyyy-MM-dd')).join(', '),
          progressKeyword: formData.progressKeyword,
          hasImage: formData.hasImage,
          email: formData.email,
          imageUrls: imageUrls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '접수 중 오류가 발생했습니다.');
      }

      // 성공 토스트 메시지
      toast({
        title: `✅ ${serviceName} 접수 완료!`,
        description: `차감 포인트: ${data.total_points.toLocaleString()}P`,
        duration: 5000,
      });

      // 성공 시 통합 접수 현황 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/submissions');
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error('접수 실패:', error);
      toast({
        variant: 'destructive',
        title: '접수 실패',
        description: error.message || '접수 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceKey = mapServiceToSlug(selectedService);
  const selectedServiceConfig = services.find(s => s.id === selectedService);

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-7xl mx-auto">
        <ProductGuideSection productKey={serviceKey} />
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 왼쪽 열: 서비스 선택 + 결제 정보 */}
          <div className="space-y-4">
            <ServiceSelector
              services={services}
              selectedService={selectedService}
              onServiceChange={handleServiceChange}
            />

            <PaymentInfo
              teamCount={formData.teamCount}
              totalCost={calculateTotalCost()}
              selectedService={selectedServiceConfig}
              isSubmitting={isSubmitting}
              isPriceConfigured={isPriceConfigured}
              loadingPrice={loadingPrice}
            />
          </div>

          {/* 오른쪽 열: 기본 정보 + 조건부 섹션 */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 text-base">기본 정보</CardTitle>
              <CardDescription className="text-gray-600 text-sm">필수 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              <BasicInfoForm
                formData={formData}
                selectedService={selectedService}
                loadingBusinessName={loadingBusinessName}
                onPlaceUrlChange={handlePlaceUrlChange}
                onFormChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
              />

              {/* 방문 정보: 블로그 & 샤오홍슈 & 인플루언서 */}
              {(selectedService === 'blog' || selectedService === 'xiaohongshu' || selectedService === 'influencer') && (
                <VisitInfoSection
                  formData={formData}
                  onFormChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                  onToggleDay={toggleDay}
                />
              )}

              {/* 키워드 섹션: 블로그 & 인플루언서 */}
              {(selectedService === 'blog' || selectedService === 'influencer') && (
                <KeywordSection
                  formData={formData}
                  onFormChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                />
              )}

              {/* 실계정 기자단 전용 필드 */}
              {selectedService === 'reporter' && (
                <ReporterSection
                  formData={formData}
                  onFormChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                />
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
