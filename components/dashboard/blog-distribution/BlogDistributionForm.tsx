import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle2, CalendarIcon } from 'lucide-react';
import { DistributionType, BlogDistributionFormData } from '@/types/blog-distribution/types';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface BlogDistributionFormProps {
  formData: BlogDistributionFormData;
  selectedType: DistributionType;
  isApprovedForAutoDistribution: boolean;
  loadingBusinessName: boolean;
  onFormChange: (updates: Partial<BlogDistributionFormData>) => void;
  onPlaceUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDailyCountChange: (value: number) => void;
  onStartDateChange: (date: Date | null) => void;
  onOperationDaysChange: (days: number) => void;
  minStartDate: Date;
  isWeekendSubmission: boolean;
  calculatedEndDate: Date | null;
  totalCount: number;
}

export function BlogDistributionForm({
  formData,
  selectedType,
  isApprovedForAutoDistribution,
  loadingBusinessName,
  onFormChange,
  onPlaceUrlChange,
  onDailyCountChange,
  onStartDateChange,
  onOperationDaysChange,
  minStartDate,
  isWeekendSubmission,
  calculatedEndDate,
  totalCount,
}: BlogDistributionFormProps) {
  return (
    <div className="space-y-4">
      {/* 자동화 배포 전용: 외부 계정 사용 여부 */}
      {selectedType === 'auto' && (
        <div className={`p-3 rounded-lg border ${isApprovedForAutoDistribution ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={formData.useExternalAccount}
              onClick={() => {
                if (isApprovedForAutoDistribution) {
                  onFormChange({ useExternalAccount: !formData.useExternalAccount });
                }
              }}
              disabled={!isApprovedForAutoDistribution}
              className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                !isApprovedForAutoDistribution
                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                  : formData.useExternalAccount
                    ? 'bg-sky-500 border-sky-500 shadow-lg'
                    : 'bg-white border-gray-300 hover:border-sky-400 cursor-pointer'
              }`}
            >
              {formData.useExternalAccount && (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              )}
            </button>
            <label
              onClick={() => {
                if (isApprovedForAutoDistribution) {
                  onFormChange({ useExternalAccount: !formData.useExternalAccount });
                }
              }}
              className={`text-sm font-medium ${isApprovedForAutoDistribution ? 'text-yellow-900 cursor-pointer' : 'text-gray-500 cursor-not-allowed'} select-none`}
            >
              외부 계정 충전 요청 (승인된 회원만)
            </label>
          </div>
          {!isApprovedForAutoDistribution && (
            <div className="p-2 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 mt-2">
              ⚠️ 이 기능은 관리자 승인이 필요합니다. 사용을 원하시면 관리자에게 문의하세요.
            </div>
          )}
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
                  onChange={(e) => onFormChange({ externalAccountId: e.target.value })}
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
                  onChange={(e) => onFormChange({ chargeCount: Number(e.target.value) })}
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
              readOnly
              placeholder="플레이스 링크 입력 시 자동 입력됩니다"
              className="border-gray-200 bg-gray-50 h-9 text-sm cursor-not-allowed"
            />
            {loadingBusinessName && (
              <p className="text-xs text-blue-600">업체명 자동 입력 중...</p>
            )}
          </div>

          {/* 플레이스 링크 / 외부 링크 */}
          <div className="space-y-2">
            {selectedType === 'reviewer' && (
              <div className="mb-3">
                <Label className="text-xs font-medium text-gray-700 mb-2 block">
                  링크 타입 <span className="text-rose-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.linkType}
                  onValueChange={(value: 'place' | 'external') =>
                    onFormChange({ linkType: value, placeUrl: '', placeMid: '' })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="place" id="linkType-place" className="h-4 w-4" />
                    <label htmlFor="linkType-place" className="text-sm cursor-pointer">
                      플레이스 링크
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="external" id="linkType-external" className="h-4 w-4" />
                    <label htmlFor="linkType-external" className="text-sm cursor-pointer">
                      외부 링크 (상품 링크 등)
                    </label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            <Label htmlFor="placeUrl" className="text-xs font-medium text-gray-700">
              {formData.linkType === 'place' ? '플레이스 링크' : '외부 링크'} <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="placeUrl"
              type="url"
              value={formData.placeUrl}
              onChange={onPlaceUrlChange}
              placeholder={
                formData.linkType === 'place' 
                  ? "https://m.place.naver.com/place/..." 
                  : "https://example.com/product/..."
              }
              className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
              disabled={loadingBusinessName}
            />
            {formData.linkType === 'place' && formData.placeMid && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs text-emerald-700">
                  MID: {formData.placeMid} (자동 추출됨)
                </span>
              </div>
            )}
            {formData.linkType === 'external' && (
              <span className="text-xs text-gray-500">배송형 상품이나 외부 링크를 입력하세요</span>
            )}
          </div>

          {/* 콘텐츠 종류 */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              콘텐츠 종류 <span className="text-rose-500">*</span>
            </Label>
            <RadioGroup
              value={formData.contentType}
              onValueChange={(value: 'review' | 'info') =>
                onFormChange({ contentType: value })
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

          {/* 일 접수량 */}
          <div className="space-y-2">
            <Label htmlFor="dailyCount" className="text-xs font-medium text-gray-700">
              일 접수량 (최소 3건) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="dailyCount"
              type="number"
              min="3"
              value={formData.dailyCount}
              onChange={(e) => onDailyCountChange(Number(e.target.value))}
              className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
            />
          </div>

          {/* 구동 시작일 & 종료일 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">
                구동 시작일 <span className="text-rose-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal h-9 text-sm ${
                      !formData.startDate ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate
                      ? format(formData.startDate, 'M/d (EEE)', { locale: ko })
                      : '시작일'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate || undefined}
                    onSelect={(date) => onStartDateChange(date || null)}
                    disabled={(date) => date < minStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-gray-500">
                {isWeekendSubmission
                  ? `${format(minStartDate, 'M/d', { locale: ko })}부터 가능`
                  : '내일부터 가능'}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operationDays" className="text-xs font-medium text-gray-700">
                구동일수 <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="operationDays"
                type="number"
                min="10"
                max="30"
                value={formData.operationDays || ''}
                onChange={(e) => onOperationDaysChange(Number(e.target.value))}
                placeholder="10~30"
                disabled={!formData.startDate}
                className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
              />
              {calculatedEndDate && formData.operationDays >= 10 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CalendarIcon className="h-3 w-3" />
                  <span>종료일: {format(calculatedEndDate, 'M/d (EEE)', { locale: ko })}</span>
                </div>
              )}
              <span className="text-xs text-gray-500">최소 10일, 최대 30일</span>
            </div>
          </div>

          {/* 총 작업수량 표시 */}
          <div className={`p-2.5 rounded-lg border ${
            totalCount < 30
              ? 'bg-rose-50 border-rose-200'
              : 'bg-sky-50 border-sky-200'
          }`}>
            <span className={`text-xs ${totalCount < 30 ? 'text-rose-700' : 'text-sky-700'}`}>
              총 작업수량:{' '}
            </span>
            <span className={`text-base font-bold ${totalCount < 30 ? 'text-rose-900' : 'text-sky-900'}`}>
              {totalCount}건
            </span>
            <span className={`text-xs ml-1 ${totalCount < 30 ? 'text-rose-600' : 'text-sky-600'}`}>
              (일 {formData.dailyCount}건 × {formData.operationDays || 0}일)
            </span>
            {totalCount < 30 && (
              <p className="text-xs text-rose-600 mt-1">
                ⚠ 최소 30건 이상이어야 합니다.
              </p>
            )}
          </div>

          {/* 리뷰어 배포 전용: 키워드 */}
          {selectedType === 'reviewer' && (
            <div className="space-y-2">
              <Label htmlFor="keywords" className="text-xs font-medium text-gray-700">
                키워드
              </Label>
              <Input
                id="keywords"
                type="text"
                value={formData.keywords}
                onChange={(e) => onFormChange({ keywords: e.target.value })}
                placeholder="키워드를 입력하세요 (쉼표로 구분)"
                className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
              />
              <span className="text-xs text-gray-500">여러 키워드는 쉼표(,)로 구분하여 입력하세요</span>
            </div>
          )}

          {/* 리뷰어 배포 전용: 가이드라인 */}
          {selectedType === 'reviewer' && (
            <div className="space-y-2">
              <Label htmlFor="guideline" className="text-xs font-medium text-gray-700">
                가이드라인
              </Label>
              <Textarea
                id="guideline"
                value={formData.guideline}
                onChange={(e) => onFormChange({ guideline: e.target.value })}
                placeholder="작성 가이드라인을 입력하세요"
                className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[100px]"
              />
            </div>
          )}

          {/* 리뷰어 배포 전용: 이미지 이메일 안내 */}
          {selectedType === 'reviewer' && (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-sky-100 p-2 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    이미지는 이메일로 보내주세요
                  </p>
                  <p className="text-sm font-bold text-sky-700 bg-white px-3 py-1.5 rounded border border-sky-200 inline-block">
                    sense-ad@naver.com
                  </p>
                  <p className="text-xs text-gray-600">
                    이메일 제목은 <span className="font-semibold">업체명 or 대행사명</span>으로 작성
                  </p>
                  <p className="text-xs font-medium text-sky-700 p-2 bg-sky-100 rounded">
                    사진 100장 이상 전달 필수
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}














