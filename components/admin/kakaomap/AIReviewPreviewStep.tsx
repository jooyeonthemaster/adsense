'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ReviewPreviewList } from './ReviewPreviewList';
import type { GeneratedReview } from '@/types/review/ai-generation';

interface AIReviewPreviewStepProps {
  generatedReviews: GeneratedReview[];
  isSaving: boolean;
  remainingCount: number;
  onUpdateReview: (id: string, updates: Partial<GeneratedReview>) => void;
  onDeleteReview: (id: string) => void;
  onRegenerateReview: (id: string) => Promise<void>;
  onSaveSelected: () => Promise<void>;
  onBackToConfig: () => void;
}

export function AIReviewPreviewStep({
  generatedReviews,
  isSaving,
  remainingCount,
  onUpdateReview,
  onDeleteReview,
  onRegenerateReview,
  onSaveSelected,
  onBackToConfig,
}: AIReviewPreviewStepProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBackToConfig} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          설정으로 돌아가기
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          {generatedReviews.length}개 생성 완료
        </div>
      </div>

      {/* 미리보기 목록 */}
      <ReviewPreviewList
        reviews={generatedReviews}
        onUpdateReview={onUpdateReview}
        onDeleteReview={onDeleteReview}
        onRegenerateReview={onRegenerateReview}
        onSaveSelected={onSaveSelected}
        isSaving={isSaving}
        maxSaveCount={remainingCount}
      />
    </div>
  );
}
