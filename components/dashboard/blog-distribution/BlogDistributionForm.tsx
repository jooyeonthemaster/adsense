import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2 } from 'lucide-react';
import { DistributionType, BlogDistributionFormData } from '@/types/blog-distribution/types';

interface BlogDistributionFormProps {
  formData: BlogDistributionFormData;
  selectedType: DistributionType;
  isApprovedForAutoDistribution: boolean;
  loadingBusinessName: boolean;
  onFormChange: (updates: Partial<BlogDistributionFormData>) => void;
  onPlaceUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDailyCountChange: (value: number) => void;
  onOperationDaysChange: (value: number) => void;
}

export function BlogDistributionForm({
  formData,
  selectedType,
  isApprovedForAutoDistribution,
  loadingBusinessName,
  onFormChange,
  onPlaceUrlChange,
  onDailyCountChange,
  onOperationDaysChange,
}: BlogDistributionFormProps) {
  return (
    <div className="space-y-4">
      {/* 자동화 배포 전용: 외부 계정 사용 여부 */}
      {selectedType === 'auto' && (
        <div className={`p-3 rounded-lg border ${isApprovedForAutoDistribution ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              id="useExternalAccount"
              checked={formData.useExternalAccount}
              onCheckedChange={(checked) => {
                if (isApprovedForAutoDistribution) {
                  onFormChange({ useExternalAccount: checked === true });
                }
              }}
              disabled={!isApprovedForAutoDistribution}
              className="h-5 w-5"
            />
            <label
              htmlFor="useExternalAccount"
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
              onChange={(e) => onFormChange({ businessName: e.target.value })}
              placeholder="업체명을 입력하세요"
              className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
              disabled={loadingBusinessName}
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
                onChange={(e) => onDailyCountChange(Number(e.target.value))}
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
                onChange={(e) => onOperationDaysChange(Number(e.target.value))}
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
              onChange={(e) => onFormChange({ keywords: e.target.value })}
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
                onChange={(e) => onFormChange({ guideline: e.target.value })}
                placeholder="작성 가이드라인을 입력하세요"
                className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[100px]"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}




