'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  XCircle,
  MessageCircleMore,
  Send,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';

interface ContentItem {
  id: string;
  upload_order: number;
  image_url?: string;
  script_text?: string;
  review_status: 'pending' | 'approved' | 'revision_requested';
  has_been_revised: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  company_name: string;
  kakaomap_url: string;
  total_count: number;
}

export default function KakaomapContentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [submissionId, setSubmissionId] = useState<string>('');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingReview, setProcessingReview] = useState(false);

  // 피드백 다이얼로그 상태
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState('');

  // 수정 요청 다이얼로그 상태
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [itemForRevision, setItemForRevision] = useState<ContentItem | null>(null);

  // 일괄 승인 확인 다이얼로그 상태
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);
  const [pendingItemsForBulk, setPendingItemsForBulk] = useState<ContentItem[]>([]);

  // 공통 피드백 상태
  const [generalFeedbacks, setGeneralFeedbacks] = useState<any[]>([]);
  const [newGeneralFeedback, setNewGeneralFeedback] = useState('');
  const [sendingGeneralFeedback, setSendingGeneralFeedback] = useState(false);

  // 콘텐츠 필터 상태
  const [contentFilter, setContentFilter] = useState<'all' | 'pending' | 'revision_requested' | 'approved' | 'revised'>('all');

  useEffect(() => {
    params.then((p) => {
      setSubmissionId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      // Fetch submission details
      const submissionRes = await fetch(`/api/submissions/kakaomap/${id}`);
      if (!submissionRes.ok) throw new Error('Failed to fetch submission');
      const submissionData = await submissionRes.json();
      setSubmission(submissionData.submission || submissionData);

      // Fetch content items
      console.log('[DEBUG] Fetching content items from API...');
      const contentRes = await fetch(`/api/submissions/kakaomap/${id}/content`);
      if (!contentRes.ok) throw new Error('Failed to fetch content');
      const contentData = await contentRes.json();
      console.log('[DEBUG] Content API response:', contentData);
      console.log('[DEBUG] Content items received:', contentData.items);
      console.log('[DEBUG] First item ID:', contentData.items?.[0]?.id);
      setContentItems(contentData.items || []);
      console.log('[DEBUG] Content items set to state');

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

  // 개별 수정 요청 - 다이얼로그 열기
  const handleRequestItemRevision = (item: ContentItem) => {
    setItemForRevision(item);
    setRevisionMessage('');
    setRevisionDialogOpen(true);
  };

  // 수정 요청 제출
  const handleSubmitRevision = async () => {
    if (!submissionId || !itemForRevision || !revisionMessage.trim()) return;

    setProcessingReview(true);

    try {
      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/content/${itemForRevision.id}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            review_status: 'revision_requested',
            feedback_message: revisionMessage.trim(),
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
      setRevisionMessage('');
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

  // 일괄 검수 승인 - 확인 다이얼로그 열기
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

  // 일괄 검수 승인 실행
  const executeBulkApprove = async () => {
    setBulkApproveDialogOpen(false);
    setProcessingReview(true);

    try {
      // 모든 pending 아이템을 병렬로 승인
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

  // 피드백 히스토리 열기
  const handleOpenFeedbackHistory = async (item: ContentItem) => {
    if (!submissionId) return;

    setSelectedContentItem(item);
    setFeedbackDialogOpen(true);
    setLoadingFeedback(true);
    setNewFeedback('');

    try {
      console.log('[DEBUG] Loading feedback history for:', {
        submissionId,
        contentItemId: item.id,
      });

      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/content/${item.id}/feedback`
      );

      console.log('[DEBUG] Feedback history response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DEBUG] Failed to load feedback:', errorData);
        throw new Error('피드백을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      console.log('[DEBUG] Feedback history loaded:', data);
      console.log('[DEBUG] Feedbacks array:', data.feedbacks);
      console.log('[DEBUG] Feedbacks count:', data.feedbacks?.length || 0);

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

  // 피드백 전송
  const handleSendFeedback = async () => {
    if (!newFeedback.trim() || !submissionId || !selectedContentItem) return;

    try {
      console.log('[DEBUG] Sending feedback:', {
        submissionId,
        contentItemId: selectedContentItem.id,
        message: newFeedback.trim(),
      });

      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/content/${selectedContentItem.id}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newFeedback.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error('[DEBUG] Feedback send failed:', data);
        throw new Error(data.error || '피드백 전송에 실패했습니다.');
      }

      const data = await response.json();
      console.log('[DEBUG] Feedback sent successfully:', data);
      console.log('[DEBUG] Current feedbackHistory:', feedbackHistory);
      console.log('[DEBUG] New feedback object:', data.feedback);

      setFeedbackHistory([...feedbackHistory, data.feedback]);
      setNewFeedback('');
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
  const handleSendGeneralFeedback = async () => {
    if (!newGeneralFeedback.trim() || !submissionId) return;

    setSendingGeneralFeedback(true);
    try {
      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newGeneralFeedback.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '공통 피드백 전송에 실패했습니다.');
      }

      const data = await response.json();
      setGeneralFeedbacks([...generalFeedbacks, data.feedback]);
      setNewGeneralFeedback('');
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
    } finally {
      setSendingGeneralFeedback(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReviewStatusBadge = (item: ContentItem) => {
    if (item.review_status === 'approved') {
      if (item.has_been_revised) {
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✓ 수정완료</Badge>
        );
      } else {
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">✓ 승인완료</Badge>
        );
      }
    } else if (item.review_status === 'revision_requested') {
      return <Badge variant="destructive">수정요청</Badge>;
    } else {
      return <Badge variant="outline">검수대기</Badge>;
    }
  };

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
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/review/kmap/status')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">콘텐츠 검수</h1>
                <p className="text-gray-600">
                  {submission?.company_name} - 총 {contentItems.length}개 콘텐츠
                </p>
              </div>
              <div className="flex gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">검수대기</p>
                  <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">승인완료</p>
                  <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
              </div>
            </div>

            {/* 일괄 승인 버튼 */}
            {pendingCount > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleBulkApprove}
                  disabled={processingReview}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  전체 일괄 승인 ({pendingCount}건)
                </Button>
              </div>
            )}
          </div>

          {/* 공통 피드백 섹션 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircleMore className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">전체 공통 피드백</h2>
              <Badge variant="outline" className="ml-auto">
                {generalFeedbacks.length}개
              </Badge>
            </div>

            {/* 피드백 히스토리 */}
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
              {generalFeedbacks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircleMore className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">아직 공통 피드백이 없습니다</p>
                </div>
              ) : (
                generalFeedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className={`p-3 rounded-lg ${
                      feedback.sender_type === 'admin'
                        ? 'bg-blue-50 ml-8'
                        : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <div className={`mb-1 ${
                      feedback.sender_type === 'admin' ? 'text-right' : 'text-left'
                    }`}>
                      <span className="text-sm font-medium">
                        {feedback.sender_name}
                      </span>
                    </div>
                    <p className={`text-sm whitespace-pre-wrap mb-1 ${
                      feedback.sender_type === 'admin' ? 'text-right' : 'text-left'
                    }`}>
                      {feedback.message}
                    </p>
                    <div className={`${
                      feedback.sender_type === 'admin' ? 'text-right' : 'text-left'
                    }`}>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(feedback.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 새 피드백 입력 */}
            <div className="space-y-2 pt-4 border-t">
              <Textarea
                placeholder="전체 콘텐츠에 대한 공통 의견이나 요청사항을 입력하세요..."
                value={newGeneralFeedback}
                onChange={(e) => setNewGeneralFeedback(e.target.value)}
                className="min-h-[80px]"
                disabled={sendingGeneralFeedback}
              />
              <Button
                onClick={handleSendGeneralFeedback}
                disabled={!newGeneralFeedback.trim() || sendingGeneralFeedback}
                className="w-full"
              >
                {sendingGeneralFeedback ? (
                  <>전송 중...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    공통 피드백 보내기
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 콘텐츠 필터 */}
          {contentItems.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Tabs value={contentFilter} onValueChange={(value) => setContentFilter(value as any)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">
                    전체 ({contentItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    검수대기 ({pendingCount})
                  </TabsTrigger>
                  <TabsTrigger value="revision_requested">
                    수정요청 ({revisionRequestedCount})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    승인완료 ({approvedCount})
                  </TabsTrigger>
                  <TabsTrigger value="revised">
                    수정완료 ({revisedCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* 콘텐츠 그리드 */}
          {contentItems.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center text-gray-500 shadow-sm">
              아직 업로드된 콘텐츠가 없습니다.
            </div>
          ) : filteredContentItems.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center text-gray-500 shadow-sm">
              해당 상태의 콘텐츠가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContentItems.map((item) => {
                console.log('[DEBUG] Rendering content item:', { id: item.id, upload_order: item.upload_order });
                return (
                  <div
                    key={item.id}
                    className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                  <div className="p-4 space-y-3">
                    {/* 상단: 순번 + 검수 상태 */}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">#{item.upload_order}</Badge>
                      {getReviewStatusBadge(item)}
                    </div>

                    {/* 이미지 */}
                    {item.image_url ? (
                      <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={`Content ${item.upload_order}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">이미지 없음</p>
                        </div>
                      </div>
                    )}

                    {/* 원고 */}
                    {item.script_text && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">리뷰 원고</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                          {item.script_text}
                        </p>
                      </div>
                    )}

                    {/* 날짜 */}
                    <div className="text-xs text-gray-500 text-center pt-2 border-t">
                      {new Date(item.created_at).toLocaleDateString('ko-KR')}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="space-y-2 pt-2">
                      {item.review_status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => handleApproveItem(item)}
                            disabled={processingReview}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            검수완료
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleRequestItemRevision(item)}
                            disabled={processingReview}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            수정요청
                          </Button>
                        </div>
                      )}

                      {/* 피드백 히스토리 버튼 (항상 표시) */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOpenFeedbackHistory(item)}
                      >
                        <MessageCircleMore className="h-4 w-4 mr-1" />
                        피드백 히스토리
                      </Button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 피드백 히스토리 다이얼로그 */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>피드백 히스토리</DialogTitle>
            <DialogDescription>
              {selectedContentItem && (
                <>
                  콘텐츠 #{selectedContentItem.upload_order} - {submission?.company_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* 메시지 히스토리 영역 */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg min-h-[300px] max-h-[400px]">
            {loadingFeedback ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              </div>
            ) : feedbackHistory.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                아직 피드백이 없습니다. 첫 메시지를 보내보세요.
              </div>
            ) : (
              feedbackHistory.map((feedback) => (
                <div
                  key={feedback.id}
                  className={`flex ${feedback.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      feedback.sender_type === 'client'
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {feedback.sender_type === 'client' ? '나' : feedback.sender_name}
                      </span>
                      <span
                        className={`text-xs ${
                          feedback.sender_type === 'client' ? 'text-amber-100' : 'text-gray-400'
                        }`}
                      >
                        {formatDate(feedback.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 새 메시지 입력 영역 */}
          <div className="flex gap-2 pt-4">
            <Textarea
              placeholder="피드백 메시지를 입력하세요..."
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendFeedback();
                }
              }}
              className="flex-1 min-h-[60px] resize-none"
            />
            <Button
              onClick={handleSendFeedback}
              disabled={!newFeedback.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 요청 다이얼로그 */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              수정 요청
            </DialogTitle>
            <DialogDescription>
              {itemForRevision && (
                <>
                  콘텐츠 #{itemForRevision.upload_order}에 대한 수정 사항을 입력해주세요.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                수정 요청 사항 <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="수정이 필요한 부분을 구체적으로 작성해주세요.&#10;예: 이미지가 너무 어둡습니다. 더 밝게 조정해주세요."
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={processingReview}
              />
              <p className="text-xs text-gray-500 mt-1">
                {revisionMessage.length} / 500자
              </p>
            </div>

            {revisionMessage.trim() && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-1">수정 요청 안내</p>
                    <p>관리자가 수정 후 다시 업로드하면 재검수가 필요합니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRevisionDialogOpen(false);
                setRevisionMessage('');
                setItemForRevision(null);
              }}
              disabled={processingReview}
            >
              취소
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleSubmitRevision}
              disabled={!revisionMessage.trim() || processingReview}
            >
              {processingReview ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  수정 요청 보내기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일괄 승인 확인 다이얼로그 */}
      <AlertDialog open={bulkApproveDialogOpen} onOpenChange={setBulkApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-green-600" />
              일괄 승인 확인
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              {pendingItemsForBulk.length}개의 콘텐츠를 일괄 승인하시겠습니까?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                승인된 콘텐츠는 관리자가 최종 검토 후 게시됩니다.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingReview}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkApprove}
              disabled={processingReview}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingReview ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  처리 중...
                </>
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  일괄 승인
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
