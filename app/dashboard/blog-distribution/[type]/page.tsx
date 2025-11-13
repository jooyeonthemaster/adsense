'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Zap, Users, Sparkles } from 'lucide-react';

type DistributionType = 'video' | 'auto' | 'reviewer';

// URL type 파라미터를 DistributionType으로 매핑
const mapTypeParam = (param: string): DistributionType => {
  const mapping: Record<string, DistributionType> = {
    'video': 'video',
    'auto': 'auto',
    'automation': 'auto',
    'reviewer': 'reviewer',
  };
  return mapping[param] || 'video';
};

// DistributionType을 URL 파라미터로 매핑
const mapTypeToUrl = (type: DistributionType): string => {
  const mapping: Record<DistributionType, string> = {
    'video': 'video',
    'auto': 'auto',
    'reviewer': 'reviewer',
  };
  return mapping[type] || 'video';
};

export default function BlogDistributionPage() {
  const params = useParams();
  const router = useRouter();
  const typeParam = params?.type as string;
  const [selectedType, setSelectedType] = useState<DistributionType>(mapTypeParam(typeParam));

  // URL 파라미터가 변경되면 selectedType 업데이트
  useEffect(() => {
    if (typeParam) {
      setSelectedType(mapTypeParam(typeParam));
    }
  }, [typeParam]);

  const services = [
    {
      id: 'video' as DistributionType,
      name: '영상 배포',
      icon: Video,
      color: 'bg-blue-500',
      available: true,
      pricePerPost: 15000,
      description: '영상 블로그 배포 서비스'
    },
    {
      id: 'auto' as DistributionType,
      name: '자동화 배포',
      icon: Zap,
      color: 'bg-emerald-500',
      available: true,
      pricePerPost: 10000,
      description: '자동화 블로그 배포'
    },
    {
      id: 'reviewer' as DistributionType,
      name: '리뷰어 배포',
      icon: Users,
      color: 'bg-amber-500',
      available: true,
      pricePerPost: 20000,
      description: '실계정 리뷰어 배포'
    },
  ];

  const [formData, setFormData] = useState({
    businessName: '',
    placeUrl: '',
    skipMapLink: false,
    contentType: 'review' as 'review' | 'info',
    dailyCount: 3,
    operationDays: 10,
    totalCount: 30,
    keywords: '',
    guideline: '',
    // 자동화 배포 전용
    externalAccountId: '',
    chargeCount: 0,
    useExternalAccount: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDailyCountChange = (value: number) => {
    const total = value * formData.operationDays;
    setFormData(prev => ({
      ...prev,
      dailyCount: value,
      totalCount: total,
    }));
  };

  const handleOperationDaysChange = (value: number) => {
    const total = formData.dailyCount * value;
    setFormData(prev => ({
      ...prev,
      operationDays: value,
      totalCount: total,
    }));
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
        alert('외부 계정 ID와 충전건수를 입력해주세요.');
        return;
      }
    } else {
      // 일반 접수 검증
      if (!formData.businessName) {
        alert('업체명을 입력해주세요.');
        return;
      }

      if (!formData.skipMapLink && !formData.placeUrl) {
        alert('플레이스 링크를 입력하거나 지도 삽입 생략을 선택해주세요.');
        return;
      }

      if (formData.dailyCount < 3) {
        alert('일 접수량은 최소 3건 이상이어야 합니다.');
        return;
      }

      if (formData.operationDays < 10) {
        alert('구동일수는 최소 10일 이상이어야 합니다.');
        return;
      }

      if (formData.totalCount < 30) {
        alert('총 작업수량은 최소 30건 이상이어야 합니다.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      console.log('접수 데이터:', { type: selectedType, ...formData });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const serviceName = services.find(s => s.id === selectedType)?.name;
      if (selectedType === 'auto' && formData.useExternalAccount) {
        alert('외부 계정 충전 요청이 완료되었습니다.');
      } else {
        alert(`${serviceName} 접수가 완료되었습니다.`);
      }

      // 폼 초기화
      setFormData({
        businessName: '',
        placeUrl: '',
        skipMapLink: false,
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
    } catch (error) {
      console.error('접수 실패:', error);
      alert('접수 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 상단 2열 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 왼쪽: 서비스 선택 및 결제 정보 */}
            <div className="space-y-4">
              {/* 서비스 선택 카드 */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 text-base">블로그 배포 서비스 선택</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">원하시는 배포 유형을 선택하세요</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-2 pt-0">
                  {services.map((service) => {
                    const Icon = service.icon;
                    const isSelected = selectedType === service.id;
                    const isAvailable = service.available;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => {
                          if (isAvailable) {
                            router.push(`/dashboard/blog-distribution/${mapTypeToUrl(service.id)}`);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`
                          relative w-full p-3 rounded-lg border-2 text-left transition-all duration-200
                          ${isSelected
                            ? 'border-sky-500 bg-sky-50 shadow-md'
                            : isAvailable
                              ? 'border-gray-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'
                              : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${service.color} ${!isAvailable && 'opacity-50'}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-sm ${isSelected ? 'text-sky-700' : 'text-gray-900'}`}>
                                {service.name}
                              </span>
                              {isSelected && (
                                <Badge variant="secondary" className="bg-sky-500 text-white text-xs px-2 py-0">
                                  선택됨
                                </Badge>
                              )}
                              {!isAvailable && (
                                <Badge variant="secondary" className="bg-gray-400 text-white text-xs px-2 py-0">
                                  준비중
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">{service.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* 결제 정보 카드 */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 text-base">결제 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* 총 작업수량 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-xs font-medium text-gray-700">총 작업수량</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-gray-900">
                        {formData.totalCount}
                      </span>
                      <span className="text-xs text-gray-600">건</span>
                    </div>
                  </div>

                  {/* 예상 비용 */}
                  <div className="p-3 rounded-lg bg-sky-500 shadow-md">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white">예상 비용</span>
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs px-2 py-0">
                          {formData.totalCount}건
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">
                          {calculateTotalCost().toLocaleString()}
                        </span>
                        <span className="text-sm text-white/90">P</span>
                      </div>
                      <div className="text-xs text-white/80">
                        일 {formData.dailyCount}건 × {formData.operationDays}일
                      </div>
                    </div>
                  </div>

                  {/* 가격 정보 */}
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="space-y-0.5 text-xs text-gray-700">
                      <div>건당 가격: {services.find(s => s.id === selectedType)?.pricePerPost.toLocaleString()}P</div>
                      <div>최소 수량: 30건 (일 3건 × 10일)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽: 접수 정보 입력 */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base">접수 정보</CardTitle>
                <CardDescription className="text-gray-600 text-sm">배포 서비스 접수에 필요한 정보를 입력하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* 자동화 배포 전용: 외부 계정 사용 여부 */}
                {selectedType === 'auto' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        id="useExternalAccount"
                        checked={formData.useExternalAccount}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useExternalAccount: checked === true }))}
                        className="h-5 w-5"
                      />
                      <label htmlFor="useExternalAccount" className="text-sm font-medium text-yellow-900 cursor-pointer select-none">
                        외부 계정 충전 요청 (승인된 회원만)
                      </label>
                    </div>
                    {formData.useExternalAccount && (
                      <div className="space-y-3 mt-3">
                        <div className="space-y-2">
                          <Label htmlFor="externalAccountId" className="text-xs font-medium text-gray-700">
                            계정 ID <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            id="externalAccountId"
                            type="text"
                            value={formData.externalAccountId}
                            onChange={(e) => setFormData(prev => ({ ...prev, externalAccountId: e.target.value }))}
                            placeholder="외부 계정 ID"
                            className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chargeCount" className="text-xs font-medium text-gray-700">
                            충전 건수 <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            id="chargeCount"
                            type="number"
                            min="1"
                            value={formData.chargeCount}
                            onChange={(e) => setFormData(prev => ({ ...prev, chargeCount: Number(e.target.value) }))}
                            placeholder="충전할 건수"
                            className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 일반 접수 필드 (외부 계정 미사용 시에만 표시) */}
                {!(selectedType === 'auto' && formData.useExternalAccount) && (
                  <>
                    {/* 업체명 */}
                    <div className="space-y-2">
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

                    {/* 플레이스 링크 */}
                    <div className="space-y-2">
                      <Label htmlFor="placeUrl" className="text-xs font-medium text-gray-700">
                        플레이스 링크 {!formData.skipMapLink && <span className="text-rose-500">*</span>}
                      </Label>
                      <Input
                        id="placeUrl"
                        type="url"
                        value={formData.placeUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, placeUrl: e.target.value }))}
                        placeholder="https://m.place.naver.com/place/..."
                        className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                        disabled={formData.skipMapLink}
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="skipMapLink"
                          checked={formData.skipMapLink}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            skipMapLink: checked === true,
                            placeUrl: checked ? '' : prev.placeUrl
                          }))}
                          className="h-4 w-4"
                        />
                        <label htmlFor="skipMapLink" className="text-xs text-gray-600 cursor-pointer select-none">
                          지도 삽입 생략
                        </label>
                      </div>
                    </div>

                    {/* 콘텐츠 종류 */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700">
                        콘텐츠 종류 <span className="text-rose-500">*</span>
                      </Label>
                      <RadioGroup
                        value={formData.contentType}
                        onValueChange={(value: 'review' | 'info') =>
                          setFormData(prev => ({ ...prev, contentType: value }))
                        }
                        className="flex gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="review" id="review" className="h-4 w-4" />
                          <label htmlFor="review" className="text-sm text-gray-700 cursor-pointer select-none">
                            후기성
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="info" id="info" className="h-4 w-4" />
                          <label htmlFor="info" className="text-sm text-gray-700 cursor-pointer select-none">
                            정보성
                          </label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 일 접수량 & 구동일수 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="dailyCount" className="text-xs font-medium text-gray-700">
                          일 접수량 (최소 3건) <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="dailyCount"
                          type="number"
                          min="3"
                          value={formData.dailyCount}
                          onChange={(e) => handleDailyCountChange(Number(e.target.value))}
                          className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="operationDays" className="text-xs font-medium text-gray-700">
                          구동일수 (최소 10일) <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="operationDays"
                          type="number"
                          min="10"
                          value={formData.operationDays}
                          onChange={(e) => handleOperationDaysChange(Number(e.target.value))}
                          className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                        />
                      </div>
                    </div>

                    {/* 총 작업수량 표시 */}
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-600">총 작업수량: </span>
                      <span className="text-base font-bold text-gray-900">
                        {formData.totalCount}건
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        (일 {formData.dailyCount}건 × {formData.operationDays}일)
                      </span>
                      {formData.totalCount < 30 && (
                        <p className="text-xs text-rose-600 mt-1">
                          ⚠ 최소 30건 이상이어야 합니다.
                        </p>
                      )}
                    </div>

                    {/* 키워드 */}
                    <div className="space-y-2">
                      <Label htmlFor="keywords" className="text-xs font-medium text-gray-700">
                        키워드
                      </Label>
                      <Input
                        id="keywords"
                        type="text"
                        value={formData.keywords}
                        onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                        placeholder="키워드를 입력하세요 (쉼표로 구분)"
                        className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                      />
                      <span className="text-xs text-gray-500">여러 키워드는 쉼표(,)로 구분하여 입력하세요</span>
                    </div>

                    {/* 리뷰어 배포 전용: 가이드라인 */}
                    {selectedType === 'reviewer' && (
                      <div className="space-y-2">
                        <Label htmlFor="guideline" className="text-xs font-medium text-gray-700">
                          가이드라인
                        </Label>
                        <Textarea
                          id="guideline"
                          value={formData.guideline}
                          onChange={(e) => setFormData(prev => ({ ...prev, guideline: e.target.value }))}
                          placeholder="작성 가이드라인을 입력하세요"
                          className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[100px]"
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 하단: 접수 신청 버튼 */}
          <Card className="border-gray-200">
            <CardContent className="pt-4">
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
