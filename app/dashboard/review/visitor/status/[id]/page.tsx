'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Package, Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react';
import { DailyRecordCalendar } from '@/components/admin/review-marketing/DailyRecordCalendar';
import { useVisitorReviewDetail } from '@/hooks/dashboard/useVisitorReviewDetail';
import { statusConfig } from '@/components/dashboard/visitor-review-detail';

export default function ClientVisitorReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const {
    loading,
    downloadLoading,
    submission,
    dailyRecords,
    activeTab,
    contentItems,
    totalActualCount,
    completionRate,
    contentProgressPercentage,
    setActiveTab,
    downloadAllFiles,
    fetchDailyRecords,
    getStatusBadge,
    handleContentExcelDownload,
  } = useVisitorReviewDetail(unwrappedParams.id);

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
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/submissions?category=review&product=receipt')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{submission.company_name}</h1>
              <p className="text-sm text-muted-foreground">네이버 영수증 상세 정보</p>
            </div>
          </div>
          <Badge variant={statusConfig[submission.status]?.variant || 'outline'}>
            {statusConfig[submission.status]?.label || submission.status}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="content-list">콘텐츠 목록</TabsTrigger>
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="files">파일</TabsTrigger>
            <TabsTrigger value="daily">일별 기록</TabsTrigger>
          </TabsList>

          {/* 콘텐츠 목록 탭 */}
          <TabsContent value="content-list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>콘텐츠 목록</CardTitle>
                    <CardDescription>
                      등록된 리뷰 콘텐츠 {contentItems.length}건 / 총 {submission?.total_count || 0}건
                    </CardDescription>
                  </div>
                  <Button onClick={handleContentExcelDownload} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    엑셀 다운로드
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* 진행률 바 */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span>콘텐츠 등록 진행률</span>
                    <span className="font-medium">{contentProgressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${contentProgressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {contentItems.length}건 등록 / {submission?.total_count || 0}건 접수
                  </p>
                </div>

                {contentItems.length === 0 ? (
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
                        {contentItems.map((item, idx) => (
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
                              <Badge variant={getStatusBadge(item.review_status).variant}>
                                {getStatusBadge(item.review_status).label}
                              </Badge>
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
                  <p className="text-sm text-muted-foreground">플레이스 URL</p>
                  <a
                    href={submission.place_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate block"
                  >
                    {submission.place_url}
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
                  <p className="font-medium">{submission.has_photo ? '있음' : '없음'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">원고 옵션</p>
                  <p className="font-medium">{submission.has_script ? '있음' : '없음'}</p>
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

          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>업로드 파일</CardTitle>
                  {((submission.business_license_url) || (submission.photo_urls && submission.photo_urls.length > 0)) && (
                    <Button onClick={downloadAllFiles} disabled={downloadLoading}>
                      <Package className="h-4 w-4 mr-2" />
                      {downloadLoading ? '다운로드 중...' : '일괄 다운로드'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.business_license_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">사업자등록증</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(submission.business_license_url, '_blank')}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      보기
                    </Button>
                  </div>
                )}

                {submission.photo_urls && submission.photo_urls.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      업로드 사진 ({submission.photo_urls.length}장)
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {submission.photo_urls.map((url, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-24"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <div className="flex flex-col items-center">
                            <ImageIcon className="h-6 w-6 mb-1" />
                            <span className="text-xs">사진 {index + 1}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {!submission.business_license_url && (!submission.photo_urls || submission.photo_urls.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    업로드된 파일이 없습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>일별 유입 기록</CardTitle>
                <CardDescription>
                  실제 유입 건수를 일별로 확인할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DailyRecordCalendar
                  submissionId={unwrappedParams.id}
                  records={dailyRecords}
                  totalCount={submission.total_count}
                  dailyCount={submission.daily_count}
                  createdAt={submission.created_at}
                  onRecordSave={fetchDailyRecords}
                  apiEndpoint={`/api/submissions/receipt/${unwrappedParams.id}/daily-records`}
                  readOnly={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
