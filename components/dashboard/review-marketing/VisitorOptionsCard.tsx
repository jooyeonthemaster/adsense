'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxRadioGroup, CheckboxRadioItem } from '@/components/ui/checkbox-radio-group';
import type { VisitorFormData } from '@/types/review-marketing/types';
import { SUPPORT_EMAIL } from './constants';

interface VisitorOptionsCardProps {
  formData: VisitorFormData;
  onChange: React.Dispatch<React.SetStateAction<VisitorFormData>>;
}

export function VisitorOptionsCard({ formData, onChange }: VisitorOptionsCardProps) {
  return (
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
            onValueChange={(value) =>
              onChange((prev) => ({ ...prev, photoOption: value as 'with' | 'without' }))
            }
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
            onValueChange={(value) =>
              onChange((prev) => ({ ...prev, scriptOption: value as 'custom' | 'ai' }))
            }
          >
            <CheckboxRadioItem value="custom" id="script-custom-visitor" label="지정원고" />
            <CheckboxRadioItem value="ai" id="script-ai-visitor" label="AI 제작 원고" />
          </CheckboxRadioGroup>
        </div>

        {/* 가이드 및 요청사항 */}
        <div className="space-y-1.5">
          <Label htmlFor="guideline-visitor" className="text-xs font-medium text-gray-700">
            가이드 및 요청사항
          </Label>
          <Textarea
            id="guideline-visitor"
            value={formData.guideline}
            onChange={(e) => onChange((prev) => ({ ...prev, guideline: e.target.value }))}
            placeholder="리뷰 작성 시 참고할 가이드나 요청사항을 입력하세요"
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 text-sm min-h-[100px]"
          />
        </div>

        {/* 필수 서류 안내 */}
        <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 p-2 rounded-full shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-purple-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">필수 서류를 이메일로 보내주세요</p>
                <p className="text-xs text-purple-700 mt-1">
                  사업자등록증 or 샘플 영수증을 아래 이메일로 전송해 주세요.
                </p>
                <p className="text-sm font-bold text-purple-900 mt-2 bg-white px-3 py-1.5 rounded border border-purple-200 inline-block">
                  {SUPPORT_EMAIL}
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  📌 이메일 제목은 <span className="font-semibold">업체명 or 대행사명</span>으로 작성해
                  주세요.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-purple-200">
            <button
              type="button"
              role="checkbox"
              aria-checked={formData.emailDocConfirmed}
              onClick={() => onChange((prev) => ({ ...prev, emailDocConfirmed: !prev.emailDocConfirmed }))}
              className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 ${
                formData.emailDocConfirmed
                  ? 'bg-purple-500 border-purple-500 shadow-lg'
                  : 'bg-white border-gray-300 hover:border-purple-400'
              }`}
            >
              {formData.emailDocConfirmed && (
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
              onClick={() => onChange((prev) => ({ ...prev, emailDocConfirmed: !prev.emailDocConfirmed }))}
              className="text-sm font-medium cursor-pointer select-none text-purple-800"
            >
              위 이메일 주소로 서류를 전송했습니다 <span className="text-rose-500">*</span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
