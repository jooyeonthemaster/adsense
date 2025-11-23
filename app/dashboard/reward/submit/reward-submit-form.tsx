'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractNaverPlaceMID, fetchBusinessInfoByMID } from '@/utils/naver-place';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';

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
    operationDays: 7,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricePerHit, setPricePerHit] = useState<number>(10);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingBusinessName, setLoadingBusinessName] = useState(false);

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
    const totalCount = formData.dailyVolume * formData.operationDays;
    return Math.round((totalCount / 100) * pricePerHit);
  };

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
          total_days: formData.operationDays,
          total_points: totalCost,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '접수 중 오류가 발생했습니다.');
      }

      toast({
        title: '✅ 리워드 접수 완료',
        description: `${formData.businessName} - ${formData.dailyVolume}타/일 × ${formData.operationDays}일 접수가 완료되었습니다.`,
        duration: 5000,
      });

      // 폼 초기화
      setFormData({
        twopleSelected: true, // 투플 기본 선택 유지
        businessName: '',
        placeUrl: '',
        placeMid: '',
        dailyVolume: 100,
        operationDays: 7,
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
                    min="100"
                    step="100"
                    value={formData.dailyVolume}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailyVolume: Number(e.target.value) }))}
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                  <span className="text-xs text-gray-500">100단위로 입력 (100, 200, 300...)</span>
                </div>

                {/* 구동일수 */}
                <div className="space-y-1.5">
                  <Label htmlFor="operationDays" className="text-xs font-medium text-gray-700">
                    구동일수 (기본 7일) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="operationDays"
                    type="number"
                    min="1"
                    value={formData.operationDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, operationDays: Number(e.target.value) }))}
                    placeholder="7"
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                  <span className="text-xs text-gray-500">원하는 구동일수를 입력하세요 (기본 7일)</span>
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
                {/* 보유 포인트 */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-xs font-medium text-gray-700">보유 포인트</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      {initialPoints.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600">P</span>
                  </div>
                </div>

                {/* 예상 비용 */}
                <div className="p-3 rounded-lg bg-sky-500 shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">예상 비용</span>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs px-2 py-0">
                        총 {(formData.dailyVolume * formData.operationDays).toLocaleString()}타
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">
                        {totalCost.toLocaleString()}
                      </span>
                      <span className="text-sm text-white/90">P</span>
                    </div>
                    <div className="text-xs text-white/80">
                      일 {formData.dailyVolume.toLocaleString()}타 × {formData.operationDays}일
                    </div>
                  </div>
                </div>
              </div>

              {/* 접수 신청 버튼 */}
              <Button
                type="submit"
                disabled={isSubmitting || !formData.twopleSelected}
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
