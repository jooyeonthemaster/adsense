'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ContentItem, Feedback, KmapSubmission, ContentFilter } from '@/types/review/kmap-content';
import { ReviewHeader } from '@/components/dashboard/review/kmap/ReviewHeader';
import { GeneralFeedbackSection } from '@/components/dashboard/review/kmap/GeneralFeedbackSection';
import { ContentFilterTabs } from '@/components/dashboard/review/kmap/ContentFilterTabs';
import { ContentGrid } from '@/components/dashboard/review/kmap/ContentGrid';
import { FeedbackDialog } from '@/components/dashboard/review/kmap/FeedbackDialog';
import { RevisionDialog } from '@/components/dashboard/review/kmap/RevisionDialog';
import { BulkApproveDialog } from '@/components/dashboard/review/kmap/BulkApproveDialog';

export default function KakaomapContentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  
  // 기본 상태
  const [submissionId, setSubmissionId] = useState<string>('');
  const [submission, setSubmission] = useState<KmapSubmission | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingReview, setProcessingReview] = useState(false);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');

  // 피드백 상태
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // 수정 요청 상태
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [itemForRevision, setItemForRevision] = useState<ContentItem | null>(null);

  // 일괄 승인 상태
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);
  const [pendingItemsForBulk, setPendingItemsForBulk] = useState<ContentItem[]>([]);

  // 공통 피드백 상태
  const [generalFeedbacks, setGeneralFeedbacks] = useState<Feedback[]>([]);

  // 초기 데이터 로드
  useEffect(() => {
    params.then((p) => {
      setSubmissionId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  // 데이터 페칭
  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      // Fetch submission details
      const submissionRes = await fetch(`/api/submissions/kakaomap/${id}`);
      if (!submissionRes.ok) throw new Error('Failed to fetch submission');
      const submissionData = await submissionRes.json();
      setSubmission(submissionData.submission || submissionData);

      // Fetch content items
      const contentRes = await fetch(`/api/submissions/kakaomap/${id}/content`);
      if (!contentRes.ok) throw new Error('Failed to fetch content');
      const contentData = await contentRes.json();
      setContentItems(contentData.items || []);

      // Fetch general feedbacks
      const feedbackRes = await fetch(`/api/submissions/kakaomap/${id}/feedback`);
      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setGeneralFeedbacks(feedbackData.feedbacks || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshContentItems = async () => {
    if (!submissionId) return;

    try {
      const response = await fetch(`/api/submissions/kakaomap/${submissionId}/content`);
      if (!response.ok) throw new Error('Failed to refresh content');

      const data = await response.json();
      setContentItems(data.items || []);
    } catch (error) {
      console.error('Refresh content error:', error);
    }
  };

  // 개별 검수 승인
  const handleApproveItem = async (item: ContentItem) => {
    if (!submissionId) return;
    setProcessingReview(true);

    try {
      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/content/${item.id}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review_status: 'approved' }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '검수 승인에 실패했습니다.');
      }

      toast({
        title: '검수 승인',
        description: `콘텐츠 #${item.upload_order}가 승인되었습니다.`,
      });
      await refreshContentItems();
    } catch (error) {
      console.error('Approve item error:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '검수 승인에 실패했습니다.',
      });
    } finally {
      setProcessingReview(false);
    }
  };

  // 개별 수정 요청
  const handleRequestItemRevision = (item: ContentItem) => {
    setItemForRevision(item);
    setRevisionDialogOpen(true);
  };

  const handleSubmitRevision = async (message: string) => {
    if (!submissionId || !itemForRevision) return;

    setProcessingReview(true);

    try {
      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/content/${itemForRevision.id}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            review_status: 'revision_requested',
            feedback_message: message,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '수정 요청에 실패했습니다.');
      }

      toast({
        title: '수정 요청 전송',
        description: `콘텐츠 #${itemForRevision.upload_order}에 수정 요청이 전송되었습니다.`,
      });
      setRevisionDialogOpen(false);
      setItemForRevision(null);
      await refreshContentItems();
    } catch (error) {
      console.error('Request revision error:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '수정 요청에 실패했습니다.',
      });
    } finally {
      setProcessingReview(false);
    }
  };

  // 일괄 검수 승인
  const handleBulkApprove = () => {
    const pendingItems = contentItems.filter((item) => item.review_status === 'pending');

    if (pendingItems.length === 0) {
      toast({
        title: '알림',
        description: '검수 대기중인 콘텐츠가 없습니다.',
      });
      return;
    }

    setPendingItemsForBulk(pendingItems);
    setBulkApproveDialogOpen(true);
  };

  const executeBulkApprove = async () => {
    setBulkApproveDialogOpen(false);
    setProcessingReview(true);

    try {
      const approvePromises = pendingItemsForBulk.map((item) =>
        fetch(`/api/submissions/kakaomap/${submissionId}/content/${item.id}/review`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review_status: 'approved' }),
        })
      );

      const results = await Promise.all(approvePromises);
      const failedCount = results.filter((res) => !res.ok).length;
      const successCount = results.length - failedCount;

      if (failedCount > 0) {
        toast({
          variant: 'destructive',
          title: '일괄 승인 완료',
          description: `${successCount}건 승인, ${failedCount}건 실패`,
        });
      } else {
        toast({
          title: '일괄 승인 완료',
          description: `모든 콘텐츠 ${successCount}건이 승인되었습니다.`,
        });
      }

      await refreshContentItems();
    } catch (error) {
      console.error('Bulk approve error:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '일괄 승인 중 오류가 발생했습니다.',
      });
    } finally {
      setProcessingReview(false);
      setPendingItemsForBulk([]);
    }
  };

  // 피드백 히스토리
  const handleOpenFeedbackHistory = async (item: ContentItem) => {
    if (!submissionId) return;

    setSelectedContentItem(item);
    setFeedbackDialogOpen(true);
    setLoadingFeedback(true);

    try {
      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/content/${item.id}/feedback`
      );

      if (!response.ok) {
        throw new Error('피드백을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setFeedbackHistory(data.feedbacks || []);
    } catch (error) {
      console.error('Load feedback error:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '피드백을 불러오는데 실패했습니다.',
      });
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleSendFeedback = async (message: string) => {
    if (!submissionId || !selectedContentItem) return;

    try {
      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/content/${selectedContentItem.id}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '피드백 전송에 실패했습니다.');
      }

      const data = await response.json();
      setFeedbackHistory([...feedbackHistory, data.feedback]);
      toast({
        title: '피드백 전송',
        description: '피드백이 성공적으로 전송되었습니다.',
      });
    } catch (error) {
      console.error('Send feedback error:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '피드백 전송에 실패했습니다.',
      });
    }
  };

  // 공통 피드백 전송
  const handleSendGeneralFeedback = async (message: string) => {
    if (!submissionId) return;

    try {
      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '공통 피드백 전송에 실패했습니다.');
      }

      const data = await response.json();
      setGeneralFeedbacks([...generalFeedbacks, data.feedback]);
      toast({
        title: '✓ 공통 피드백 전송',
        description: '공통 피드백이 성공적으로 전송되었습니다.',
      });
    } catch (error) {
      console.error('Send general feedback error:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '공통 피드백 전송에 실패했습니다.',
      });
    }
  };

  // 통계 계산
  const pendingCount = contentItems.filter((item) => item.review_status === 'pending').length;
  const approvedCount = contentItems.filter((item) => item.review_status === 'approved').length;
  const revisedCount = contentItems.filter((item) => item.review_status === 'approved' && item.has_been_revised).length;
  const revisionRequestedCount = contentItems.filter((item) => item.review_status === 'revision_requested').length;

  // 필터링된 콘텐츠
  const filteredContentItems = contentFilter === 'all'
    ? contentItems
    : contentFilter === 'revised'
    ? contentItems.filter((item) => item.review_status === 'approved' && item.has_been_revised)
    : contentItems.filter((item) => item.review_status === contentFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        <div className="space-y-6">
          {/* 헤더 */}
          <ReviewHeader
            submission={submission}
            contentCount={contentItems.length}
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            onBack={() => router.push('/dashboard/review/kmap/status')}
            onBulkApprove={handleBulkApprove}
            isProcessing={processingReview}
          />

          {/* 공통 피드백 섹션 */}
          <GeneralFeedbackSection
            feedbacks={generalFeedbacks}
            onSendFeedback={handleSendGeneralFeedback}
          />

          {/* 콘텐츠 필터 */}
          {contentItems.length > 0 && (
            <ContentFilterTabs
              filter={contentFilter}
              onFilterChange={setContentFilter}
              counts={{
                total: contentItems.length,
                pending: pendingCount,
                revisionRequested: revisionRequestedCount,
                approved: approvedCount,
                revised: revisedCount,
              }}
            />
          )}

          {/* 콘텐츠 그리드 */}
          {contentItems.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center text-gray-500 shadow-sm">
              아직 업로드된 콘텐츠가 없습니다.
            </div>
          ) : (
            <ContentGrid
              items={filteredContentItems}
              onApprove={handleApproveItem}
              onRequestRevision={handleRequestItemRevision}
              onOpenFeedback={handleOpenFeedbackHistory}
              isProcessing={processingReview}
            />
          )}
        </div>
      </div>

      {/* 다이얼로그들 */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        contentItem={selectedContentItem}
        submission={submission}
        feedbackHistory={feedbackHistory}
        loading={loadingFeedback}
        onSendFeedback={handleSendFeedback}
      />

      <RevisionDialog
        open={revisionDialogOpen}
        onOpenChange={setRevisionDialogOpen}
        contentItem={itemForRevision}
        onSubmit={handleSubmitRevision}
        isProcessing={processingReview}
      />

      <BulkApproveDialog
        open={bulkApproveDialogOpen}
        onOpenChange={setBulkApproveDialogOpen}
        count={pendingItemsForBulk.length}
        onConfirm={executeBulkApprove}
        isProcessing={processingReview}
      />
    </div>
  );
}
