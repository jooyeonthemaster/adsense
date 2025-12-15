'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

import { useAIReviewGenerator } from '@/hooks/admin/kakaomap/useAIReviewGenerator';
import { AIReviewConfigStep } from './AIReviewConfigStep';
import { AIReviewGeneratingStep } from './AIReviewGeneratingStep';
import { AIReviewPreviewStep } from './AIReviewPreviewStep';

interface AIReviewGeneratorProps {
  submissionId: string;
  companyName: string;
  currentCount: number;
  totalCount: number;
  onSaveComplete: () => void;
}

export function AIReviewGenerator({
  submissionId,
  companyName,
  currentCount,
  totalCount,
  onSaveComplete,
}: AIReviewGeneratorProps) {
  const generator = useAIReviewGenerator({
    submissionId,
    companyName,
    currentCount,
    totalCount,
    onSaveComplete,
  });

  // 설정 화면
  if (generator.step === 'config') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 리뷰 원고 생성
          </CardTitle>
          <CardDescription>
            Gemini AI가 자연스러운 리뷰 원고를 자동으로 생성합니다.
            {generator.remainingCount > 0 ? (
              <Badge variant="outline" className="ml-2">
                {generator.remainingCount}개 추가 등록 가능
              </Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">
                등록 가능 수량 없음
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIReviewConfigStep
            keyword={generator.keyword}
            count={generator.count}
            currentCount={currentCount}
            totalCount={totalCount}
            remainingCount={generator.remainingCount}
            businessType={generator.businessType}
            setBusinessType={generator.setBusinessType}
            customPrompt={generator.customPrompt}
            editingPrompt={generator.editingPrompt}
            setEditingPrompt={generator.setEditingPrompt}
            defaultPrompt={generator.defaultPrompt}
            lengthRatios={generator.lengthRatios}
            setLengthRatios={generator.setLengthRatios}
            toneRatios={generator.toneRatios}
            setToneRatios={generator.setToneRatios}
            emojiRatios={generator.emojiRatios}
            setEmojiRatios={generator.setEmojiRatios}
            storeInfo={generator.storeInfo}
            setStoreInfo={generator.setStoreInfo}
            hasStoreInfo={generator.hasStoreInfo}
            showAdvanced={generator.showAdvanced}
            setShowAdvanced={generator.setShowAdvanced}
            showPromptEdit={generator.showPromptEdit}
            showStoreInfo={generator.showStoreInfo}
            setShowStoreInfo={generator.setShowStoreInfo}
            generationError={generator.generationError}
            onKeywordChange={generator.handleKeywordChange}
            onCountChange={generator.handleCountChange}
            onOpenPromptEdit={generator.handleOpenPromptEdit}
            onSavePrompt={generator.handleSavePrompt}
            onResetPrompt={generator.handleResetPrompt}
            onGenerate={generator.handleGenerate}
          />
        </CardContent>
      </Card>
    );
  }

  // 생성 중 화면
  if (generator.step === 'generating') {
    return (
      <AIReviewGeneratingStep
        count={generator.count}
        generationProgress={generator.generationProgress}
      />
    );
  }

  // 미리보기 화면
  return (
    <AIReviewPreviewStep
      generatedReviews={generator.generatedReviews}
      isSaving={generator.isSaving}
      remainingCount={generator.remainingCount}
      onUpdateReview={generator.handleUpdateReview}
      onDeleteReview={generator.handleDeleteReview}
      onRegenerateReview={generator.handleRegenerateReview}
      onSaveSelected={generator.handleSaveSelected}
      onBackToConfig={generator.handleBackToConfig}
    />
  );
}
