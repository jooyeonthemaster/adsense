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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Loader2, FileSpreadsheet, ExternalLink, Trash2 } from 'lucide-react';
import { ContentBasedCalendar } from '@/components/admin/blog-distribution/ContentBasedCalendar';
import { useBlogDistributionDetail } from '@/hooks/admin/useBlogDistributionDetail';
import {
  contentStatusConfig,
  statusConfig,
  distributionTypeConfig,
  contentTypeConfig,
} from '@/components/admin/blog-distribution-detail';

export default function BlogDistributionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const {
    loading,
    submission,
    contentItems,
    activeTab,
    totalCompletedCount,
    completionRate,
    fileInputRef,
    setActiveTab,
    handleStatusChange,
    handleFileUpload,
    downloadContentItemsAsExcel,
    handleDeleteAllContent,
  } = useBlogDistributionDetail(unwrappedParams.id);

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
        <p className="text-center text-muted-foreground">접수 정보를 찾을 수 없습니다.</p>
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
              <p className="text-sm text-muted-foreground">블로그 배포 상세 정보</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={submission.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">확인중</SelectItem>
                <SelectItem value="in_progress">구동중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">중단</SelectItem>
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
                일 {submission.daily_count}건
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>실제 유입</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{totalCompletedCount}건</CardTitle>
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
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="contents">콘텐츠 목록</TabsTrigger>
            <TabsTrigger value="daily">일별 기록</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>접수 정보</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">업체명</p>
                  <p className="font-medium">{submission.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">배포 유형</p>
                  <p className="font-medium">
                    {distributionTypeConfig[submission.distribution_type] || submission.distribution_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">컨텐츠 유형</p>
                  <p className="font-medium">
                    {contentTypeConfig[submission.content_type] || submission.content_type}
                  </p>
                </div>
                {submission.place_url && (
                  <div>
                    <p className="text-sm text-muted-foreground">장소 URL</p>
                    <a
                      href={submission.place_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate block"
                    >
                      {submission.place_url}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">일 접수량</p>
                  <p className="font-medium">{submission.daily_count}건</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 수량</p>
                  <p className="font-medium">{submission.total_count}건</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 구동일</p>
                  <p className="font-medium">{submission.total_days}일</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">접수일</p>
                  <p className="font-medium">
                    {new Date(submission.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                {submission.keywords && submission.keywords.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">키워드</p>
                    <div className="flex flex-wrap gap-2">
                      {submission.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {submission.account_id && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">계정 ID</p>
                      <p className="font-medium">{submission.account_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">충전 건수</p>
                      <p className="font-medium">{submission.charge_count}건</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {submission.guide_text && (
              <Card>
                <CardHeader>
                  <CardTitle>작성 가이드 텍스트</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{submission.guide_text}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>블로그 콘텐츠 목록</CardTitle>
                    <CardDescription>
                      엑셀로 업로드된 블로그 콘텐츠 ({contentItems.length}건)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 엑셀 업로드 버튼 숨김 처리 - 데이터 관리 페이지에서 일괄 업로드 사용 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {contentItems.length > 0 && (
                      <>
                        <Button onClick={downloadContentItemsAsExcel}>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          엑셀 다운로드
                        </Button>
                        <Button variant="destructive" size="icon" onClick={handleDeleteAllContent}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
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
                            <TableHead className="min-w-[200px]">작성 제목</TableHead>
                            <TableHead className="w-28">발행일</TableHead>
                            <TableHead className="w-24">상태</TableHead>
                            <TableHead className="min-w-[250px]">블로그 링크</TableHead>
                            <TableHead className="w-32">블로그 아이디</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contentItems.map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-center text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <p className="text-sm line-clamp-2" title={item.blog_title || ''}>
                                  {item.blog_title || '-'}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.published_date || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={contentStatusConfig[item.status || 'pending']?.variant || 'outline'}>
                                  {contentStatusConfig[item.status || 'pending']?.label || '대기'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.blog_url ? (
                                  <a
                                    href={item.blog_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <span className="truncate max-w-[230px]">{item.blog_url}</span>
                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.blog_id || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>업로드된 콘텐츠가 없습니다.</p>
                    <p className="text-sm mt-1">엑셀 파일을 업로드하여 콘텐츠를 추가하세요.</p>
                    <p className="text-xs mt-2 text-muted-foreground">
                      컬럼: 작성제목, 발행일, 상태, 블로그링크, 블로그아이디
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>일별 배포 기록</CardTitle>
                <CardDescription>
                  업로드된 콘텐츠의 발행일 기준으로 일별 건수를 표시합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentBasedCalendar
                  contentItems={contentItems}
                  totalCount={submission.total_count}
                  startDateStr={submission.start_date}
                  endDateStr={submission.end_date}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
