'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxRadioGroup, CheckboxRadioItem } from '@/components/ui/checkbox-radio-group';
import type { KmapFormData } from '@/types/review-marketing/types';

interface KmapOptionsCardProps {
  formData: KmapFormData;
  onChange: React.Dispatch<React.SetStateAction<KmapFormData>>;
}

export function KmapOptionsCard({ formData, onChange }: KmapOptionsCardProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 text-base">옵션 및 가이드</CardTitle>
        <CardDescription className="text-gray-600 text-sm">리뷰 작성 옵션을 선택하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        {/* 사진 포함 체크박스 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">사진 옵션</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={formData.hasPhoto}
              onClick={() => onChange((prev) => ({ ...prev, hasPhoto: !prev.hasPhoto }))}
              className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 ${
                formData.hasPhoto
                  ? 'bg-amber-500 border-amber-500 shadow-lg'
                  : 'bg-white border-gray-300 hover:border-amber-400'
              }`}
            >
              {formData.hasPhoto && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-white"
                >
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              )}
            </button>
            <label
              onClick={() => onChange((prev) => ({ ...prev, hasPhoto: !prev.hasPhoto }))}
              className="text-sm font-medium cursor-pointer select-none text-gray-700"
            >
              사진 포함
            </label>
          </div>
        </div>

        {/* 사진 비율 (사진 포함 시에만) */}
        {formData.hasPhoto && (
          <div className="space-y-3">
            <div className="space-y-1.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Label className="text-xs font-medium text-amber-700">
                사진 비율: <span className="text-base font-bold">{formData.photoRatio}%</span>
              </Label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={formData.photoRatio}
                onChange={(e) => onChange((prev) => ({ ...prev, photoRatio: Number(e.target.value) }))}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-amber-600">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
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
            onValueChange={(value) =>
              onChange((prev) => ({ ...prev, scriptOption: value as 'custom' | 'ai' }))
            }
          >
            <CheckboxRadioItem value="custom" id="script-custom-kmap" label="지정원고" />
            <CheckboxRadioItem value="ai" id="script-ai-kmap" label="AI 제작 원고" />
          </CheckboxRadioGroup>
        </div>

        {/* 별점 선택 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            별점 옵션 <span className="text-rose-500">*</span>
          </Label>
          <CheckboxRadioGroup
            value={formData.starRating}
            onValueChange={(value) =>
              onChange((prev) => ({ ...prev, starRating: value as 'mixed' | 'five' | 'four' }))
            }
          >
            <CheckboxRadioItem value="mixed" id="star-mixed" label="4~5점대 섞어서" />
            <CheckboxRadioItem value="five" id="star-five" label="5점대만" />
            <CheckboxRadioItem value="four" id="star-four" label="4점대만" />
          </CheckboxRadioGroup>
        </div>

        {/* 지정 원고 기재 (지정원고 선택 시에만) */}
        {formData.scriptOption === 'custom' && (
          <div className="space-y-1.5">
            <Label htmlFor="guideline-kmap" className="text-xs font-medium text-gray-700">
              지정 원고 기재 <span className="text-rose-500">*</span>
            </Label>
            <p className="text-xs text-amber-600">
              원고 작성 시 필수로 줄바꿈으로 원고별로 구분하여 입력 부탁드립니다.
            </p>
            <Textarea
              id="guideline-kmap"
              value={formData.guideline}
              onChange={(e) => onChange((prev) => ({ ...prev, guideline: e.target.value }))}
              placeholder={'1. 친절하고 맛있어요!\n2. 매장 인테리어가 너무 예뻐서 취향저격 입니다!'}
              className="border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 text-sm min-h-[120px]"
            />
          </div>
        )}

        {/* 가이드 및 요청사항 (AI 제작 원고 선택 시에만) */}
        {formData.scriptOption === 'ai' && (
          <div className="space-y-1.5">
            <Label htmlFor="guideline-kmap" className="text-xs font-medium text-gray-700">
              가이드 및 요청사항
            </Label>
            <Textarea
              id="guideline-kmap"
              value={formData.guideline}
              onChange={(e) => onChange((prev) => ({ ...prev, guideline: e.target.value }))}
              placeholder="리뷰 작성 시 참고할 가이드나 요청사항을 입력하세요"
              className="border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 text-sm min-h-[80px]"
            />
          </div>
        )}

        {/* 이미지 전송 안내 (사진 포함 시에만 표시) */}
        {formData.hasPhoto && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg space-y-1.5">
            <p className="text-xs font-medium text-sky-700">이미지 전송 안내</p>
            <p className="text-sm font-bold text-sky-800">sense-ad@naver.com</p>
            <p className="text-xs text-sky-600">
              이메일 제목에 대행사명과 업체명을 필수로 기재해 주셔야 하며, 파일명에 업체명으로 발송 부탁드립니다.
            </p>
            <p className="text-xs text-rose-500">
              양식에 맞춰 접수하시지 않을 경우 작업이 지연될 수 있습니다.
            </p>
            <div className="text-xs text-sky-500 space-y-0.5 pt-1 border-t border-sky-200">
              <p>( ex. 센스애드_대행사명 )</p>
              <p>( ex. 파일명 : 작업 업체명 )</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
