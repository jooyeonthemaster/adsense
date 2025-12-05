import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
          <button
            type="button"
            role="checkbox"
            aria-checked={formData.hasImage}
            onClick={() => onFormChange({ hasImage: !formData.hasImage })}
            className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
              formData.hasImage
                ? 'bg-sky-500 border-sky-500 shadow-lg'
                : 'bg-white border-gray-300 hover:border-sky-400'
            }`}
          >
            {formData.hasImage && (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            )}
          </button>
          <label
            onClick={() => onFormChange({ hasImage: !formData.hasImage })}
            className="text-sm font-medium cursor-pointer select-none text-gray-700"
          >
            이미지 첨부
          </label>
        </div>
      </div>

      {/* 이미지 첨부 시 이메일 안내 */}
      {formData.hasImage && (
        <div className="space-y-3 p-4 bg-sky-50 border border-sky-200 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="bg-sky-100 p-2 rounded-full shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-sky-800">
                  이미지는 이메일로 보내주세요
                </p>
                <p className="text-xs text-sky-700 mt-1">
                  아래 이메일 주소로 이미지 파일을 전송해 주세요.
                </p>
                <p className="text-sm font-bold text-sky-900 mt-2 bg-white px-3 py-1.5 rounded border border-sky-200 inline-block">
                  sense-ad@naver.com
                </p>
                <p className="text-xs text-sky-600 mt-2">
                  📌 이메일 제목은 <span className="font-semibold">업체명 or 대행사명</span>으로 작성해 주세요.
                </p>
              </div>
            </div>
          </div>

          {/* 이메일 전송 확인 체크박스 (필수) */}
          <div className="flex items-center gap-2 pt-3 border-t border-sky-200">
            <button
              type="button"
              role="checkbox"
              aria-checked={formData.emailImageConfirmed}
              onClick={() => onFormChange({ emailImageConfirmed: !formData.emailImageConfirmed })}
              className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                formData.emailImageConfirmed
                  ? 'bg-sky-500 border-sky-500 shadow-lg'
                  : 'bg-white border-gray-300 hover:border-sky-400'
              }`}
            >
              {formData.emailImageConfirmed && (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              )}
            </button>
            <label
              onClick={() => onFormChange({ emailImageConfirmed: !formData.emailImageConfirmed })}
              className="text-sm font-medium cursor-pointer select-none text-sky-800"
            >
              위 이메일 주소로 이미지를 전송했습니다 <span className="text-rose-500">*</span>
            </label>
          </div>
        </div>
      )}
    </>
  );
}

