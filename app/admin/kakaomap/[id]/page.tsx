'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Send, Sparkles } from 'lucide-react';
import { ReviewContentBasedCalendar } from '@/components/admin/review-marketing/ReviewContentBasedCalendar';
import { DirectUpload } from '@/components/admin/kakaomap/DirectUpload';
import { ExcelUpload } from '@/components/admin/kakaomap/ExcelUpload';
import { ContentItemsList } from '@/components/admin/kakaomap/ContentItemsList';
import { GeneralFeedbackView } from '@/components/admin/kakaomap/GeneralFeedbackView';
import { AIReviewGenerator } from '@/components/admin/kakaomap/AIReviewGenerator';
import { ApprovalStatusList } from '@/components/admin/kakaomap/ApprovalStatusList';
import { PendingReviewList } from '@/components/admin/kakaomap/PendingReviewList';
import { useKakaomapDetail } from '@/hooks/admin/useKakaomapDetail';
import { statusConfig, starRatingConfig } from '@/components/admin/kakaomap-detail';

export default function KakaomapReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const {
    loading,
    submission,
    dailyRecords,
    contentItems,
    activeTab,
    totalActualCount,
    completionRate,
    unreadFeedbackCount,
    setActiveTab,
    fetchSubmissionDetail,
    fetchContentItems,
    handleStatusChange,
    handlePublish,
    markFeedbacksAsRead,
  } = useKakaomapDetail(unwrappedParams.id);

  // 탭 변경 핸들러 - 피드백 관련 탭 선택 시 피드백 읽음 처리
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'approval-status' || value === 'pending-review') {
      markFeedbacksAsRead();
    }
  };

  // 검수 대기 원고 수 (검수 요청된 원고 중 대행사가 아직 처리 안한 것)
  const pendingReviewCount = contentItems.filter(item => item.is_published && item.review_status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">접수 내역을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{submission.company_name}</h1>
              <p className="text-sm text-muted-foreground">카카오맵 상세 관리</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={submission.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">접수 대기</SelectItem>
                <SelectItem value="waiting_content">콘텐츠 업로드 중</SelectItem>
                <SelectItem value="review">검수 대기</SelectItem>
                <SelectItem value="revision_requested">수정 요청됨</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소됨</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant={statusConfig[submission.status]?.variant || 'outline'}>
              {statusConfig[submission.status]?.label || submission.status}
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>거래처</CardDescription>
              <CardTitle className="text-lg">{submission.clients?.company_name || '-'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {submission.clients?.contact_person || '담당자 정보 없음'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>총 접수 수량</CardDescription>
              <CardTitle className="text-3xl">{submission.total_count}건</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {submission.daily_count}건/일
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>실제 유입</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{totalActualCount}건</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                진행률 {completionRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>사용 포인트</CardDescription>
              <CardTitle className="text-3xl">{submission.total_points.toLocaleString()}P</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                총 비용
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-5xl grid-cols-6">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="ai-generate" className="gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              AI 생성
            </TabsTrigger>
            <TabsTrigger value="content">원고 관리</TabsTrigger>
            <TabsTrigger value="pending-review" className="relative">
              검수 요청
              {(unreadFeedbackCount > 0 || pendingReviewCount > 0) && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                  {pendingReviewCount > 9 ? '9+' : pendingReviewCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approval-status">승인 현황</TabsTrigger>
            <TabsTrigger value="daily">일별 기록</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>접수 정보</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">상품명</p>
                  <p className="font-medium">{submission.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">카카오맵 URL</p>
                  <a
                    href={submission.kakaomap_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate block"
                  >
                    {submission.kakaomap_url}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">일 발행수량</p>
                  <p className="font-medium">{submission.daily_count}건</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 수량</p>
                  <p className="font-medium">{submission.total_count}건</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">사진 옵션</p>
                  <p className="font-medium">
                    {submission.has_photo ? `있음 (${submission.photo_ratio}%)` : '없음'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">별점</p>
                  <p className="font-medium">
                    {starRatingConfig[submission.star_rating]?.label || submission.star_rating}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">원고 타입</p>
                  <p className="font-medium">
                    {submission.script_type === 'provided' ? '원고 제공' : '자율 작성'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">접수일</p>
                  <p className="font-medium">
                    {new Date(submission.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {submission.guide_text && (
              <Card>
                <CardHeader>
                  <CardTitle>가이드 및 요청사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{submission.guide_text}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI 리뷰 생성 탭 */}
          <TabsContent value="ai-generate" className="space-y-6">
            <AIReviewGenerator
              submissionId={unwrappedParams.id}
              companyName={submission.company_name}
              currentCount={contentItems.length}
              totalCount={submission.total_count}
              onSaveComplete={() => {
                fetchContentItems();
                fetchSubmissionDetail();
              }}
            />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {/* 검수 요청 버튼 */}
            {contentItems.length > 0 && (() => {
              const publishedCount = contentItems.filter(item => item.is_published).length;
              const unpublishedCount = contentItems.length - publishedCount;
              const allPublished = unpublishedCount === 0;

              return (
                <Card>
                  <CardHeader>
                    <CardTitle>검수 요청</CardTitle>
                    <CardDescription>
                      업로드된 원고를 대행사에 검수 요청합니다. 요청 후 대행사가 원고를 검토하고 승인/수정요청할 수 있습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 검수 상태 표시 */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">전체 원고:</span>
                        <span className="font-bold">{contentItems.length}개</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-green-600">검수 요청됨:</span>
                        <span className="font-bold text-green-600">{publishedCount}개</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-orange-600">미요청:</span>
                        <span className="font-bold text-orange-600">{unpublishedCount}개</span>
                      </div>
                    </div>

                    {/* 검수 요청 버튼 */}
                    {allPublished ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-green-700 font-medium">✓ 모든 원고가 검수 요청되었습니다</p>
                        <p className="text-sm text-green-600 mt-1">대행사가 원고를 검토 중입니다</p>
                      </div>
                    ) : (
                      <Button onClick={handlePublish} className="w-full" size="lg">
                        <Send className="h-5 w-5 mr-2" />
                        검수 요청 ({unpublishedCount}개 원고)
                      </Button>
                    )}

                    {/* 엑셀 업로드 */}
                    <ExcelUpload
                      submissionId={unwrappedParams.id}
                      currentCount={contentItems.length}
                      totalCount={submission.total_count}
                      hasPhoto={submission.has_photo}
                      photoRatio={submission.photo_ratio}
                      onUploadComplete={fetchContentItems}
                    />
                  </CardContent>
                </Card>
              );
            })()}

            {/* 업로드된 콘텐츠 목록 */}
            <ContentItemsList
              submissionId={unwrappedParams.id}
              items={contentItems}
              totalCount={submission.total_count}
              onItemDeleted={fetchContentItems}
            />

            {/* 직접 업로드 */}
            <DirectUpload
              submissionId={unwrappedParams.id}
              currentCount={contentItems.length}
              totalCount={submission.total_count}
              hasPhoto={submission.has_photo}
              photoRatio={submission.photo_ratio}
              onUploadComplete={fetchContentItems}
            />
          </TabsContent>

          <TabsContent value="pending-review" className="space-y-4">
            <PendingReviewList
              submissionId={unwrappedParams.id}
              contentItems={contentItems}
              onUpdate={fetchContentItems}
            />
          </TabsContent>

          <TabsContent value="approval-status" className="space-y-4">
            <ApprovalStatusList
              submissionId={unwrappedParams.id}
              contentItems={contentItems}
            />
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>일별 배포 기록</CardTitle>
                <CardDescription>
                  업로드된 콘텐츠의 리뷰등록날짜 기준으로 집계됩니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewContentBasedCalendar
                  contentItems={contentItems}
                  totalCount={submission.total_count}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
