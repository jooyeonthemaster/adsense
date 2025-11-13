'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coffee, Sparkles, Camera } from 'lucide-react';

// 지역별 카페 데이터
const cafesByRegion: Record<string, string[]> = {
  '강남구': ['강남 맘카페', '강남 육아카페', '강남 지역정보', '강남 맛집카페', '강남 생활정보'],
  '서초구': ['서초 맘카페', '서초 육아카페', '서초 지역정보', '서초 맛집카페'],
  '송파구': ['송파 맘카페', '송파 육아카페', '송파 지역정보', '송파 부동산카페'],
  '강동구': ['강동 맘카페', '강동 육아카페', '강동 지역정보'],
  '마포구': ['마포 맘카페', '마포 육아카페', '마포 지역정보', '마포 맛집카페'],
  '영등포구': ['영등포 맘카페', '영등포 육아카페', '영등포 지역정보'],
  '용산구': ['용산 맘카페', '용산 지역정보', '용산 맛집카페'],
  '성동구': ['성동 맘카페', '성동 육아카페', '성동 지역정보'],
};

export default function CafeMarketingPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    placeUrl: '',
    contentType: 'review' as 'review' | 'info',
    region: '',
    selectedCafes: [] as string[],
    postCount: 1,
    guideline: '',
    hasPhoto: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableCafes = formData.region ? cafesByRegion[formData.region] || [] : [];

  const toggleCafe = (cafe: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCafes: prev.selectedCafes.includes(cafe)
        ? prev.selectedCafes.filter(c => c !== cafe)
        : [...prev.selectedCafes, cafe],
    }));
  };

  const calculateTotalCost = () => {
    const basePricePerPost = 8000;
    const photoMultiplier = formData.hasPhoto ? 1.3 : 1.0;
    return Math.floor(formData.selectedCafes.length * formData.postCount * basePricePerPost * photoMultiplier);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.placeUrl) {
      alert('업체명과 플레이스 링크를 입력해주세요.');
      return;
    }

    if (!formData.region) {
      alert('지역군을 선택해주세요.');
      return;
    }

    if (formData.selectedCafes.length === 0) {
      alert('최소 1개 이상의 카페를 선택해주세요.');
      return;
    }

    if (formData.postCount < 1) {
      alert('발행 건수는 최소 1건 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('접수 데이터:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('카페침투 마케팅 접수가 완료되었습니다.');

      setFormData({
        businessName: '',
        placeUrl: '',
        contentType: 'review',
        region: '',
        selectedCafes: [],
        postCount: 1,
        guideline: '',
        hasPhoto: false,
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
            {/* 왼쪽: 매체 선택 카드 */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base">매체 선택</CardTitle>
                <CardDescription className="text-gray-600 text-sm">카페 침투 마케팅 서비스</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <button
                  type="button"
                  className="group relative w-full p-4 rounded-lg border-2 transition-all duration-300 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="text-4xl">
                      <Coffee className="h-12 w-12 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-900">카페 침투</div>
                      <div className="text-xs text-gray-500 mt-0.5">지역 커뮤니티 카페 마케팅</div>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* 오른쪽: 접수 정보 필드들 */}
            <div className="space-y-4">
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

              {/* 지역군 선택 */}
              <div className="space-y-2">
                <Label htmlFor="region" className="text-xs font-medium text-gray-700">
                  지역군 선택 <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, region: value, selectedCafes: [] }))}
                >
                  <SelectTrigger className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm">
                    <SelectValue placeholder="지역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(cafesByRegion).map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 카페 선택 (지역 선택 후 표시) */}
              {formData.region && availableCafes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700">
                    희망 카페 선택 (중복 가능) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-200 max-h-48 overflow-y-auto">
                    {availableCafes.map((cafe) => (
                      <div key={cafe} className="flex items-center gap-2">
                        <Checkbox
                          id={cafe}
                          checked={formData.selectedCafes.includes(cafe)}
                          onCheckedChange={() => toggleCafe(cafe)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={cafe} className="text-sm text-gray-700 cursor-pointer select-none">
                          {cafe}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    선택된 카페: <span className="font-semibold text-amber-700">{formData.selectedCafes.length}개</span>
                  </p>
                </div>
              )}

              {/* 발행 건수 */}
              <div className="space-y-2">
                <Label htmlFor="postCount" className="text-xs font-medium text-gray-700">
                  발행 건수 (카페당) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="postCount"
                  type="number"
                  min="1"
                  value={formData.postCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, postCount: Number(e.target.value) }))}
                  className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                />
                <p className="text-xs text-gray-600">
                  총 게시물: <span className="font-semibold text-sky-700">{formData.selectedCafes.length * formData.postCount}개</span>
                </p>
              </div>

              {/* 가이드 및 요청사항 */}
              <div className="space-y-2">
                <Label htmlFor="guideline" className="text-xs font-medium text-gray-700">
                  가이드 및 요청사항
                </Label>
                <Textarea
                  id="guideline"
                  value={formData.guideline}
                  onChange={(e) => setFormData(prev => ({ ...prev, guideline: e.target.value }))}
                  placeholder="게시물 작성 시 참고할 가이드나 요청사항을 입력하세요"
                  className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[100px]"
                />
              </div>

              {/* 사진 유무 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">
                  사진 옵션
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hasPhoto"
                    checked={formData.hasPhoto}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasPhoto: checked === true }))}
                    className="h-4 w-4"
                  />
                  <label htmlFor="hasPhoto" className="text-sm text-gray-700 cursor-pointer select-none flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    사진 포함
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 하단: 결제 정보 카드 (전체 너비) */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 text-base">결제 정보</CardTitle>
              <CardDescription className="text-gray-600 text-sm">예상 비용을 확인하고 접수하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 선택된 카페 */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-xs font-medium text-gray-700">선택된 카페</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      {formData.selectedCafes.length}
                    </span>
                    <span className="text-xs text-gray-600">개</span>
                  </div>
                </div>

                {/* 예상 비용 */}
                <div className="p-3 rounded-lg bg-sky-500 shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">예상 비용</span>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs px-2 py-0">
                        총 {formData.selectedCafes.length * formData.postCount}건
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">
                        {calculateTotalCost().toLocaleString()}
                      </span>
                      <span className="text-sm text-white/90">P</span>
                    </div>
                    <div className="text-xs text-white/80">
                      {formData.selectedCafes.length}개 카페 × {formData.postCount}건
                    </div>
                  </div>
                </div>

                {/* 옵션 정보 */}
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">옵션 정보</span>
                    </div>
                    <div className="space-y-0.5 text-xs text-amber-700">
                      <div>지역: {formData.region || '미선택'}</div>
                      <div>콘텐츠: {formData.contentType === 'review' ? '후기성' : '정보성'}</div>
                      <div>{formData.hasPhoto ? '사진 포함' : '사진 없음'}</div>
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
        </form>
      </div>
    </div>
  );
}
