'use client';

import { Textarea } from '@/components/ui/textarea';
import { StoreInfo } from '@/types/review/ai-generation';

interface StoreInfoEditorProps {
  storeInfo: StoreInfo;
  onChange: (storeInfo: StoreInfo) => void;
  disabled?: boolean;
}

export function StoreInfoEditor({
  storeInfo,
  onChange,
  disabled = false,
}: StoreInfoEditorProps) {
  // 모든 정보를 하나의 additional_info 필드에 통합
  const handleChange = (value: string) => {
    onChange({
      ...storeInfo,
      additional_info: value,
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        메뉴, 가격, 분위기, 특장점 등 AI가 참고할 정보를 자유롭게 입력하세요.
      </p>
      <Textarea
        value={storeInfo.additional_info || ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`예시:
- 대표 메뉴: 한우 투뿔 등심 200g (45,000원), 육회 (25,000원)
- 가격대: 1인 3~5만원
- 분위기: 고급스럽고 조용함, 가족모임에 적합
- 특장점: 30년 전통, 무료주차, 예약 필수
- 반드시 넣을 키워드: 신선한, 투뿔, 가성비
- 피할 키워드: 비싸다, 협찬`}
        rows={8}
        disabled={disabled}
        className="text-sm"
      />
    </div>
  );
}
