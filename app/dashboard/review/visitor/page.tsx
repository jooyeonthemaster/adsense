'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxRadioGroup, CheckboxRadioItem } from '@/components/ui/checkbox-radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, Sparkles } from 'lucide-react';

export default function VisitorReviewPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    placeUrl: '',
    placeMid: '',
    dailyCount: 1,
    totalDays: 1,
    totalCount: 1,
    photoOption: 'with', // 'with' | 'without'
    scriptOption: 'custom', // 'custom' | 'ai'
    guideline: '',
    files: [] as File[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, files: filesArray }));
    }
  };

  const calculateTotalCost = () => {
    // 임시 단가 (실제로는 DB에서 가져와야 함)
    const pricePerReview = 5000;
    return formData.totalCount * pricePerReview;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.placeUrl) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!formData.placeMid) {
      alert('플레이스 링크에서 MID를 추출할 수 없습니다. 올바른 링크를 입력해주세요.');
      return;
    }

    if (formData.dailyCount < 1 || formData.dailyCount > 10) {
      alert('일 발행수량은 최소 1건, 최대 10건입니다.');
      return;
    }

    if (formData.files.length === 0) {
      alert('사업자등록증 또는 샘플 영수증을 첨부해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: API 호출 및 파일 업로드
      console.log('접수 데이터:', formData);

      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('방문자 리뷰 접수가 완료되었습니다.');

      // 폼 초기화
      setFormData({
        businessName: '',
        placeUrl: '',
        placeMid: '',
        dailyCount: 1,
        totalDays: 1,
        totalCount: 1,
        photoOption: 'with',
        scriptOption: 'custom',
        guideline: '',
        files: [],
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

                {/* 일 발행수량 */}
                <div className="space-y-1.5">
                  <Label htmlFor="dailyCount" className="text-xs font-medium text-gray-700">
                    일 발행수량 (1~10건) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="dailyCount"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.dailyCount}
                    onChange={(e) => handleDailyCountChange(Number(e.target.value))}
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
                  />
                  <span className="text-xs text-gray-500">최소 1건, 최대 10건</span>
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
                {/* 사진 옵션 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    사진 옵션 <span className="text-rose-500">*</span>
                  </Label>
                  <CheckboxRadioGroup
                    value={formData.photoOption}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, photoOption: value as 'with' | 'without' }))}
                  >
                    <CheckboxRadioItem value="with" id="photo-with" label="사진 있음" />
                    <CheckboxRadioItem value="without" id="photo-without" label="사진 없음" />
                  </CheckboxRadioGroup>
                </div>

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
                    className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[100px]"
                  />
                </div>

                {/* 첨부파일 */}
                <div className="space-y-1.5">
                  <Label htmlFor="files" className="text-xs font-medium text-gray-700">
                    첨부파일 <span className="text-rose-500">*</span>
                  </Label>
                  <label
                    htmlFor="files"
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {formData.files.length > 0
                        ? `${formData.files.length}개 파일 선택됨`
                        : 'JPG, PNG, PDF 파일 업로드'}
                    </span>
                    <input
                      id="files"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {formData.files.length > 0 && (
                    <div className="space-y-0.5 mt-1.5">
                      {formData.files.map((file, index) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          • {file.name} ({(file.size / 1024).toFixed(1)}KB)
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">사업자등록증 or 샘플 영수증</p>
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

                {/* 건당 단가 */}
                <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-purple-600">건당 단가</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-purple-900">
                        5,000
                      </span>
                      <span className="text-sm text-purple-700">P</span>
                    </div>
                    <div className="text-xs text-purple-600">
                      방문자 리뷰
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
