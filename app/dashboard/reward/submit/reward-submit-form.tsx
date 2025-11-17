'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface RewardSubmitFormProps {
  initialPoints: number;
}

export default function RewardSubmitForm({ initialPoints }: RewardSubmitFormProps) {
  const [formData, setFormData] = useState({
    twopleSelected: false,
    businessName: '',
    placeUrl: '',
    placeMid: '',
    dailyVolume: 100,
    operationDays: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricePerHit, setPricePerHit] = useState<number>(10);
  const [loadingPrice, setLoadingPrice] = useState(true);

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

  // 플레이스 링크에서 MID 자동 추출
  const extractMidFromUrl = (url: string) => {
    try {
      const match = url.match(/place\/(\d+)/);
      if (match && match[1]) {
        setFormData(prev => ({ ...prev, placeMid: match[1] }));
      } else {
        setFormData(prev => ({ ...prev, placeMid: '' }));
      }
    } catch (error) {
      console.error('MID 추출 실패:', error);
      setFormData(prev => ({ ...prev, placeMid: '' }));
    }
  };

  const handlePlaceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, placeUrl: url }));
    extractMidFromUrl(url);
  };

  // 비용 계산
  const calculateTotalCost = () => {
    return formData.dailyVolume * formData.operationDays * pricePerHit;
  };

  const totalCost = calculateTotalCost();

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.twopleSelected) {
      alert('투플 매체를 선택해주세요.');
      return;
    }

    if (!formData.businessName || !formData.placeUrl) {
      alert('업체명과 플레이스 링크를 입력해주세요.');
      return;
    }

    if (!formData.placeMid) {
      alert('플레이스 링크에서 MID를 추출할 수 없습니다. 올바른 링크를 입력해주세요.');
      return;
    }

    if (formData.dailyVolume < 100) {
      alert('일 접수량은 최소 100타 이상이어야 합니다.');
      return;
    }

    if (totalCost > initialPoints) {
      alert('보유 포인트가 부족합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('접수 데이터:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('리워드 접수가 완료되었습니다.');

      setFormData({
        twopleSelected: false,
        businessName: '',
        placeUrl: '',
        placeMid: '',
        dailyVolume: 100,
        operationDays: 1,
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
            {/* 왼쪽: 매체 선택 */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base">매체 선택</CardTitle>
                <CardDescription className="text-gray-600 text-sm">투플 매체를 선택하세요</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    투플 매체 <span className="text-rose-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, twopleSelected: true }))}
                    className={`group relative w-full p-4 rounded-lg border-2 transition-all duration-300 ${
                      formData.twopleSelected
                        ? 'border-sky-500 bg-sky-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative flex flex-col items-center gap-2">
                      <div className="text-4xl">📱</div>
                      <div>
                        <div className="font-bold text-lg text-gray-900">투플</div>
                        <div className="text-xs text-gray-500 mt-0.5">Premium Reward Platform</div>
                      </div>
                      {formData.twopleSelected && (
                        <Badge className="bg-sky-500 text-white border-0 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          선택됨
                        </Badge>
                      )}
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* 오른쪽: 접수 정보 입력 */}
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
                    구동일수 선택 <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.operationDays.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, operationDays: Number(value) }))}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm">
                      <SelectValue placeholder="구동일수 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 10, 14, 20, 30].map((days) => (
                        <SelectItem key={days} value={days.toString()}>
                          {days}일
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                {/* 잔여 포인트 */}
                <div className={`p-3 rounded-lg border shadow-md ${
                  initialPoints - totalCost >= 0
                    ? 'bg-emerald-500 border-emerald-600'
                    : 'bg-rose-500 border-rose-600'
                }`}>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-white">접수 후 잔여</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">
                        {(initialPoints - totalCost).toLocaleString()}
                      </span>
                      <span className="text-sm text-white/90">P</span>
                    </div>
                    <div className="text-xs text-white/80">
                      {initialPoints - totalCost >= 0 ? '접수 가능' : '포인트 부족'}
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
