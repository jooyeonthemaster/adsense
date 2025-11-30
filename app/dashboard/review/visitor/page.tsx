'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxRadioGroup, CheckboxRadioItem } from '@/components/ui/checkbox-radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Sparkles, CheckCircle2, Info, AlertCircle, BookOpen, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import { extractNaverPlaceMID, fetchBusinessInfoByMID } from '@/utils/naver-place';
import { ProductGuideSection } from '@/components/dashboard/ProductGuideSection';

export default function VisitorReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    businessName: '',
    placeUrl: '',
    placeMid: '',
    dailyCount: 1,
    totalDays: 10,
    totalCount: 10,
    photoOption: 'with', // 'with' | 'without'
    scriptOption: 'custom', // 'custom' | 'ai'
    guideline: '',
    businessLicense: null as File | null,
    photos: [] as File[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricePerReview, setPricePerReview] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingBusinessName, setLoadingBusinessName] = useState(false);

  // 가격 설정 여부 확인
  const isPriceConfigured = pricePerReview !== null && pricePerReview > 0;

  // 가격 정보 불러오기
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.success && data.pricing && data.pricing['receipt-review']) {
          setPricePerReview(data.pricing['receipt-review']);
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

  const handleBusinessLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, businessLicense: e.target.files![0] }));
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, photos: filesArray }));
    }
  };

  // Supabase Storage에 파일 업로드
  const uploadFileToStorage = async (file: File, folder: string): Promise<string | null> => {
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('파일 업로드 실패:', error);
        return null;
      }

      // Public URL 가져오기
      const { data: urlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('파일 업로드 중 오류:', error);
      return null;
    }
  };

  const calculateTotalCost = () => {
    return formData.totalCount * (pricePerReview || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 최소 주문건수 검증을 가장 먼저 수행 (화면에 경고가 보이므로 사용자가 이해하기 쉬움)
    if (formData.totalCount < 30) {
      toast({
        variant: 'destructive',
        title: '⚠️ 최소 주문건수 미달',
        description: `방문자 리뷰는 최소 30건 이상 주문하셔야 합니다. (현재: ${formData.totalCount}건)`,
      });
      return;
    }

    if (!formData.businessName || !formData.placeUrl) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
      });
      return;
    }

    if (!formData.placeMid) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '플레이스 링크에서 MID를 추출할 수 없습니다. 올바른 링크를 입력해주세요.',
      });
      return;
    }

    if (formData.dailyCount < 1 || formData.dailyCount > 10) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '일 발행수량은 최소 1건, 최대 10건입니다.',
      });
      return;
    }

    if (!formData.businessLicense && formData.photos.length === 0) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '사업자등록증 또는 샘플 영수증을 첨부해주세요.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 파일 업로드 처리
      let businessLicenseUrl: string | null = null;
      const photoUrls: string[] = [];

      // 사업자등록증 업로드
      if (formData.businessLicense) {
        const url = await uploadFileToStorage(formData.businessLicense, 'business-licenses');
        if (url) {
          businessLicenseUrl = url;
        } else {
          throw new Error('사업자등록증 업로드에 실패했습니다.');
        }
      }

      // 샘플 영수증 업로드
      for (const photo of formData.photos) {
        const url = await uploadFileToStorage(photo, 'receipt-photos');
        if (url) {
          photoUrls.push(url);
        } else {
          throw new Error('샘플 영수증 업로드에 실패했습니다.');
        }
      }

      const response = await fetch('/api/submissions/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.businessName,
          place_url: formData.placeUrl,
          daily_count: formData.dailyCount,
          total_days: formData.totalDays,
          total_count: formData.totalCount,
          total_points: calculateTotalCost(),
          business_license_url: businessLicenseUrl,
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
          notes: formData.guideline || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '접수에 실패했습니다.');
      }

      const data = await response.json();

      // Toast 알림 표시
      toast({
        title: '✅ 네이버 영수증 접수 완료!',
        description: (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg border border-sky-200">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium text-sky-900">
                차감 포인트: {data.submission?.total_points?.toLocaleString() || '0'}P
              </span>
            </div>
            <div className="text-sm text-gray-600">
              남은 포인트: {data.new_balance?.toLocaleString() || '0'}P
            </div>
          </div>
        ) as React.ReactNode,
        duration: 5000,
      });

      // 1.5초 후 접수 현황 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/review/visitor/status');
        router.refresh(); // 서버 데이터 새로고침
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

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-7xl mx-auto">
        <ProductGuideSection productKey="receipt-review" />
        
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

                {/* 사업자등록증 */}
                <div className="space-y-1.5">
                  <Label htmlFor="businessLicense" className="text-xs font-medium text-gray-700">
                    사업자등록증
                  </Label>
                  <label
                    htmlFor="businessLicense"
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {formData.businessLicense
                        ? formData.businessLicense.name
                        : 'PDF, JPG, PNG 파일 업로드'}
                    </span>
                    <input
                      id="businessLicense"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleBusinessLicenseChange}
                      className="hidden"
                    />
                  </label>
                  {formData.businessLicense && (
                    <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      • {formData.businessLicense.name} ({(formData.businessLicense.size / 1024).toFixed(1)}KB)
                    </div>
                  )}
                </div>

                {/* 샘플 영수증 */}
                <div className="space-y-1.5">
                  <Label htmlFor="photos" className="text-xs font-medium text-gray-700">
                    샘플 영수증
                  </Label>
                  <label
                    htmlFor="photos"
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {formData.photos.length > 0
                        ? `${formData.photos.length}개 파일 선택됨`
                        : 'JPG, PNG, PDF 파일 업로드 (여러 개 가능)'}
                    </span>
                    <input
                      id="photos"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handlePhotosChange}
                      className="hidden"
                    />
                  </label>
                  {formData.photos.length > 0 && (
                    <div className="space-y-0.5 mt-1.5">
                      {formData.photos.map((file, index) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          • {file.name} ({(file.size / 1024).toFixed(1)}KB)
                        </div>
                      ))}
                    </div>
                  )}
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
                {/* 총 작업수량 */}
                <div className="space-y-1.5">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    formData.totalCount < 30
                      ? 'bg-rose-50 border border-rose-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <span className={`text-xs font-medium ${
                      formData.totalCount < 30 ? 'text-rose-700' : 'text-gray-700'
                    }`}>총 작업수량</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-bold ${
                        formData.totalCount < 30 ? 'text-rose-900' : 'text-gray-900'
                      }`}>
                        {formData.totalCount}
                      </span>
                      <span className={`text-xs ${
                        formData.totalCount < 30 ? 'text-rose-600' : 'text-gray-600'
                      }`}>건</span>
                    </div>
                  </div>
                  {formData.totalCount < 30 && (
                    <p className="text-xs text-rose-600 px-1">
                      ⚠️ 최소 30건 이상 필요
                    </p>
                  )}
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
              </div>

              {/* 접수 신청 버튼 */}
              {!isPriceConfigured && !loadingPrice && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  ⚠️ 가격이 설정되지 않았습니다. 관리자에게 문의하세요.
                </div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !isPriceConfigured || loadingPrice}
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
