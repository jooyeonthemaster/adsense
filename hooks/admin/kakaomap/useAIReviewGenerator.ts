'use client';

import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  BusinessType,
  GeneratedReview,
  RatioSliderConfig,
  AIReviewGenerateRequest,
  AIReviewGenerateResponse,
  DEFAULT_LENGTH_RATIOS,
  DEFAULT_TONE_RATIOS,
  DEFAULT_EMOJI_RATIOS,
  StoreInfo,
  DEFAULT_STORE_INFO,
} from '@/types/review/ai-generation';
import { getBusinessPrompt, detectBusinessType } from '@/lib/review-prompts';

export type Step = 'config' | 'generating' | 'preview';

// 비율 기반으로 개수 재계산하는 헬퍼 함수
function recalculateRatios(
  items: RatioSliderConfig[],
  newTotalCount: number
): RatioSliderConfig[] {
  if (newTotalCount <= 0) {
    return items.map((item) => ({ ...item, count: 0 }));
  }

  const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
  const result: RatioSliderConfig[] = [];
  let assignedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i === items.length - 1) {
      result.push({ ...item, count: Math.max(0, newTotalCount - assignedCount) });
    } else {
      const calculatedCount = Math.round((item.percentage / totalPercentage) * newTotalCount);
      result.push({ ...item, count: calculatedCount });
      assignedCount += calculatedCount;
    }
  }

  return result;
}

interface UseAIReviewGeneratorProps {
  submissionId: string;
  companyName: string;
  currentCount: number;
  totalCount: number;
  onSaveComplete: () => void;
}

export interface UseAIReviewGeneratorReturn {
  // Step state
  step: Step;
  setStep: (step: Step) => void;

  // Config state
  keyword: string;
  count: number;
  businessType: BusinessType;
  setBusinessType: (type: BusinessType) => void;
  customPrompt: string;
  editingPrompt: string;
  setEditingPrompt: (prompt: string) => void;

  // Ratios
  lengthRatios: RatioSliderConfig[];
  setLengthRatios: (ratios: RatioSliderConfig[]) => void;
  toneRatios: RatioSliderConfig[];
  setToneRatios: (ratios: RatioSliderConfig[]) => void;
  emojiRatios: RatioSliderConfig[];
  setEmojiRatios: (ratios: RatioSliderConfig[]) => void;

  // Store info
  storeInfo: StoreInfo;
  setStoreInfo: (info: StoreInfo) => void;
  hasStoreInfo: boolean;

  // UI toggles
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  showPromptEdit: boolean;
  showStoreInfo: boolean;
  setShowStoreInfo: (show: boolean) => void;

  // Generation state
  isGenerating: boolean;
  generationProgress: number;
  generatedReviews: GeneratedReview[];
  generationError: string | null;
  isSaving: boolean;

  // Computed values
  remainingCount: number;
  maxGenerateCount: number;
  currentPrompt: string;
  defaultPrompt: string;

  // Handlers
  handleKeywordChange: (value: string) => void;
  handleCountChange: (newCount: number) => void;
  handleOpenPromptEdit: (open: boolean) => void;
  handleSavePrompt: () => void;
  handleResetPrompt: () => void;
  handleGenerate: () => Promise<void>;
  handleUpdateReview: (id: string, updates: Partial<GeneratedReview>) => void;
  handleDeleteReview: (id: string) => void;
  handleRegenerateReview: (id: string) => Promise<void>;
  handleSaveSelected: () => Promise<void>;
  handleBackToConfig: () => void;
}

export function useAIReviewGenerator({
  submissionId,
  companyName,
  currentCount,
  totalCount,
  onSaveComplete,
}: UseAIReviewGeneratorProps): UseAIReviewGeneratorReturn {
  const { toast } = useToast();

  // Step state
  const [step, setStep] = useState<Step>('config');

  // Config state
  const [keyword, setKeyword] = useState(companyName);
  const initialCount = Math.max(1, Math.min(10, totalCount - currentCount));
  const [count, setCount] = useState(initialCount);
  const [businessType, setBusinessType] = useState<BusinessType>(() =>
    detectBusinessType(companyName)
  );
  const [customPrompt, setCustomPrompt] = useState('');
  const [editingPrompt, setEditingPrompt] = useState('');

  // Ratios
  const [lengthRatios, setLengthRatios] = useState<RatioSliderConfig[]>(() =>
    recalculateRatios(DEFAULT_LENGTH_RATIOS, initialCount)
  );
  const [toneRatios, setToneRatios] = useState<RatioSliderConfig[]>(() =>
    recalculateRatios(DEFAULT_TONE_RATIOS, initialCount)
  );
  const [emojiRatios, setEmojiRatios] = useState<RatioSliderConfig[]>(() =>
    recalculateRatios(DEFAULT_EMOJI_RATIOS, initialCount)
  );

  // Store info
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() => ({
    ...DEFAULT_STORE_INFO,
    name: companyName,
  }));

  // UI toggles
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPromptEdit, setShowPromptEdit] = useState(false);
  const [showStoreInfo, setShowStoreInfo] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedReviews, setGeneratedReviews] = useState<GeneratedReview[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Computed values
  const remainingCount = totalCount - currentCount;
  const maxGenerateCount = 500;

  const currentPrompt = useMemo(
    () => customPrompt || getBusinessPrompt(businessType),
    [customPrompt, businessType]
  );

  const defaultPrompt = useMemo(() => getBusinessPrompt(businessType), [businessType]);

  const hasStoreInfo = useMemo(() => {
    return Boolean(storeInfo.additional_info?.trim());
  }, [storeInfo.additional_info]);

  // Handlers
  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
    setStoreInfo((prev) => ({ ...prev, name: value }));
    const detected = detectBusinessType(value);
    if (detected !== 'general') {
      setBusinessType(detected);
    }
  }, []);

  const handleCountChange = useCallback((newCount: number) => {
    const clampedCount = Math.min(500, Math.max(1, newCount));
    setCount(clampedCount);
    setLengthRatios((prev) => recalculateRatios(prev, clampedCount));
    setToneRatios((prev) => recalculateRatios(prev, clampedCount));
    setEmojiRatios((prev) => recalculateRatios(prev, clampedCount));
  }, []);

  const handleOpenPromptEdit = useCallback(
    (open: boolean) => {
      if (open) {
        setEditingPrompt(currentPrompt);
      }
      setShowPromptEdit(open);
    },
    [currentPrompt]
  );

  const handleSavePrompt = useCallback(() => {
    const trimmed = editingPrompt.trim();
    if (trimmed && trimmed !== defaultPrompt) {
      setCustomPrompt(trimmed);
      toast({
        title: '프롬프트 저장됨',
        description: '커스텀 프롬프트가 적용되었습니다.',
      });
    } else {
      setCustomPrompt('');
    }
  }, [editingPrompt, defaultPrompt, toast]);

  const handleResetPrompt = useCallback(() => {
    setEditingPrompt(defaultPrompt);
    setCustomPrompt('');
    toast({
      title: '기본값 복원',
      description: '프롬프트가 기본값으로 복원되었습니다.',
    });
  }, [defaultPrompt, toast]);

  const handleGenerate = useCallback(async () => {
    if (!keyword.trim()) {
      toast({
        title: '오류',
        description: '업체명/키워드를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (count < 1 || count > maxGenerateCount) {
      toast({
        title: '오류',
        description: `생성 수량은 1~${maxGenerateCount}개 사이여야 합니다.`,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress(0);
    setStep('generating');

    try {
      const request: AIReviewGenerateRequest = {
        submission_id: submissionId,
        keyword: keyword.trim(),
        count,
        business_type: businessType,
        length_ratios: lengthRatios.map((r) => ({
          value: r.value,
          percentage: count > 0 ? Math.round((r.count / count) * 100) : 0,
        })),
        tone_ratios: toneRatios.map((r) => ({
          value: r.value,
          percentage: count > 0 ? Math.round((r.count / count) * 100) : 0,
        })),
        emoji_ratios: emojiRatios.map((r) => ({
          value: r.value,
          percentage: count > 0 ? Math.round((r.count / count) * 100) : 0,
        })),
        custom_prompt: customPrompt || undefined,
        store_info: hasStoreInfo ? storeInfo : undefined,
      };

      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const response = await fetch('/api/admin/kakaomap/generate-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      clearInterval(progressInterval);

      const data: AIReviewGenerateResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI 리뷰 생성에 실패했습니다.');
      }

      setGenerationProgress(100);
      setGeneratedReviews(data.reviews);
      setStep('preview');

      toast({
        title: '생성 완료',
        description: `${data.reviews.length}개의 리뷰가 생성되었습니다.`,
      });
    } catch (error) {
      console.error('생성 오류:', error);
      setGenerationError(
        error instanceof Error ? error.message : 'AI 리뷰 생성 중 오류가 발생했습니다.'
      );
      setStep('config');
      toast({
        title: '생성 실패',
        description: error instanceof Error ? error.message : '오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    keyword,
    count,
    maxGenerateCount,
    submissionId,
    businessType,
    lengthRatios,
    toneRatios,
    emojiRatios,
    customPrompt,
    hasStoreInfo,
    storeInfo,
    toast,
  ]);

  const handleUpdateReview = useCallback((id: string, updates: Partial<GeneratedReview>) => {
    setGeneratedReviews((prev) =>
      prev.map((review) => (review.id === id ? { ...review, ...updates } : review))
    );
  }, []);

  const handleDeleteReview = useCallback((id: string) => {
    setGeneratedReviews((prev) => prev.filter((review) => review.id !== id));
  }, []);

  const handleRegenerateReview = useCallback(
    async (id: string) => {
      const review = generatedReviews.find((r) => r.id === id);
      if (!review) return;

      try {
        const response = await fetch('/api/admin/kakaomap/generate-reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: keyword.trim(),
            business_type: businessType,
            length_type: review.length_type,
            tone_type: review.tone_type,
            has_emoji: review.has_emoji,
            custom_prompt: customPrompt || undefined,
            store_info: hasStoreInfo ? storeInfo : undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || '재생성에 실패했습니다.');
        }

        setGeneratedReviews((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...data.review,
                  id,
                  selected: r.selected,
                }
              : r
          )
        );

        toast({
          title: '재생성 완료',
          description: '리뷰가 새로 생성되었습니다.',
        });
      } catch (error) {
        toast({
          title: '재생성 실패',
          description: error instanceof Error ? error.message : '오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    },
    [generatedReviews, keyword, businessType, customPrompt, hasStoreInfo, storeInfo, toast]
  );

  const handleSaveSelected = useCallback(async () => {
    const selectedReviews = generatedReviews.filter((r) => r.selected);

    if (selectedReviews.length === 0) {
      toast({
        title: '선택 필요',
        description: '저장할 리뷰를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedReviews.length > remainingCount) {
      toast({
        title: '초과',
        description: `최대 ${remainingCount}개까지 저장 가능합니다.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      let savedCount = 0;

      for (const review of selectedReviews) {
        const response = await fetch(`/api/admin/kakaomap/${submissionId}/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script_text: review.script_text,
          }),
        });

        if (response.ok) {
          savedCount++;
        }
      }

      toast({
        title: '저장 완료',
        description: `${savedCount}개의 리뷰가 저장되었습니다.`,
      });

      setGeneratedReviews((prev) => prev.filter((r) => !r.selected));
      onSaveComplete();

      if (generatedReviews.length === selectedReviews.length) {
        setStep('config');
        setGeneratedReviews([]);
      }
    } catch {
      toast({
        title: '저장 실패',
        description: '일부 리뷰 저장에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [generatedReviews, remainingCount, submissionId, toast, onSaveComplete]);

  const handleBackToConfig = useCallback(() => {
    setStep('config');
  }, []);

  return {
    // Step state
    step,
    setStep,

    // Config state
    keyword,
    count,
    businessType,
    setBusinessType,
    customPrompt,
    editingPrompt,
    setEditingPrompt,

    // Ratios
    lengthRatios,
    setLengthRatios,
    toneRatios,
    setToneRatios,
    emojiRatios,
    setEmojiRatios,

    // Store info
    storeInfo,
    setStoreInfo,
    hasStoreInfo,

    // UI toggles
    showAdvanced,
    setShowAdvanced,
    showPromptEdit,
    showStoreInfo,
    setShowStoreInfo,

    // Generation state
    isGenerating,
    generationProgress,
    generatedReviews,
    generationError,
    isSaving,

    // Computed values
    remainingCount,
    maxGenerateCount,
    currentPrompt,
    defaultPrompt,

    // Handlers
    handleKeywordChange,
    handleCountChange,
    handleOpenPromptEdit,
    handleSavePrompt,
    handleResetPrompt,
    handleGenerate,
    handleUpdateReview,
    handleDeleteReview,
    handleRegenerateReview,
    handleSaveSelected,
    handleBackToConfig,
  };
}
