'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckboxRadioGroup, CheckboxRadioItem } from '@/components/ui/checkbox-radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star } from 'lucide-react';

export default function KmapReviewPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    kmapUrl: '',
    dailyCount: 1,
    totalDays: 1,
    totalCount: 1,
    hasPhoto: false,
    scriptOption: 'custom' as 'custom' | 'ai',
    photoRatio: 50,
    starRating: 'mixed' as 'mixed' | 'five' | 'four',
    guideline: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDailyCountChange = (value: number) => {
    const total = value * formData.totalDays;
    setFormData(prev => ({
      ...prev,
      dailyCount: value,
      totalCount: total,
    }));
  };

  const handleTotalDaysChange = (value: number) => {
    const total = formData.dailyCount * value;
    setFormData(prev => ({
      ...prev,
      totalDays: value,
      totalCount: total,
    }));
  };

  const calculateTotalCost = () => {
    // 임시 단가 (실제로는 DB에서 가져와야 함)
    const basePricePerReview = 3000;
    let multiplier = 1.0;

    // 사진 포함 시 추가 비용
    if (formData.hasPhoto) {
      multiplier += 0.5;
    }

    // AI 원고 사용 시 추가 비용
    if (formData.scriptOption === 'ai') {
      multiplier += 0.3;
    }

    return Math.floor(formData.totalCount * basePricePerReview * multiplier);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.kmapUrl) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (formData.dailyCount < 1) {
      alert('일 발행수량은 최소 1건 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: API 호출
      console.log('접수 데이터:', formData);

      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('K맵 리뷰 접수가 완료되었습니다.');

      // 폼 초기화
      setFormData({
        businessName: '',
        kmapUrl: '',
        dailyCount: 1,
        totalDays: 1,
        totalCount: 1,
        hasPhoto: false,
        scriptOption: 'custom',
        photoRatio: 50,
        starRating: 'mixed',
        guideline: '',
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
            {/* 왼쪽: 접수 정보 (먼저 입력) */}
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

                {/* 카카오맵 링크 */}
                <div className="space-y-1.5">
                  <Label htmlFor="kmapUrl" className="text-xs font-medium text-gray-700">
                    카카오맵 링크 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="kmapUrl"
                    type="url"
                    value={formData.kmapUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, kmapUrl: e.target.value }))}
                    placeholder="https://map.kakao.com/..."
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                </div>

                {/* 일 발행수량 */}
                <div className="space-y-1.5">
                  <Label htmlFor="dailyCount" className="text-xs font-medium text-gray-700">
                    일 발행수량 (최소 1건) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="dailyCount"
                    type="number"
                    min="1"
                    value={formData.dailyCount}
                    onChange={(e) => handleDailyCountChange(Number(e.target.value))}
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                  <span className="text-xs text-gray-500">최소 1건, 최대 제한 없음</span>
                </div>

                {/* 총 작업일 */}
                <div className="space-y-1.5">
                  <Label htmlFor="totalDays" className="text-xs font-medium text-gray-700">
                    총 작업일 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="totalDays"
                    type="number"
                    min="1"
                    value={formData.totalDays}
                    onChange={(e) => handleTotalDaysChange(Number(e.target.value))}
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                  <span className="text-xs text-gray-500">작업 진행 일수</span>
                </div>
              </CardContent>
            </Card>

            {/* 오른쪽: 옵션 및 가이드 (나중에 입력) */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base">옵션 및 가이드</CardTitle>
                <CardDescription className="text-gray-600 text-sm">리뷰 작성 옵션을 선택하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {/* 사진 포함 체크박스 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    사진 옵션
                  </Label>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="hasPhoto"
                      checked={formData.hasPhoto}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasPhoto: checked === true }))}
                      className="h-5 w-5"
                    />
                    <label htmlFor="hasPhoto" className="text-sm font-medium cursor-pointer select-none text-gray-700">
                      사진 포함
                    </label>
                  </div>
                </div>

                {/* 사진 비율 (사진 포함 시에만 표시) */}
                {formData.hasPhoto && (
                  <div className="space-y-1.5 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                    <Label className="text-xs font-medium text-sky-700">
                      사진 비율: <span className="text-base font-bold">{formData.photoRatio}%</span>
                    </Label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      value={formData.photoRatio}
                      onChange={(e) => setFormData(prev => ({ ...prev, photoRatio: Number(e.target.value) }))}
                      className="w-full h-2 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between text-xs text-sky-600">
                      <span>10%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* 원고 옵션 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    원고 옵션 <span className="text-rose-500">*</span>
                  </Label>
                  <CheckboxRadioGroup
                    value={formData.scriptOption}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, scriptOption: value as 'custom' | 'ai' }))}
                  >
                    <CheckboxRadioItem value="custom" id="script-custom" label="지정원고" />
                    <CheckboxRadioItem value="ai" id="script-ai" label="AI 제작 원고" />
                  </CheckboxRadioGroup>
                </div>

                {/* 별점 선택 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    별점 옵션 <span className="text-rose-500">*</span>
                  </Label>
                  <CheckboxRadioGroup
                    value={formData.starRating}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, starRating: value as 'mixed' | 'five' | 'four' }))}
                  >
                    <CheckboxRadioItem value="mixed" id="star-mixed" label="4~5점대 섞어서" />
                    <CheckboxRadioItem value="five" id="star-five" label="5점대만" />
                    <CheckboxRadioItem value="four" id="star-four" label="4점대만" />
                  </CheckboxRadioGroup>
                </div>

                {/* 가이드 및 요청사항 */}
                <div className="space-y-1.5">
                  <Label htmlFor="guideline" className="text-xs font-medium text-gray-700">
                    가이드 및 요청사항
                  </Label>
                  <Textarea
                    id="guideline"
                    value={formData.guideline}
                    onChange={(e) => setFormData(prev => ({ ...prev, guideline: e.target.value }))}
                    placeholder="리뷰 작성 시 참고할 가이드나 요청사항을 입력하세요"
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[80px]"
                  />
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
                      일 {formData.dailyCount}건 × {formData.totalDays}일
                    </div>
                  </div>
                </div>

                {/* 옵션 정보 */}
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">옵션 정보</span>
                    </div>
                    <div className="space-y-0.5 text-xs text-amber-700">
                      <div>{formData.hasPhoto ? `사진 포함 (${formData.photoRatio}%)` : '사진 없음'}</div>
                      <div>{formData.scriptOption === 'ai' ? 'AI 제작 원고' : '지정원고'}</div>
                      <div>
                        별점: {formData.starRating === 'mixed' ? '4~5점 혼합' : formData.starRating === 'five' ? '5점대만' : '4점대만'}
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
        </form>
      </div>
    </div>
  );
}
