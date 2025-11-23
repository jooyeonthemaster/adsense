import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { DatePickerMultiple } from '@/components/ui/date-picker-multiple';
import { ExperienceFormData } from '@/types/experience/service-types';

interface ReporterSectionProps {
  formData: ExperienceFormData;
  onFormChange: (updates: Partial<ExperienceFormData>) => void;
}

export function ReporterSection({
  formData,
  onFormChange,
}: ReporterSectionProps) {
  return (
    <>
      {/* 구분선 */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* 희망 발행일 */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">
          희망 발행일 기재 <span className="text-rose-500">*</span>
        </Label>
        <DatePickerMultiple
          value={formData.publishDates}
          onChange={(dates) => onFormChange({ publishDates: dates })}
          placeholder="발행일 선택 (복수 가능)"
        />
        <span className="text-xs text-gray-500">캘린더에서 여러 날짜를 선택할 수 있습니다</span>
      </div>

      {/* 진행 키워드 */}
      <div className="space-y-1.5">
        <Label htmlFor="progressKeyword" className="text-xs font-medium text-gray-700">
          진행 키워드 기재 <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="progressKeyword"
          type="text"
          value={formData.progressKeyword}
          onChange={(e) => onFormChange({ progressKeyword: e.target.value })}
          placeholder="예) 강남 맛집, 서울 카페"
          className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
        />
      </div>

      {/* 가이드 기재 */}
      <div className="space-y-1.5">
        <Label htmlFor="reporterGuideline" className="text-xs font-medium text-gray-700">
          가이드 기재 <span className="text-rose-500">*</span>
        </Label>
        <Textarea
          id="reporterGuideline"
          value={formData.guideline}
          onChange={(e) => onFormChange({ guideline: e.target.value })}
          placeholder="기자단이 참고할 가이드를 입력하세요"
          className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[100px]"
        />
      </div>

      {/* 이미지 첨부 여부 */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">
          이미지 첨부 여부
        </Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id="hasImage"
            checked={formData.hasImage}
            onCheckedChange={(checked) => onFormChange({ hasImage: checked === true })}
            className="h-4 w-4"
          />
          <label htmlFor="hasImage" className="text-xs sm:text-sm font-medium cursor-pointer select-none text-gray-700">
            이미지 첨부
          </label>
        </div>
      </div>

      {/* 이미지 첨부 시 이미지 업로드 */}
      {formData.hasImage && (
        <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="space-y-1.5">
            <Label htmlFor="images" className="text-xs font-medium text-blue-700">
              이미지 업로드 <span className="text-rose-500">*</span>
            </Label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  onFormChange({ images: Array.from(files) });
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer"
            />
            <span className="text-xs text-blue-600">이미지 파일을 선택하세요 (복수 선택 가능)</span>
          </div>
          
          {/* 이미지 미리보기 */}
          {formData.images.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-blue-700">
                선택된 이미지 ({formData.images.length}개)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {formData.images.map((file, idx) => (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`이미지 ${idx + 1}`}
                      className="w-full h-16 sm:h-20 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onFormChange({
                          images: formData.images.filter((_, i) => i !== idx)
                        });
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

