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
import { ArrowLeft, Loader2, ExternalLink, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { CafeContentBasedCalendar } from '@/components/admin/cafe-marketing/CafeContentBasedCalendar';
import { useCafeMarketingDetail } from '@/hooks/admin/useCafeMarketingDetail';
import {
  contentStatusConfig,
  statusConfig,
  contentTypeConfig,
  scriptStatusConfig,
} from '@/components/admin/cafe-marketing-detail';

export default function CafeMarketingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const {
    loading,
    submission,
    contentItems,
    activeTab,
    uploading,
    totalCompletedCount,
    completionRate,
    setActiveTab,
    handleFileUpload,
    handleDownloadExcel,
    handleDownloadTemplate,
    handleStatusChange,
  } = useCafeMarketingDetail(unwrappedParams.id);

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
              <p className="text-sm text-muted-foreground">
                {submission.service_type === 'community' ? '커뮤니티' : '카페 침투'} 마케팅 상세 정보
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={submission.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">확인중</SelectItem>
                <SelectItem value="approved">접수완료</SelectItem>
                <SelectItem value="script_writing">원고작성중</SelectItem>
                <SelectItem value="script_completed">원고완료</SelectItem>
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
              <CardDescription>총 발행 건수</CardDescription>
              <CardTitle className="text-3xl">{submission.total_count}건</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {submission.cafe_details?.length || 0}개 카페
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>실제 발행</CardDescription>
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
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="content">콘텐츠 관리</TabsTrigger>
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
                  <p className="text-sm text-muted-foreground">지역</p>
                  <p className="font-medium">{submission.region}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">컨텐츠 유형</p>
                  <p className="font-medium">
                    {contentTypeConfig[submission.content_type] || submission.content_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">사진 포함</p>
                  <p className="font-medium">{submission.has_photo ? '예' : '아니오'}</p>
                </div>
                {submission.place_url && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">플레이스 URL</p>
                    <a
                      href={submission.place_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate flex items-center gap-1"
                    >
                      {submission.place_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">카페 상세 정보</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {submission.cafe_details?.map((cafe, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{cafe.name}</span>
                        <Badge variant="outline">{cafe.count}건</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">원고 상태</p>
                  <p className="font-medium">
                    {scriptStatusConfig[submission.script_status]?.label || submission.script_status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">접수일</p>
                  <p className="font-medium">
                    {new Date(submission.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                {submission.script_url && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">원고 링크</p>
                    <a
                      href={submission.script_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      구글 시트로 보기
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {submission.guideline && (
              <Card>
                <CardHeader>
                  <CardTitle>가이드라인</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{submission.guideline}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 콘텐츠 관리 탭 */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>콘텐츠 목록</CardTitle>
                    <CardDescription>
                      업로드된 콘텐츠 {contentItems.length}건 / 총 {submission.total_count}건
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      템플릿
                    </Button>
                    {contentItems.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
                        <Download className="h-4 w-4 mr-2" />
                        다운로드
                      </Button>
                    )}
                    <Button size="sm" disabled={uploading} asChild>
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? '업로드 중...' : '엑셀 업로드'}
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contentItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>작성제목</TableHead>
                          <TableHead className="w-28">발행일</TableHead>
                          <TableHead className="w-24">상태</TableHead>
                          <TableHead>리뷰링크</TableHead>
                          <TableHead className="w-28">작성아이디</TableHead>
                          <TableHead className="w-28">카페명</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contentItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {item.post_title || '-'}
                            </TableCell>
                            <TableCell>
                              {item.published_date || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={contentStatusConfig[item.status || 'pending']?.variant || 'outline'}>
                                {contentStatusConfig[item.status || 'pending']?.label || item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {item.post_url ? (
                                <a
                                  href={item.post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  링크
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{item.writer_id || '-'}</TableCell>
                            <TableCell>{item.cafe_name || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>업로드된 콘텐츠가 없습니다.</p>
                    <p className="text-sm mt-1">엑셀 파일을 업로드하면 콘텐츠 목록이 표시됩니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 일별 기록 탭 - 콘텐츠 기반 캘린더 */}
          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>일별 발행 기록</CardTitle>
                <CardDescription>
                  업로드된 콘텐츠의 발행일 기준으로 집계됩니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CafeContentBasedCalendar
                  contentItems={contentItems.map(item => ({
                    id: item.id,
                    published_date: item.published_date,
                    post_title: item.post_title,
                  }))}
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
