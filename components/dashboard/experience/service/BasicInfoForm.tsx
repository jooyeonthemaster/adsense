import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import { ExperienceFormData, ServiceType } from '@/types/experience/service-types';

interface BasicInfoFormProps {
  formData: ExperienceFormData;
  selectedService: ServiceType;
  loadingBusinessName: boolean;
  onPlaceUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormChange: (updates: Partial<ExperienceFormData>) => void;
}

export function BasicInfoForm({
  formData,
  selectedService,
  loadingBusinessName,
  onPlaceUrlChange,
  onFormChange,
}: BasicInfoFormProps) {
  return (
    <div className="space-y-2.5">
      {/* 업체명 */}
      <div className="space-y-1.5">
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

      {/* 플레이스 링크 */}
      <div className="space-y-1.5">
        <Label htmlFor="placeUrl" className="text-xs font-medium text-gray-700">
          플레이스 링크 <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="placeUrl"
          type="url"
          value={formData.placeUrl}
          onChange={onPlaceUrlChange}
          placeholder="https://m.place.naver.com/place/..."
          className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
          disabled={loadingBusinessName}
        />
        {formData.placeMid && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs text-emerald-700 truncate">
              MID: {formData.placeMid} (자동 추출됨)
            </span>
          </div>
        )}
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
            onChange={(e) => onFormChange({ providedItems: e.target.value })}
            placeholder="예) 2인 식사권, 제품 1개 등"
            className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
          />
        </div>
      )}

      {/* 희망 팀수 */}
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
          onChange={(e) => onFormChange({ teamCount: Number(e.target.value) })}
          className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
        />
        <span className="text-xs text-gray-500">
          {selectedService === 'influencer' ? '최대 10팀까지 가능합니다' : '체험단 팀 수를 입력하세요'}
        </span>
      </div>
    </div>
  );
}

