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
import { ArrowLeft, Download, Package, Image as ImageIcon, Loader2, Send, Sparkles, FileSpreadsheet, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReviewContentBasedCalendar } from '@/components/admin/review-marketing/ReviewContentBasedCalendar';
import { DirectUpload } from '@/components/admin/kakaomap/DirectUpload';
import { ExcelUpload } from '@/components/admin/kakaomap/ExcelUpload';
import { ContentItemsList } from '@/components/admin/kakaomap/ContentItemsList';
import { FeedbackManagement } from '@/components/admin/kakaomap/FeedbackManagement';
import { GeneralFeedbackView } from '@/components/admin/kakaomap/GeneralFeedbackView';
import { AIReviewGenerator } from '@/components/admin/kakaomap/AIReviewGenerator';
import { useKakaomapDetail } from '@/hooks/admin/useKakaomapDetail';
import { statusConfig, starRatingConfig, contentStatusConfig } from '@/components/admin/kakaomap-detail';

export default function KakaomapReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const {
    loading,
    downloadLoading,
    submission,
    dailyRecords,
    contentItems,
    activeTab,
    totalActualCount,
    completionRate,
    setActiveTab,
    fetchSubmissionDetail,
    fetchDailyRecords,
    fetchContentItems,
    handleStatusChange,
    downloadAllFiles,
    handlePublish,
    downloadContentItemsAsExcel,
  } = useKakaomapDetail(unwrappedParams.id);

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-4xl grid-cols-6">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="ai-generate" className="gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              AI 생성
            </TabsTrigger>
            <TabsTrigger value="content">콘텐츠 관리</TabsTrigger>
            <TabsTrigger value="contents-list">콘텐츠 목록</TabsTrigger>
            <TabsTrigger value="feedback">피드백 관리</TabsTrigger>
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
            {/* 배포 버튼 */}
            {contentItems.length > 0 && (() => {
              const publishedCount = contentItems.filter(item => item.is_published).length;
              const unpublishedCount = contentItems.length - publishedCount;
              const allPublished = unpublishedCount === 0;

              return (
                <Card>
                  <CardHeader>
                    <CardTitle>콘텐츠 배포</CardTitle>
                    <CardDescription>
                      업로드된 콘텐츠를 유저에게 배포합니다. 배포 후에는 유저가 콘텐츠를 확인할 수 있습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 배포 상태 표시 */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">전체 콘텐츠:</span>
                        <span className="font-bold">{contentItems.length}개</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-green-600">배포 완료:</span>
                        <span className="font-bold text-green-600">{publishedCount}개</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-orange-600">미배포:</span>
                        <span className="font-bold text-orange-600">{unpublishedCount}개</span>
                      </div>
                    </div>

                    {/* 배포 버튼 */}
                    {allPublished ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-green-700 font-medium">✓ 모든 콘텐츠가 배포되었습니다</p>
                        <p className="text-sm text-green-600 mt-1">유저가 모든 콘텐츠를 확인할 수 있습니다</p>
                      </div>
                    ) : (
                      <Button onClick={handlePublish} className="w-full" size="lg">
                        <Send className="h-5 w-5 mr-2" />
                        배포하기 ({unpublishedCount}개 콘텐츠)
                      </Button>
                    )}
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

            {/* 업로드 UI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 직접 업로드 */}
              <DirectUpload
                submissionId={unwrappedParams.id}
                currentCount={contentItems.length}
                totalCount={submission.total_count}
                hasPhoto={submission.has_photo}
                photoRatio={submission.photo_ratio}
                onUploadComplete={fetchContentItems}
              />

              {/* 엑셀 업로드 */}
              <ExcelUpload
                submissionId={unwrappedParams.id}
                currentCount={contentItems.length}
                totalCount={submission.total_count}
                hasPhoto={submission.has_photo}
                photoRatio={submission.photo_ratio}
                onUploadComplete={fetchContentItems}
              />
            </div>
          </TabsContent>

          <TabsContent value="contents-list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>리뷰 콘텐츠 목록</CardTitle>
                    <CardDescription>
                      업로드된 리뷰 콘텐츠 ({contentItems.length}건)
                    </CardDescription>
                  </div>
                  {contentItems.length > 0 && (
                    <Button onClick={downloadContentItemsAsExcel}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      엑셀 다운로드
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {contentItems.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[500px] overflow-auto">
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
                          {contentItems.map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-center text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <p className="text-sm line-clamp-2" title={item.script_text || ''}>
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
                                <Badge
                                  variant={contentStatusConfig[item.status]?.variant || 'outline'}
                                  className="whitespace-nowrap"
                                >
                                  {contentStatusConfig[item.status]?.label || item.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.review_link ? (
                                  <a
                                    href={item.review_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    링크
                                  </a>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
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
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    업로드된 콘텐츠가 없습니다.<br />
                    <span className="text-xs">콘텐츠 관리 탭에서 콘텐츠를 업로드하세요.</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <GeneralFeedbackView submissionId={unwrappedParams.id} />
            <FeedbackManagement submissionId={unwrappedParams.id} />
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
