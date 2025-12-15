'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  ExperienceBlogger,
  ExperienceSubmission,
  NewBlogger,
  BloggerSchedule,
  KeywordRanking,
  WORKFLOW_CONFIG,
} from '@/types/experience-blogger';
import { calculateBloggerRegistrationDeadline } from '@/lib/experience-deadline-utils';

export interface UseExperienceAdminReturn {
  // Data states
  loading: boolean;
  submission: ExperienceSubmission | null;
  bloggers: ExperienceBlogger[];
  progressPercentage: number;
  deadlineInfo: ReturnType<typeof calculateBloggerRegistrationDeadline>;
  config: typeof WORKFLOW_CONFIG[string] | undefined;
  selectedBloggers: ExperienceBlogger[];

  // Dialog states
  registerDialogOpen: boolean;
  setRegisterDialogOpen: (open: boolean) => void;
  scheduleDialogOpen: boolean;
  setScheduleDialogOpen: (open: boolean) => void;
  publishDialogOpen: boolean;
  setPublishDialogOpen: (open: boolean) => void;
  rankingsDialogOpen: boolean;
  setRankingsDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  bulkDeleteDialogOpen: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  reuploadDialogOpen: boolean;
  setReuploadDialogOpen: (open: boolean) => void;

  // Selection states
  selectedBloggerIds: string[];
  selectedBlogger: ExperienceBlogger | null;
  setSelectedBlogger: (blogger: ExperienceBlogger | null) => void;
  bloggerToDelete: { id: string; name: string } | null;

  // Loading states
  registerLoading: boolean;
  deleteLoading: boolean;
  bulkDeleteLoading: boolean;
  downloadingImages: boolean;

  // Pending data
  pendingBloggers: NewBlogger[];
  setPendingBloggers: (bloggers: NewBlogger[]) => void;

  // Tab state
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Handlers
  handleRegisterBloggers: (validBloggers: NewBlogger[]) => Promise<void>;
  handleFileReupload: () => Promise<void>;
  handleDeleteBlogger: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  handleSaveSchedule: (schedules: BloggerSchedule[]) => Promise<void>;
  handlePublish: (publishUrl: string) => Promise<void>;
  handleSaveRankings: (rankings: KeywordRanking[]) => Promise<void>;
  handleDownloadAllImages: () => Promise<void>;

  // UI Helper Functions
  toggleBloggerSelection: (bloggerId: string) => void;
  toggleSelectAll: () => void;
  openDeleteDialog: (bloggerId: string, bloggerName: string) => void;
  openBulkDeleteDialog: () => void;
  openPublishDialog: (blogger: ExperienceBlogger) => void;
  openRankingsDialog: (blogger: ExperienceBlogger) => void;

  // Navigation
  router: ReturnType<typeof useRouter>;
}

export function useExperienceAdmin(submissionId: string): UseExperienceAdminReturn {
  const router = useRouter();
  const { toast } = useToast();

  // Data states
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<ExperienceSubmission | null>(null);
  const [bloggers, setBloggers] = useState<ExperienceBlogger[]>([]);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [rankingsDialogOpen, setRankingsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [reuploadDialogOpen, setReuploadDialogOpen] = useState(false);

  // Selection states
  const [selectedBloggerIds, setSelectedBloggerIds] = useState<string[]>([]);
  const [selectedBlogger, setSelectedBlogger] = useState<ExperienceBlogger | null>(null);
  const [bloggerToDelete, setBloggerToDelete] = useState<{ id: string; name: string } | null>(null);

  // Loading states
  const [registerLoading, setRegisterLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [downloadingImages, setDownloadingImages] = useState(false);

  // Temporary data for reupload
  const [pendingBloggers, setPendingBloggers] = useState<NewBlogger[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Derived values
  const deadlineInfo = calculateBloggerRegistrationDeadline(submission?.created_at || null);
  const config = submission ? WORKFLOW_CONFIG[submission.experience_type] : undefined;
  const selectedBloggers = config?.hasSelection
    ? bloggers.filter((b) => b.selected_by_client)
    : bloggers;

  // Fetch status
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/experience/${submissionId}/status`);
      if (!response.ok) throw new Error('Failed to fetch status');

      const data = await response.json();
      setSubmission(data.submission);
      setBloggers(data.bloggers || []);
      setProgressPercentage(data.progress_percentage || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Register Bloggers
  const handleRegisterBloggers = async (validBloggers: NewBlogger[]) => {
    if (registerLoading) return;

    try {
      setRegisterLoading(true);
      const response = await fetch(`/api/admin/experience/${submissionId}/bloggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloggers: validBloggers }),
      });

      if (!response.ok) throw new Error('Failed to register bloggers');

      toast({
        title: '블로거 등록 완료',
        description: `${validBloggers.length}명의 블로거가 등록되었습니다.`,
      });
      setRegisterDialogOpen(false);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '등록 실패',
        description: '블로거 등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  // Handle File Reupload
  const handleFileReupload = async () => {
    try {
      setRegisterLoading(true);
      setReuploadDialogOpen(false);

      // Delete all existing unpublished bloggers
      const unpublishedBloggers = bloggers.filter((b) => !b.published);
      for (const blogger of unpublishedBloggers) {
        try {
          await fetch(`/api/admin/experience/${submissionId}/bloggers/${blogger.id}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.error('Delete error:', error);
        }
      }

      // Register new bloggers
      const response = await fetch(`/api/admin/experience/${submissionId}/bloggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloggers: pendingBloggers }),
      });

      if (!response.ok) throw new Error('Failed to register bloggers');

      toast({
        title: '파일 재등록 완료',
        description: `${pendingBloggers.length}명이 등록되었습니다.`,
      });

      setPendingBloggers([]);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '재등록 실패',
        description: '블로거 재등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  // Delete Blogger
  const handleDeleteBlogger = async () => {
    if (!bloggerToDelete || deleteLoading) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(
        `/api/admin/experience/${submissionId}/bloggers/${bloggerToDelete.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete blogger');

      toast({
        title: '블로거 삭제 완료',
        description: `${bloggerToDelete.name} 블로거가 삭제되었습니다.`,
      });
      setDeleteDialogOpen(false);
      setBloggerToDelete(null);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '삭제 실패',
        description: '블로거 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (bulkDeleteLoading) return;

    const deletableBloggers = bloggers.filter(
      (b) => selectedBloggerIds.includes(b.id) && !b.published
    );

    try {
      setBulkDeleteLoading(true);
      setBulkDeleteDialogOpen(false);

      let successCount = 0;
      for (const blogger of deletableBloggers) {
        try {
          const response = await fetch(
            `/api/admin/experience/${submissionId}/bloggers/${blogger.id}`,
            { method: 'DELETE' }
          );
          if (response.ok) successCount++;
        } catch {
          // continue
        }
      }

      toast({
        title: '일괄 삭제 완료',
        description: `${successCount}명의 블로거가 삭제되었습니다.`,
      });

      setSelectedBloggerIds([]);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '삭제 실패',
        description: '일괄 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Save Schedule
  const handleSaveSchedule = async (schedules: BloggerSchedule[]) => {
    try {
      const response = await fetch(`/api/admin/experience/${submissionId}/bloggers/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogger_schedules: schedules }),
      });

      if (!response.ok) throw new Error('Failed to add schedules');

      toast({
        title: '일정 등록 완료',
        description: '방문 일정이 등록되었습니다.',
      });
      setScheduleDialogOpen(false);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '등록 실패',
        description: '일정 등록에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Publish
  const handlePublish = async (publishUrl: string) => {
    if (!selectedBlogger || !publishUrl) return;

    try {
      const response = await fetch(
        `/api/admin/experience/${submissionId}/bloggers/${selectedBlogger.id}/publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published_url: publishUrl }),
        }
      );

      if (!response.ok) throw new Error('Failed to mark as published');

      toast({
        title: '발행 완료',
        description: '발행 완료 처리되었습니다.',
      });
      setPublishDialogOpen(false);
      setSelectedBlogger(null);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '처리 실패',
        description: '발행 처리에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Save Rankings
  const handleSaveRankings = async (rankings: KeywordRanking[]) => {
    if (!selectedBlogger) return;

    try {
      const response = await fetch(
        `/api/admin/experience/${submissionId}/bloggers/${selectedBlogger.id}/rankings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rankings }),
        }
      );

      if (!response.ok) throw new Error('Failed to add rankings');

      toast({
        title: '순위 등록 완료',
        description: '키워드 순위가 등록되었습니다.',
      });
      setRankingsDialogOpen(false);
      setSelectedBlogger(null);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '등록 실패',
        description: '순위 등록에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Download all images as ZIP
  const handleDownloadAllImages = async () => {
    if (!submission?.image_urls || submission.image_urls.length === 0) return;

    try {
      setDownloadingImages(true);
      const zip = new JSZip();
      const folder = zip.folder('images');

      if (!folder) {
        throw new Error('Failed to create ZIP folder');
      }

      for (let i = 0; i < submission.image_urls.length; i++) {
        const url = submission.image_urls[i];
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const fileName = `image_${i + 1}.${blob.type.split('/')[1] || 'jpg'}`;
          folder.file(fileName, blob);
        } catch (error) {
          console.error(`Failed to download image ${i + 1}:`, error);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${submission.company_name}_images.zip`);

      toast({
        title: '다운로드 완료',
        description: `${submission.image_urls.length}개의 이미지가 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('Error downloading images:', error);
      toast({
        title: '다운로드 실패',
        description: '이미지 다운로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingImages(false);
    }
  };

  // UI Helper Functions
  const toggleBloggerSelection = (bloggerId: string) => {
    setSelectedBloggerIds((prev) =>
      prev.includes(bloggerId) ? prev.filter((id) => id !== bloggerId) : [...prev, bloggerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBloggerIds.length === bloggers.length) {
      setSelectedBloggerIds([]);
    } else {
      setSelectedBloggerIds(bloggers.map((b) => b.id));
    }
  };

  const openDeleteDialog = (bloggerId: string, bloggerName: string) => {
    setBloggerToDelete({ id: bloggerId, name: bloggerName });
    setDeleteDialogOpen(true);
  };

  const openBulkDeleteDialog = () => {
    const deletableBloggers = bloggers.filter(
      (b) => selectedBloggerIds.includes(b.id) && !b.published
    );

    if (deletableBloggers.length === 0) {
      toast({
        title: '삭제 불가',
        description: '삭제할 수 있는 블로거가 없습니다. (발행된 블로거는 삭제할 수 없습니다)',
        variant: 'destructive',
      });
      return;
    }

    setBulkDeleteDialogOpen(true);
  };

  const openPublishDialog = (blogger: ExperienceBlogger) => {
    setSelectedBlogger(blogger);
    setPublishDialogOpen(true);
  };

  const openRankingsDialog = (blogger: ExperienceBlogger) => {
    setSelectedBlogger(blogger);
    setRankingsDialogOpen(true);
  };

  return {
    // Data states
    loading,
    submission,
    bloggers,
    progressPercentage,
    deadlineInfo,
    config,
    selectedBloggers,

    // Dialog states
    registerDialogOpen,
    setRegisterDialogOpen,
    scheduleDialogOpen,
    setScheduleDialogOpen,
    publishDialogOpen,
    setPublishDialogOpen,
    rankingsDialogOpen,
    setRankingsDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    reuploadDialogOpen,
    setReuploadDialogOpen,

    // Selection states
    selectedBloggerIds,
    selectedBlogger,
    setSelectedBlogger,
    bloggerToDelete,

    // Loading states
    registerLoading,
    deleteLoading,
    bulkDeleteLoading,
    downloadingImages,

    // Pending data
    pendingBloggers,
    setPendingBloggers,

    // Tab state
    activeTab,
    setActiveTab,

    // Handlers
    handleRegisterBloggers,
    handleFileReupload,
    handleDeleteBlogger,
    handleBulkDelete,
    handleSaveSchedule,
    handlePublish,
    handleSaveRankings,
    handleDownloadAllImages,

    // UI Helper Functions
    toggleBloggerSelection,
    toggleSelectAll,
    openDeleteDialog,
    openBulkDeleteDialog,
    openPublishDialog,
    openRankingsDialog,

    // Navigation
    router,
  };
}
