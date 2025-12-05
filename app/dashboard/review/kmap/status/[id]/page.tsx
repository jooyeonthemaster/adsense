'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ContentItem, Feedback, KmapSubmission, ContentFilter } from '@/types/review/kmap-content';
import { ReviewHeader } from '@/components/dashboard/review/kmap/ReviewHeader';
import { GeneralFeedbackSection } from '@/components/dashboard/review/kmap/GeneralFeedbackSection';
import { ContentFilterTabs } from '@/components/dashboard/review/kmap/ContentFilterTabs';
import { ContentGrid } from '@/components/dashboard/review/kmap/ContentGrid';
import { BulkApproveDialog } from '@/components/dashboard/review/kmap/BulkApproveDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink } from 'lucide-react';
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
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [activeTab, setActiveTab] = useState('content-list');

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

      // Fetch content items
      const contentRes = await fetch(`/api/submissions/kakaomap/${id}/content`);
      if (!contentRes.ok) throw new Error('Failed to fetch content');
      const contentData = await contentRes.json();
      setContentItems(contentData.items || []);
      // 확장된 콘텐츠 아이템 저장 (엑셀 다운로드용)
      setExtendedContentItems(contentData.items || []);

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
  const revisedCount = contentItems.filter((item) => item.review_status === 'approved' && item.has_been_revised).length;

  // 필터링된 콘텐츠
  const filteredContentItems = contentFilter === 'all'
    ? contentItems
    : contentFilter === 'revised'
    ? contentItems.filter((item) => item.review_status === 'approved' && item.has_been_revised)
    : contentItems.filter((item) => item.review_status === contentFilter);

  // 진행률 계산
  const progressPercentage = submission?.total_count
    ? Math.min(Math.round((extendedContentItems.length / submission.total_count) * 100), 100)
    : 0;

  // 상태 배지 표시
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">승인됨</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">반려</Badge>;
      default:
        return <Badge variant="outline">대기</Badge>;
    }
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    if (extendedContentItems.length === 0) {
      toast({
        title: '알림',
        description: '다운로드할 데이터가 없습니다.',
      });
      return;
    }

    const excelData = extendedContentItems.map((item, idx) => ({
      '순번': idx + 1,
      '리뷰원고': item.script_text || '',
      '리뷰등록날짜': item.review_registered_date || '',
      '영수증날짜': item.receipt_date || '',
      '상태': item.status === 'approved' ? '승인됨' : item.status === 'rejected' ? '반려' : '대기',
      '리뷰링크': item.review_link || '',
      '리뷰아이디': item.review_id || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '콘텐츠 목록');

    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 6 },   // 순번
      { wch: 50 },  // 리뷰원고
      { wch: 14 },  // 리뷰등록날짜
      { wch: 14 },  // 영수증날짜
      { wch: 10 },  // 상태
      { wch: 30 },  // 리뷰링크
      { wch: 15 },  // 리뷰아이디
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

          {/* 진행률 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>총 접수 수량</CardDescription>
                <CardTitle className="text-3xl">{submission?.total_count || 0}건</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>등록된 콘텐츠</CardDescription>
                <CardTitle className="text-3xl text-amber-600">{extendedContentItems.length}건</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">진행률 {progressPercentage}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>진행 상태</CardDescription>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-amber-500 transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-sm font-medium">{progressPercentage}% 완료</p>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* 탭 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="content-list">콘텐츠 목록</TabsTrigger>
              <TabsTrigger value="review">검수하기</TabsTrigger>
            </TabsList>

            {/* 콘텐츠 목록 탭 */}
            <TabsContent value="content-list" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>콘텐츠 목록</CardTitle>
                      <CardDescription>
                        등록된 리뷰 콘텐츠 {extendedContentItems.length}건
                      </CardDescription>
                    </div>
                    <Button onClick={handleExcelDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      엑셀 다운로드
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {extendedContentItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      아직 등록된 콘텐츠가 없습니다.
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center">순번</TableHead>
                            <TableHead className="min-w-[300px]">리뷰원고</TableHead>
                            <TableHead className="w-28">리뷰등록날짜</TableHead>
                            <TableHead className="w-28">영수증날짜</TableHead>
                            <TableHead className="w-24 text-center">상태</TableHead>
                            <TableHead className="w-32">리뷰링크</TableHead>
                            <TableHead className="w-28">리뷰아이디</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {extendedContentItems.map((item, idx) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                              <TableCell>
                                <p className="whitespace-pre-wrap line-clamp-3 text-sm">
                                  {item.script_text || '-'}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.review_registered_date || '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.receipt_date || '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {getStatusBadge(item.status)}
                              </TableCell>
                              <TableCell>
                                {item.review_link ? (
                                  <a
                                    href={item.review_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    보기
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.review_id || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 검수하기 탭 */}
            <TabsContent value="review" className="space-y-4">
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
                <ContentGrid items={filteredContentItems} />
              )}
            </TabsContent>
          </Tabs>
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
