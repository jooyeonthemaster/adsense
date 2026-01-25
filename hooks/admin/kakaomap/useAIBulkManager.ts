'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AISubmissionSummary,
  SubmissionProcessState,
  AIBulkStats,
  SortBy,
  ProcessStep,
  createDefaultProcessState,
  recalculateRatios,
  AIConfigState,
} from '@/components/admin/kakaomap/ai-bulk-manager/types';
import {
  GeneratedReview,
  AIReviewGenerateRequest,
  AIReviewGenerateResponse,
  BusinessType,
  RatioSliderConfig,
} from '@/types/review/ai-generation';
import { detectBusinessType } from '@/lib/review-prompts';

export function useAIBulkManager() {
  const { toast } = useToast();

  // 전역 상태
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<AISubmissionSummary[]>([]);
  const [submissionStates, setSubmissionStates] = useState<Map<string, SubmissionProcessState>>(
    new Map()
  );

  // 필터 상태
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('remaining');

  // 데이터 로딩
  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/kakaomap/ai-pending');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '데이터 로딩 실패');
      }

      setSubmissions(data.submissions);

      // 새 접수건에 대한 상태 초기화 (기존 상태 유지)
      setSubmissionStates((prev) => {
        const newMap = new Map(prev);
        data.submissions.forEach((sub: AISubmissionSummary) => {
          if (!newMap.has(sub.id)) {
            newMap.set(sub.id, createDefaultProcessState(sub));
          }
        });
        // 더 이상 존재하지 않는 접수건 상태 제거
        const currentIds = new Set(data.submissions.map((s: AISubmissionSummary) => s.id));
        newMap.forEach((_, key) => {
          if (!currentIds.has(key)) {
            newMap.delete(key);
          }
        });
        return newMap;
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: '로딩 실패',
        description: error instanceof Error ? error.message : '데이터를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 초기 로딩
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // 특정 접수건 상태 업데이트
  const updateSubmissionState = useCallback(
    (submissionId: string, updates: Partial<SubmissionProcessState>) => {
      setSubmissionStates((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(submissionId);
        if (current) {
          newMap.set(submissionId, { ...current, ...updates });
        }
        return newMap;
      });
    },
    []
  );

  // 설정 업데이트
  const updateConfig = useCallback(
    (submissionId: string, configUpdates: Partial<AIConfigState>) => {
      setSubmissionStates((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(submissionId);
        if (current) {
          newMap.set(submissionId, {
            ...current,
            config: { ...current.config, ...configUpdates },
          });
        }
        return newMap;
      });
    },
    []
  );

  // 키워드 변경 핸들러
  const handleKeywordChange = useCallback(
    (submissionId: string, value: string) => {
      const detected = detectBusinessType(value);
      updateConfig(submissionId, {
        keyword: value,
        businessType: detected !== 'general' ? detected : undefined,
      });
    },
    [updateConfig]
  );

  // 생성 수량 변경 핸들러
  const handleCountChange = useCallback(
    (submissionId: string, newCount: number) => {
      setSubmissionStates((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(submissionId);
        if (current) {
          const clampedCount = Math.min(500, Math.max(1, newCount));
          newMap.set(submissionId, {
            ...current,
            config: {
              ...current.config,
              count: clampedCount,
              lengthRatios: recalculateRatios(current.config.lengthRatios, clampedCount),
              toneRatios: recalculateRatios(current.config.toneRatios, clampedCount),
              emojiRatios: recalculateRatios(current.config.emojiRatios, clampedCount),
            },
          });
        }
        return newMap;
      });
    },
    []
  );

  // 펼침/닫힘 토글
  const toggleExpand = useCallback((submissionId: string) => {
    setSubmissionStates((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(submissionId);
      if (current) {
        newMap.set(submissionId, {
          ...current,
          isExpanded: !current.isExpanded,
          step: !current.isExpanded && current.step === 'idle' ? 'config' : current.step,
        });
      }
      return newMap;
    });
  }, []);

  // AI 생성 시작
  const generateReviews = useCallback(
    async (submissionId: string) => {
      const state = submissionStates.get(submissionId);
      const submission = submissions.find((s) => s.id === submissionId);

      if (!state || !submission || state.isGenerating) return;

      const { config } = state;

      if (!config.keyword.trim()) {
        toast({
          title: '오류',
          description: '업체명/키워드를 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      updateSubmissionState(submissionId, {
        isGenerating: true,
        generationProgress: 0,
        generationError: null,
        step: 'generating',
      });

      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setSubmissionStates((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(submissionId);
          if (current && current.isGenerating) {
            newMap.set(submissionId, {
              ...current,
              generationProgress: Math.min(current.generationProgress + 5, 90),
            });
          }
          return newMap;
        });
      }, 500);

      try {
        const request: AIReviewGenerateRequest = {
          submission_id: submissionId,
          keyword: config.keyword.trim(),
          count: config.count,
          business_type: config.businessType,
          length_ratios: config.lengthRatios.map((r) => ({
            value: r.value,
            percentage: config.count > 0 ? Math.round((r.count / config.count) * 100) : 0,
          })),
          tone_ratios: config.toneRatios.map((r) => ({
            value: r.value,
            percentage: config.count > 0 ? Math.round((r.count / config.count) * 100) : 0,
          })),
          emoji_ratios: config.emojiRatios.map((r) => ({
            value: r.value,
            percentage: config.count > 0 ? Math.round((r.count / config.count) * 100) : 0,
          })),
          custom_prompt: config.customPrompt || undefined,
          store_info: config.storeInfo.additional_info?.trim() ? config.storeInfo : undefined,
        };

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

        updateSubmissionState(submissionId, {
          generationProgress: 100,
          generatedReviews: data.reviews,
          step: 'preview',
          isGenerating: false,
        });

        toast({
          title: '생성 완료',
          description: `${submission.company_name}: ${data.reviews.length}개의 리뷰가 생성되었습니다.`,
        });
      } catch (error) {
        clearInterval(progressInterval);
        console.error('Generation error:', error);

        updateSubmissionState(submissionId, {
          generationError: error instanceof Error ? error.message : '생성 실패',
          step: 'config',
          isGenerating: false,
        });

        toast({
          title: '생성 실패',
          description: `${submission.company_name}: ${
            error instanceof Error ? error.message : '오류가 발생했습니다.'
          }`,
          variant: 'destructive',
        });
      }
    },
    [submissionStates, submissions, updateSubmissionState, toast]
  );

  // 리뷰 업데이트
  const updateReview = useCallback(
    (submissionId: string, reviewId: string, updates: Partial<GeneratedReview>) => {
      setSubmissionStates((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(submissionId);
        if (current) {
          newMap.set(submissionId, {
            ...current,
            generatedReviews: current.generatedReviews.map((r) =>
              r.id === reviewId ? { ...r, ...updates } : r
            ),
          });
        }
        return newMap;
      });
    },
    []
  );

  // 리뷰 삭제
  const deleteReview = useCallback((submissionId: string, reviewId: string) => {
    setSubmissionStates((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(submissionId);
      if (current) {
        newMap.set(submissionId, {
          ...current,
          generatedReviews: current.generatedReviews.filter((r) => r.id !== reviewId),
        });
      }
      return newMap;
    });
  }, []);

  // 선택된 리뷰 저장
  const saveSelectedReviews = useCallback(
    async (submissionId: string) => {
      const state = submissionStates.get(submissionId);
      const submission = submissions.find((s) => s.id === submissionId);

      if (!state || !submission) return;

      const selectedReviews = state.generatedReviews.filter((r) => r.selected);

      if (selectedReviews.length === 0) {
        toast({
          title: '선택 필요',
          description: '저장할 리뷰를 선택해주세요.',
          variant: 'destructive',
        });
        return;
      }

      if (selectedReviews.length > submission.remaining_count) {
        toast({
          title: '초과',
          description: `최대 ${submission.remaining_count}개까지 저장 가능합니다.`,
          variant: 'destructive',
        });
        return;
      }

      updateSubmissionState(submissionId, { isSaving: true });

      try {
        let savedCount = 0;

        for (const review of selectedReviews) {
          const response = await fetch(`/api/admin/kakaomap/${submissionId}/content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script_text: review.script_text }),
          });

          if (response.ok) {
            savedCount++;
          }
        }

        toast({
          title: '저장 완료',
          description: `${submission.company_name}: ${savedCount}개의 리뷰가 저장되었습니다.`,
        });

        // 저장된 리뷰 제거
        setSubmissionStates((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(submissionId);
          if (current) {
            const remaining = current.generatedReviews.filter((r) => !r.selected);
            newMap.set(submissionId, {
              ...current,
              generatedReviews: remaining,
              step: remaining.length > 0 ? 'preview' : 'config',
              isSaving: false,
            });
          }
          return newMap;
        });

        // 데이터 새로고침
        await fetchSubmissions();
      } catch (error) {
        updateSubmissionState(submissionId, { isSaving: false });
        toast({
          title: '저장 실패',
          description: '일부 리뷰 저장에 실패했습니다.',
          variant: 'destructive',
        });
      }
    },
    [submissionStates, submissions, updateSubmissionState, fetchSubmissions, toast]
  );

  // 검수 요청
  const publishSubmission = useCallback(
    async (submissionId: string) => {
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) return;

      updateSubmissionState(submissionId, { isPublishing: true, step: 'publishing' });

      try {
        const response = await fetch(`/api/admin/kakaomap/${submissionId}/publish?force=true`, {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '검수 요청에 실패했습니다.');
        }

        toast({
          title: '검수 요청 완료',
          description: `${submission.company_name}: ${data.published_count}개의 원고가 검수 요청되었습니다.`,
        });

        // 데이터 새로고침 (완료된 건은 목록에서 제거됨)
        await fetchSubmissions();
      } catch (error) {
        updateSubmissionState(submissionId, { isPublishing: false, step: 'preview' });
        toast({
          title: '검수 요청 실패',
          description: error instanceof Error ? error.message : '오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    },
    [submissions, updateSubmissionState, fetchSubmissions, toast]
  );

  // 설정으로 돌아가기
  const backToConfig = useCallback((submissionId: string) => {
    updateSubmissionState(submissionId, { step: 'config' });
  }, [updateSubmissionState]);

  // 필터링된 접수건
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // 거래처 필터
    if (clientFilter !== 'all') {
      filtered = filtered.filter((s) => s.client_name === clientFilter);
    }

    // 정렬
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'remaining':
          return b.remaining_count - a.remaining_count;
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'company':
          return a.company_name.localeCompare(b.company_name);
        default:
          return 0;
      }
    });
  }, [submissions, clientFilter, sortBy]);

  // 통계 계산
  const stats = useMemo<AIBulkStats>(() => {
    const byClient: Record<string, { count: number; remaining: number }> = {};
    let totalRemaining = 0;
    let inProgress = 0;

    submissions.forEach((sub) => {
      totalRemaining += sub.remaining_count;

      const state = submissionStates.get(sub.id);
      if (state && state.isGenerating) {
        inProgress++;
      }

      if (!byClient[sub.client_name]) {
        byClient[sub.client_name] = { count: 0, remaining: 0 };
      }
      byClient[sub.client_name].count += 1;
      byClient[sub.client_name].remaining += sub.remaining_count;
    });

    return {
      totalSubmissions: submissions.length,
      totalRemaining,
      inProgress,
      byClient,
    };
  }, [submissions, submissionStates]);

  // 거래처 목록 (필터용)
  const clientList = useMemo(() => {
    const clients = new Set(submissions.map((s) => s.client_name));
    return Array.from(clients).sort();
  }, [submissions]);

  return {
    // 상태
    isLoading,
    submissions: filteredSubmissions,
    submissionStates,
    stats,
    clientList,

    // 필터
    clientFilter,
    setClientFilter,
    sortBy,
    setSortBy,

    // 액션
    fetchSubmissions,
    toggleExpand,
    updateConfig,
    handleKeywordChange,
    handleCountChange,
    generateReviews,
    updateReview,
    deleteReview,
    saveSelectedReviews,
    publishSubmission,
    backToConfig,
  };
}
