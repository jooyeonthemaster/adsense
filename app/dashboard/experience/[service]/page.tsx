'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookText, Image, Users, Sparkles, Star, Clock, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ServiceType = 'blog' | 'xiaohongshu' | 'reporter' | 'influencer';

interface KeywordPair {
  main: string;
  sub: string;
}

// URL service 파라미터를 ServiceType으로 매핑
const mapServiceParam = (param: string): ServiceType => {
  const mapping: Record<string, ServiceType> = {
    'blog': 'blog',
    'xiaohongshu': 'xiaohongshu',
    'journalist': 'reporter',
    'reporter': 'reporter',
    'influencer': 'influencer',
  };
  return mapping[param] || 'blog';
};

// ServiceType을 URL 파라미터로 매핑
const mapServiceToUrl = (service: ServiceType): string => {
  const mapping: Record<ServiceType, string> = {
    'blog': 'blog',
    'xiaohongshu': 'xiaohongshu',
    'reporter': 'journalist',
    'influencer': 'influencer',
  };
  return mapping[service] || 'blog';
};

// ServiceType을 DB slug로 매핑
const mapServiceToSlug = (service: ServiceType): string => {
  const mapping: Record<ServiceType, string> = {
    'blog': 'blog-experience',
    'xiaohongshu': 'xiaohongshu',
    'reporter': 'journalist',
    'influencer': 'influencer',
  };
  return mapping[service];
};

export default function ExperienceServicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const serviceParam = params?.service as string;
  const [selectedService, setSelectedService] = useState<ServiceType>(mapServiceParam(serviceParam));
  const [formData, setFormData] = useState({
    businessName: '',
    placeUrl: '',
    providedItems: '',
    teamCount: 1,
    availableDays: [] as string[],
    availableTimeStart: '11:00',
    availableTimeEnd: '21:00',
    guideline: '',
    keywords: [] as KeywordPair[],
    // 실계정 기자단 전용
    publishDate: '',
    progressKeyword: '',
    hasImage: false,
    email: '',
  });

  const [keywordInput, setKeywordInput] = useState({ main: '', sub: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [loadingPrice, setLoadingPrice] = useState(true);

  // URL 파라미터가 변경되면 selectedService 업데이트
  useEffect(() => {
    if (serviceParam) {
      setSelectedService(mapServiceParam(serviceParam));
    }
  }, [serviceParam]);

  // 가격 정보 불러오기
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.success && data.pricing) {
          setPricing(data.pricing);
        }
      } catch (error) {
        console.error('가격 정보 로드 실패:', error);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPricing();
  }, []);

  const services = [
    { id: 'blog' as ServiceType, name: '블로그', icon: BookText, color: 'bg-blue-500', available: true, pricePerTeam: pricing['blog-experience'] || 50000, description: '2주 이내 블로거 리스트 제공' },
    { id: 'xiaohongshu' as ServiceType, name: '샤오홍슈', icon: Image, color: 'bg-rose-500', available: true, pricePerTeam: pricing['xiaohongshu'] || 70000, description: '중국 소셜 마케팅' },
    { id: 'reporter' as ServiceType, name: '실계정 기자단', icon: Users, color: 'bg-emerald-500', available: true, pricePerTeam: pricing['journalist'] || 60000, description: '실제 기자 계정 활용' },
    { id: 'influencer' as ServiceType, name: '블로그 인플루언서', icon: Star, color: 'bg-amber-500', available: true, pricePerTeam: pricing['influencer'] || 80000, description: '인플루언서 마케팅' },
  ];

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const addKeyword = () => {
    if (keywordInput.main.trim() && keywordInput.sub.trim() && formData.keywords.length < 5) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, { main: keywordInput.main.trim(), sub: keywordInput.sub.trim() }],
      }));
      setKeywordInput({ main: '', sub: '' });
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  };

  const calculateTotalCost = () => {
    const service = services.find(s => s.id === selectedService);
    if (!service) return 0;
    return formData.teamCount * service.pricePerTeam;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 공통 필수 필드: 업체명, 플레이스 링크
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
      if (!formData.publishDate || !formData.progressKeyword || !formData.guideline) {
        toast({
          variant: 'destructive',
          title: '필수 항목 누락',
          description: '희망 발행일, 진행 키워드, 가이드를 모두 입력해주세요.',
        });
        return;
      }
      if (formData.hasImage && !formData.email) {
        toast({
          variant: 'destructive',
          title: '필수 항목 누락',
          description: '이미지 첨부 시 이메일을 입력해주세요.',
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
          publishDate: formData.publishDate,
          progressKeyword: formData.progressKeyword,
          hasImage: formData.hasImage,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '접수 중 오류가 발생했습니다.');
      }

      // 성공 토스트 메시지
      if (selectedService === 'blog') {
        toast({
          title: '✅ 블로그 체험단 접수 완료!',
          description: (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-gray-600">2주 이내에 블로거 리스트가 등록됩니다.</p>
              <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg border border-sky-200">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-sky-900">
                  차감 포인트: {data.total_points.toLocaleString()}P
                </span>
              </div>
            </div>
          ) as React.ReactNode,
          duration: 5000,
        });
      } else {
        toast({
          title: `✅ ${serviceName} 접수 완료!`,
          description: (
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg border border-sky-200">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-sky-900">
                  차감 포인트: {data.total_points.toLocaleString()}P
                </span>
              </div>
            </div>
          ) as React.ReactNode,
          duration: 5000,
        });
      }

      // 성공 시 접수 현황 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/experience/status');
        router.refresh(); // 서버 데이터 새로고침
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

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 왼쪽 열: 서비스 선택 + 결제 정보 */}
          <div className="space-y-4">
            {/* 서비스 선택 */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base">체험 서비스 선택</CardTitle>
                <CardDescription className="text-gray-600 text-sm">원하시는 서비스를 선택하세요</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 pt-0">
                {services.map((service) => {
                  const Icon = service.icon;
                  const isSelected = selectedService === service.id;
                  const isAvailable = service.available;

                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        if (isAvailable) {
                          router.push(`/dashboard/experience/${mapServiceToUrl(service.id)}`);
                        }
                      }}
                      disabled={!isAvailable}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50 shadow-md scale-105'
                          : isAvailable
                          ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-3 rounded-lg ${isSelected ? 'bg-sky-500' : isAvailable ? service.color : 'bg-gray-300'}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-sky-900' : 'text-gray-700'}`}>
                          {service.name}
                        </span>
                        {!isAvailable && (
                          <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                            준비중
                          </Badge>
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 h-6 w-6 bg-sky-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* 결제 정보 */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base">결제 정보</CardTitle>
                <CardDescription className="text-gray-600 text-sm">예상 비용을 확인하고 접수하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-1 gap-3">
                  {/* 희망 팀수 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-xs font-medium text-gray-700">희망 팀수</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-gray-900">{formData.teamCount}</span>
                      <span className="text-xs text-gray-600">팀</span>
                    </div>
                  </div>

                  {/* 예상 비용 */}
                  <div className="p-3 rounded-lg bg-sky-500 shadow-md">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white">예상 비용</span>
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs px-2 py-0">
                          {formData.teamCount}팀
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">
                          {calculateTotalCost().toLocaleString()}
                        </span>
                        <span className="text-sm text-white/90">P</span>
                      </div>
                      <div className="text-xs text-white/80">
                        팀당 {services.find(s => s.id === selectedService)?.pricePerTeam.toLocaleString()}P
                      </div>
                    </div>
                  </div>

                  {/* 서비스 정보 */}
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-start gap-3">
                      {(() => {
                        const service = services.find(s => s.id === selectedService);
                        const Icon = service?.icon;
                        return Icon ? (
                          <div className={`p-2 rounded-lg ${service.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                        ) : null;
                      })()}
                      <div className="flex-1 space-y-1">
                        <span className="text-xs font-medium text-gray-600">선택 서비스</span>
                        <div className="text-lg font-bold text-gray-900 break-words">
                          {services.find(s => s.id === selectedService)?.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {services.find(s => s.id === selectedService)?.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 접수 신청 버튼 */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
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
          </div>

          {/* 오른쪽 열: 기본 정보 + 방문 정보 및 가이드 */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 text-base">기본 정보</CardTitle>
              <CardDescription className="text-gray-600 text-sm">필수 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {/* 공통 필드: 업체명, 플레이스 링크, 제공내역, 희망 팀수 */}
              <div className="space-y-1.5">
                <Label htmlFor="businessName" className="text-xs font-medium text-gray-700">
                  업체명 <span className="text-rose-500">*</span>
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

              <div className="space-y-1.5">
                <Label htmlFor="placeUrl" className="text-xs font-medium text-gray-700">
                  플레이스 링크 <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="placeUrl"
                  type="url"
                  value={formData.placeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, placeUrl: e.target.value }))}
                  placeholder="https://m.place.naver.com/place/..."
                  className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                />
                <span className="text-xs text-gray-500">배송형은 상품링크를 입력하세요</span>
              </div>

              {/* 제공내역: 실계정 기자단 제외 */}
              {selectedService !== 'reporter' && (
                <div className="space-y-1.5">
                  <Label htmlFor="providedItems" className="text-xs font-medium text-gray-700">
                    제공내역 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="providedItems"
                    type="text"
                    value={formData.providedItems}
                    onChange={(e) => setFormData(prev => ({ ...prev, providedItems: e.target.value }))}
                    placeholder="예) 2인 식사권, 제품 1개 등"
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="teamCount" className="text-xs font-medium text-gray-700">
                  희망 팀수 <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="teamCount"
                  type="number"
                  min="1"
                  max={selectedService === 'influencer' ? 10 : undefined}
                  value={formData.teamCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamCount: Number(e.target.value) }))}
                  className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                />
                <span className="text-xs text-gray-500">
                  {selectedService === 'influencer' ? '최대 10팀까지 가능합니다' : '체험단 팀 수를 입력하세요'}
                </span>
              </div>

              {/* 블로그 & 샤오홍슈 & 블로그 인플루언서 공통: 방문 정보 */}
              {(selectedService === 'blog' || selectedService === 'xiaohongshu' || selectedService === 'influencer') && (
                <>
                  {/* 구분선 */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* 방문가능요일 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">
                      방문가능요일 <span className="text-rose-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      {weekDays.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                            formData.availableDays.includes(day)
                              ? 'bg-sky-500 text-white border-sky-500 shadow-md scale-105'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-sky-400 hover:bg-sky-50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 방문가능시간대 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="timeStart" className="text-xs font-medium text-gray-700">
                        방문가능시간 (시작)
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="timeStart"
                          type="time"
                          value={formData.availableTimeStart}
                          onChange={(e) => setFormData(prev => ({ ...prev, availableTimeStart: e.target.value }))}
                          className="pl-10 border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="timeEnd" className="text-xs font-medium text-gray-700">
                        방문가능시간 (종료)
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="timeEnd"
                          type="time"
                          value={formData.availableTimeEnd}
                          onChange={(e) => setFormData(prev => ({ ...prev, availableTimeEnd: e.target.value }))}
                          className="pl-10 border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 블로그 & 블로그 인플루언서 전용: 가이드 & 키워드 */}
              {(selectedService === 'blog' || selectedService === 'influencer') && (
                <>
                  {/* 작성 시 참고 가이드라인 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="guideline" className="text-xs font-medium text-gray-700">
                      작성 시 참고 가이드라인
                    </Label>
                    <Textarea
                      id="guideline"
                      value={formData.guideline}
                      onChange={(e) => setFormData(prev => ({ ...prev, guideline: e.target.value }))}
                      placeholder="블로거가 참고할 가이드라인을 입력하세요"
                      className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[80px]"
                    />
                  </div>

                  {/* 포스팅 내 희망 키워드 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">
                      포스팅 내 희망 키워드 (최대 5개)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="메인 키워드 (예: 강남)"
                        value={keywordInput.main}
                        onChange={(e) => setKeywordInput(prev => ({ ...prev, main: e.target.value }))}
                        disabled={formData.keywords.length >= 5}
                        className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="서브 키워드 (예: 맛집)"
                          value={keywordInput.sub}
                          onChange={(e) => setKeywordInput(prev => ({ ...prev, sub: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                          disabled={formData.keywords.length >= 5}
                          className="flex-1 border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                        />
                        <Button
                          type="button"
                          onClick={addKeyword}
                          disabled={formData.keywords.length >= 5 || !keywordInput.main.trim() || !keywordInput.sub.trim()}
                          className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white text-sm"
                        >
                          추가
                        </Button>
                      </div>
                    </div>
                    {formData.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.keywords.map((keyword, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1.5 bg-sky-100 text-sky-700 rounded-lg text-sm border border-sky-200"
                          >
                            <span className="font-medium">{keyword.main}</span>
                            <span className="text-sky-400">/</span>
                            <span>{keyword.sub}</span>
                            <button
                              type="button"
                              onClick={() => removeKeyword(index)}
                              className="ml-1 hover:bg-sky-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      메인/서브 키워드 쌍을 최대 5개까지 추가할 수 있습니다 ({formData.keywords.length}/5)
                    </span>
                  </div>
                </>
              )}

              {/* 실계정 기자단 전용 필드 */}
              {selectedService === 'reporter' && (
                <>
                  {/* 구분선 */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* 희망 발행일 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="publishDate" className="text-xs font-medium text-gray-700">
                      희망 발행일 기재 <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="publishDate"
                      type="text"
                      value={formData.publishDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                      placeholder="예) 2024-01-15, 2024-01-20 (여러 날짜 기입 가능)"
                      className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                    />
                    <span className="text-xs text-gray-500">여러 날짜를 쉼표로 구분하여 입력하세요</span>
                  </div>

                  {/* 진행 키워드 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="progressKeyword" className="text-xs font-medium text-gray-700">
                      진행 키워드 기재 <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="progressKeyword"
                      type="text"
                      value={formData.progressKeyword}
                      onChange={(e) => setFormData(prev => ({ ...prev, progressKeyword: e.target.value }))}
                      placeholder="예) 강남 맛집, 서울 카페"
                      className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                    />
                  </div>

                  {/* 가이드 기재 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reporterGuideline" className="text-xs font-medium text-gray-700">
                      가이드 기재 <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="reporterGuideline"
                      value={formData.guideline}
                      onChange={(e) => setFormData(prev => ({ ...prev, guideline: e.target.value }))}
                      placeholder="기자단이 참고할 가이드를 입력하세요"
                      className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[100px]"
                    />
                  </div>

                  {/* 이미지 첨부 여부 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">
                      이미지 첨부 여부
                    </Label>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="hasImage"
                        checked={formData.hasImage}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasImage: checked === true }))}
                        className="h-5 w-5"
                      />
                      <label htmlFor="hasImage" className="text-sm font-medium cursor-pointer select-none text-gray-700">
                        이미지 첨부
                      </label>
                    </div>
                  </div>

                  {/* 이미지 첨부 시 이메일 입력 */}
                  {formData.hasImage && (
                    <div className="space-y-1.5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label htmlFor="email" className="text-xs font-medium text-blue-700">
                        이메일 주소 <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="이미지를 받을 이메일 주소"
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 h-9 text-sm"
                      />
                      <span className="text-xs text-blue-600">이미지 파일을 받을 이메일 주소를 입력하세요</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
