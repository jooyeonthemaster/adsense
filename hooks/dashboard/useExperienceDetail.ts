'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WORKFLOW_CONFIG } from '@/types/experience-blogger';
import { getWorkflowSteps } from '@/lib/experience-deadline-utils';
import type {
  ExperienceSubmission,
  ExperienceBlogger,
  WorkflowStep,
  BloggerSortBy,
  BloggerFilter,
  StepStatus,
} from '@/components/dashboard/experience-detail/types';
import { STEP_LABELS } from '@/components/dashboard/experience-detail/constants';

interface UseExperienceDetailReturn {
  // Data
  loading: boolean;
  submission: ExperienceSubmission | null;
  bloggers: ExperienceBlogger[];
  selectedBloggers: ExperienceBlogger[];
  publishedCount: number;
  config: typeof WORKFLOW_CONFIG[string] | undefined;
  steps: WorkflowStep[];
  currentStep: number;

  // Blogger selection
  selectedBloggerIds: string[];
  setSelectedBloggerIds: (ids: string[]) => void;
  selectLoading: boolean;
  selectDialogOpen: boolean;
  setSelectDialogOpen: (open: boolean) => void;
  bloggerSortBy: BloggerSortBy;
  setBloggerSortBy: (sort: BloggerSortBy) => void;
  bloggerFilter: BloggerFilter;
  setBloggerFilter: (filter: BloggerFilter) => void;

  // Schedule confirmation
  confirmDialogOpen: boolean;
  setConfirmDialogOpen: (open: boolean) => void;
  confirmLoading: boolean;

  // Kakao inquiry
  kakaoInquiryOpen: boolean;
  setKakaoInquiryOpen: (open: boolean) => void;

  // Handlers
  fetchData: () => Promise<void>;
  handleSelectBloggers: () => Promise<void>;
  handleConfirmSchedule: () => Promise<void>;
  toggleBloggerSelection: (bloggerId: string) => void;
  selectAllBloggers: () => void;
  deselectAllBloggers: () => void;
  selectTopN: (n: number) => void;
  getFilteredAndSortedBloggers: () => ExperienceBlogger[];
  getStepStatus: (stepNumber: number) => StepStatus;
}

export function useExperienceDetail(submissionId: string): UseExperienceDetailReturn {
  const { toast } = useToast();

  // Data state
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<ExperienceSubmission | null>(null);
  const [bloggers, setBloggers] = useState<ExperienceBlogger[]>([]);

  // Blogger selection state
  const [selectedBloggerIds, setSelectedBloggerIds] = useState<string[]>([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [bloggerSortBy, setBloggerSortBy] = useState<BloggerSortBy>('index-high');
  const [bloggerFilter, setBloggerFilter] = useState<BloggerFilter>('all');

  // Schedule confirmation state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Kakao inquiry state
  const [kakaoInquiryOpen, setKakaoInquiryOpen] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/experience/${submissionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setSubmission(data.submission);
      setBloggers(data.bloggers || []);

      // Initialize selected bloggers
      const selected = (data.bloggers || [])
        .filter((b: ExperienceBlogger) => b.selected_by_client)
        .map((b: ExperienceBlogger) => b.id);
      setSelectedBloggerIds(selected);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: '데이터 로드 실패',
        description: '체험단 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [submissionId, toast]);

  // Select bloggers handler
  const handleSelectBloggers = useCallback(async () => {
    if (selectedBloggerIds.length === 0) {
      toast({
        title: '선택 오류',
        description: '최소 1명의 블로거를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSelectLoading(true);
      const response = await fetch(`/api/client/experience/${submissionId}/select-bloggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogger_ids: selectedBloggerIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to select bloggers');
      }

      toast({
        title: '블로거 선택 완료',
        description: `${selectedBloggerIds.length}명의 블로거를 선택했습니다.`,
      });

      setSelectDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error selecting bloggers:', error);
      toast({
        title: '선택 실패',
        description: '블로거 선택에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSelectLoading(false);
    }
  }, [submissionId, selectedBloggerIds, toast, fetchData]);

  // Confirm schedule handler
  const handleConfirmSchedule = useCallback(async () => {
    try {
      setConfirmLoading(true);
      const response = await fetch(`/api/client/experience/${submissionId}/confirm-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm schedule');
      }

      toast({
        title: '일정 확인 완료',
        description: '방문 일정을 확인했습니다.',
      });

      setConfirmDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error confirming schedule:', error);
      toast({
        title: '확인 실패',
        description: error.message || '일정 확인에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setConfirmLoading(false);
    }
  }, [submissionId, toast, fetchData]);

  // Toggle blogger selection
  const toggleBloggerSelection = useCallback((bloggerId: string) => {
    setSelectedBloggerIds((prev) =>
      prev.includes(bloggerId)
        ? prev.filter((id) => id !== bloggerId)
        : [...prev, bloggerId]
    );
  }, []);

  // Quick selection functions
  const selectAllBloggers = useCallback(() => {
    setSelectedBloggerIds(bloggers.map((b) => b.id));
  }, [bloggers]);

  const deselectAllBloggers = useCallback(() => {
    setSelectedBloggerIds([]);
  }, []);

  const selectTopN = useCallback((n: number) => {
    const sortedByIndex = [...bloggers].sort((a, b) => b.index_score - a.index_score);
    setSelectedBloggerIds(sortedByIndex.slice(0, n).map((b) => b.id));
  }, [bloggers]);

  // Filter and sort bloggers
  const getFilteredAndSortedBloggers = useCallback(() => {
    let filtered = [...bloggers];

    // Apply filter
    if (bloggerFilter === '700+') {
      filtered = filtered.filter((b) => b.index_score >= 700);
    } else if (bloggerFilter === '800+') {
      filtered = filtered.filter((b) => b.index_score >= 800);
    } else if (bloggerFilter === '900+') {
      filtered = filtered.filter((b) => b.index_score >= 900);
    }

    // Apply sort
    if (bloggerSortBy === 'index-high') {
      filtered.sort((a, b) => b.index_score - a.index_score);
    } else if (bloggerSortBy === 'index-low') {
      filtered.sort((a, b) => a.index_score - b.index_score);
    } else if (bloggerSortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }

    return filtered;
  }, [bloggers, bloggerFilter, bloggerSortBy]);

  // Get current step
  const getCurrentStep = useCallback((): number => {
    if (!submission) return 1;

    const workflowSteps = getWorkflowSteps(submission.experience_type);

    for (let i = 0; i < workflowSteps.length; i++) {
      const stepType = workflowSteps[i];
      let isCompleted = false;

      switch (stepType) {
        case 'register':
          isCompleted = submission.bloggers_registered;
          break;
        case 'selection':
          isCompleted = submission.bloggers_selected;
          break;
        case 'schedule':
          isCompleted = submission.schedule_confirmed;
          break;
        case 'client_confirm':
          isCompleted = submission.client_confirmed;
          break;
        case 'publish':
          isCompleted = submission.all_published;
          break;
        case 'keyword_ranking':
          isCompleted = submission.all_published;
          break;
        case 'complete':
          isCompleted = submission.campaign_completed;
          break;
      }

      if (!isCompleted) {
        return i + 1;
      }
    }

    return workflowSteps.length;
  }, [submission]);

  // Get step status
  const getStepStatus = useCallback((stepNumber: number): StepStatus => {
    const current = getCurrentStep();
    if (stepNumber < current) return 'completed';
    if (stepNumber === current) return 'current';
    return 'upcoming';
  }, [getCurrentStep]);

  // Computed values
  const config = submission ? WORKFLOW_CONFIG[submission.experience_type] : undefined;

  const selectedBloggers = useMemo(() => {
    if (!config) return bloggers;
    return config.hasSelection
      ? bloggers.filter((b) => b.selected_by_client)
      : bloggers;
  }, [bloggers, config]);

  const publishedCount = useMemo(() => {
    return selectedBloggers.filter((b) => b.published).length;
  }, [selectedBloggers]);

  const steps = useMemo((): WorkflowStep[] => {
    if (!submission) return [];
    const workflowSteps = getWorkflowSteps(submission.experience_type);
    return workflowSteps.map((stepType, index) => ({
      number: index + 1,
      label: STEP_LABELS[stepType]?.label || stepType,
      description: STEP_LABELS[stepType]?.description || '',
    }));
  }, [submission]);

  const currentStep = getCurrentStep();

  // Effect
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    // Data
    loading,
    submission,
    bloggers,
    selectedBloggers,
    publishedCount,
    config,
    steps,
    currentStep,

    // Blogger selection
    selectedBloggerIds,
    setSelectedBloggerIds,
    selectLoading,
    selectDialogOpen,
    setSelectDialogOpen,
    bloggerSortBy,
    setBloggerSortBy,
    bloggerFilter,
    setBloggerFilter,

    // Schedule confirmation
    confirmDialogOpen,
    setConfirmDialogOpen,
    confirmLoading,

    // Kakao inquiry
    kakaoInquiryOpen,
    setKakaoInquiryOpen,

    // Handlers
    fetchData,
    handleSelectBloggers,
    handleConfirmSchedule,
    toggleBloggerSelection,
    selectAllBloggers,
    deselectAllBloggers,
    selectTopN,
    getFilteredAndSortedBloggers,
    getStepStatus,
  };
}
