'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ContentItem, Feedback, KmapSubmission } from '@/types/review/kmap-content';
import { CompactHeader } from '@/components/dashboard/review/kmap/CompactHeader';
import { ContentGrid } from '@/components/dashboard/review/kmap/ContentGrid';
import { BulkApproveDialog } from '@/components/dashboard/review/kmap/BulkApproveDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

// 콘텐츠 아이템 타입 확장 (엑셀 업로드 데이터용)
interface ContentItemExtended {
  id: string;
  upload_order: number;
  script_text: string | null;
  review_registered_date: string | null;
  receipt_date: string | null;
  status: string;
  review_link: string | null;
  review_id: string | null;
  created_at: string;
}

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

  // 일괄 승인 상태
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);
  const [pendingItemsForBulk, setPendingItemsForBulk] = useState<ContentItem[]>([]);

  // 공통 피드백 상태
  const [generalFeedbacks, setGeneralFeedbacks] = useState<Feedback[]>([]);

  // 확장된 콘텐츠 아이템 (엑셀 업로드 데이터용)
  const [extendedContentItems, setExtendedContentItems] = useState<ContentItemExtended[]>([]);

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

      // Fetch content items - 검수하기 탭용 (관리자 업로드 원고 포함)
      const reviewContentRes = await fetch(`/api/submissions/kakaomap/${id}/content?type=review`);
      if (!reviewContentRes.ok) throw new Error('Failed to fetch review content');
      const reviewContentData = await reviewContentRes.json();
      setContentItems(reviewContentData.items || []);

      // Fetch content items - 콘텐츠 목록 탭용 (리포트 데이터만)
      const reportContentRes = await fetch(`/api/submissions/kakaomap/${id}/content?type=report`);
      if (!reportContentRes.ok) throw new Error('Failed to fetch report content');
      const reportContentData = await reportContentRes.json();
      setExtendedContentItems(reportContentData.items || []);

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
      // 검수하기 탭용 콘텐츠 새로고침 (관리자 업로드 원고 포함)
      const response = await fetch(`/api/submissions/kakaomap/${submissionId}/content?type=review`);
      if (!response.ok) throw new Error('Failed to refresh content');

      const data = await response.json();
      setContentItems(data.items || []);
    } catch (error) {
      console.error('Refresh content error:', error);
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

  // 진행률 계산 (리포트에 등록된 콘텐츠만 = review_registered_date가 있는 것)
  const completedItems = extendedContentItems.filter(item => item.review_registered_date != null);
  const progressPercentage = submission?.total_count
    ? Math.min(Math.round((completedItems.length / submission.total_count) * 100), 100)
    : 0;

  // 엑셀 다운로드 (업로드 템플릿과 동일한 형식)
  const handleExcelDownload = () => {
    if (extendedContentItems.length === 0) {
      toast({
        title: '알림',
        description: '다운로드할 데이터가 없습니다.',
      });
      return;
    }

    // 업로드 템플릿과 동일한 형식: 접수번호, 업체명, 리뷰원고, 리뷰등록날짜, 영수증날짜, 상태, 리뷰링크, 리뷰아이디
    const excelData = extendedContentItems.map((item) => ({
      '접수번호': submission?.submission_number || '',
      '업체명': submission?.company_name || '',
      '리뷰원고': item.script_text || '',
      '리뷰등록날짜': item.review_registered_date || '',
      '영수증날짜': item.receipt_date || '',
      '상태': item.status === 'approved' ? '승인됨' : item.status === 'rejected' ? '수정요청' : '대기',
      '리뷰링크': item.review_link || '',
      '리뷰아이디': item.review_id || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    // 시트명을 업로드 템플릿과 동일하게 'K맵리뷰'로 설정
    XLSX.utils.book_append_sheet(wb, ws, 'K맵리뷰');

    // 컬럼 너비 설정 (업로드 템플릿과 동일)
    ws['!cols'] = [
      { wch: 18 },  // 접수번호
      { wch: 20 },  // 업체명
      { wch: 60 },  // 리뷰원고
      { wch: 14 },  // 리뷰등록날짜
      { wch: 14 },  // 영수증날짜
      { wch: 10 },  // 상태
      { wch: 45 },  // 리뷰링크
      { wch: 18 },  // 리뷰아이디
    ];

    XLSX.writeFile(wb, `K맵리뷰_${submission?.company_name || 'report'}_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast({
      title: '다운로드 완료',
      description: '엑셀 파일이 다운로드되었습니다.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl">
        <div className="space-y-4">
          {/* 컴팩트 헤더 */}
          <CompactHeader
            submission={submission}
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            onBack={() => router.push('/dashboard/submissions?category=review&product=kakaomap')}
          />

          {/* 진행 현황 (항상 표시) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">총 접수</p>
              <p className="text-xl font-bold">{submission?.total_count || 0}건</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">리포트 등록</p>
              <p className="text-xl font-bold text-amber-600">{completedItems.length}건</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">진행률</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-amber-500 transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
            </Card>
            <Button onClick={handleExcelDownload} variant="outline" className="h-auto py-3">
              <Download className="h-4 w-4 mr-2" />
              리포트 다운로드
            </Button>
          </div>

          {/* 콘텐츠 그리드 (필터 + 피드백 + 테이블) */}
          <ContentGrid
            items={contentItems}
            feedbacks={generalFeedbacks}
            onSendFeedback={handleSendGeneralFeedback}
            onBulkApprove={handleBulkApprove}
            isProcessing={processingReview}
          />
        </div>
      </div>

      {/* 일괄 승인 다이얼로그 */}
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
