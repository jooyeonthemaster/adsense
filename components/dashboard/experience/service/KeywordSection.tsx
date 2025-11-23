import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { ExperienceFormData, KeywordPair } from '@/types/experience/service-types';

interface KeywordSectionProps {
  formData: ExperienceFormData;
  onFormChange: (updates: Partial<ExperienceFormData>) => void;
}

export function KeywordSection({
  formData,
  onFormChange,
}: KeywordSectionProps) {
  const [keywordInput, setKeywordInput] = useState({ main: '', sub: '' });

  const addKeyword = () => {
    if (keywordInput.main.trim() && keywordInput.sub.trim() && formData.keywords.length < 5) {
      onFormChange({
        keywords: [...formData.keywords, { main: keywordInput.main.trim(), sub: keywordInput.sub.trim() }],
      });
      setKeywordInput({ main: '', sub: '' });
    }
  };

  const removeKeyword = (index: number) => {
    onFormChange({
      keywords: formData.keywords.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      {/* 작성 시 참고 가이드라인 */}
      <div className="space-y-1.5">
        <Label htmlFor="guideline" className="text-xs font-medium text-gray-700">
          작성 시 참고 가이드라인
        </Label>
        <Textarea
          id="guideline"
          value={formData.guideline}
          onChange={(e) => onFormChange({ guideline: e.target.value })}
          placeholder="블로거가 참고할 가이드라인을 입력하세요"
          className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 text-sm min-h-[80px]"
        />
      </div>

      {/* 포스팅 내 희망 키워드 */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">
          포스팅 내 희망 키워드 (최대 5개)
        </Label>
        <div className="grid grid-cols-2 gap-1.5">
          <Input
            placeholder="메인 키워드 (예: 강남)"
            value={keywordInput.main}
            onChange={(e) => setKeywordInput(prev => ({ ...prev, main: e.target.value }))}
            disabled={formData.keywords.length >= 5}
            className="border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-8 text-xs sm:text-sm"
          />
          <div className="flex gap-1.5">
            <Input
              placeholder="서브 키워드 (예: 맛집)"
              value={keywordInput.sub}
              onChange={(e) => setKeywordInput(prev => ({ ...prev, sub: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              disabled={formData.keywords.length >= 5}
              className="flex-1 border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-8 text-xs sm:text-sm"
            />
            <Button
              type="button"
              onClick={addKeyword}
              disabled={formData.keywords.length >= 5 || !keywordInput.main.trim() || !keywordInput.sub.trim()}
              className="h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white text-xs"
            >
              추가
            </Button>
          </div>
        </div>
        {formData.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {formData.keywords.map((keyword, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-100 text-sky-700 rounded-md text-xs border border-sky-200"
              >
                <span className="font-medium">{keyword.main}</span>
                <span className="text-sky-400">/</span>
                <span>{keyword.sub}</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="ml-0.5 hover:bg-sky-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <span className="text-xs text-gray-500">
          메인/서브 키워드 쌍을 최대 5개까지 추가할 수 있습니다 ({formData.keywords.length}/5)
        </span>
      </div>
    </>
  );
}

