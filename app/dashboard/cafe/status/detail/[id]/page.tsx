'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Coffee, TrendingUp, Activity, ExternalLink, FileSpreadsheet, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CafeContentBasedCalendar } from '@/components/admin/cafe-marketing/CafeContentBasedCalendar';
import * as XLSX from 'xlsx';

interface CafeMarketingSubmission {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string | null;
  content_type: 'review' | 'info';
  region: string;
  cafe_details: Array<{ name: string; count: number }>;
  total_count: number;
  has_photo: boolean;
  guideline: string | null;
  photo_urls: string[] | null;
  script_status: 'pending' | 'writing' | 'completed';
  script_url: string | null;
  total_points: number;
  status: string;
  service_type?: 'cafe' | 'community';
  created_at: string;
  updated_at: string;
  completed_count?: number;
  progress_percentage?: number;
}

interface ContentItem {
  id: string;
  submission_id: string;
  upload_order: number;
  post_title: string | null;
  published_date: string | null;
  status: string | null;
  post_url: string | null;
  writer_id: string | null;
  cafe_name: string | null;
  notes: string | null;
  created_at: string;
}

interface DailyRecord {
  id: string;
  submission_id: string;
  record_date: string;
  completed_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  pending: '확인중',
  approved: '접수완료',
  script_writing: '원고작성중',
  script_completed: '원고작업완료',
  in_progress: '구동중',
  completed: '완료',
  cancelled: '중단',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  script_writing: 'bg-purple-100 text-purple-800',
  script_completed: 'bg-teal-100 text-teal-800',
  in_progress: 'bg-sky-100 text-sky-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const contentStatusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '대기', variant: 'outline' },
  approved: { label: '승인됨', variant: 'default' },
  revision_requested: { label: '수정요청', variant: 'destructive' },
};

const contentTypeLabels: Record<string, string> = {
  review: '후기성',
  info: '정보성',
};

export default function CafeMarketingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<CafeMarketingSubmission | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [unwrappedParams.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/submissions/cafe/${unwrappedParams.id}`);
      const data = await response.json();

      if (data.success) {
        setSubmission(data.submission);
        setContentItems(data.content_items || []);
        setDailyRecords(data.daily_records || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 콘텐츠 기반 진행률 계산
  const totalCompletedCount = contentItems.length;
  const completionRate = submission && submission.total_count > 0
    ? Math.round((totalCompletedCount / submission.total_count) * 100)
    : 0;

  // 엑셀 다운로드 핸들러
  const handleDownloadExcel = () => {
    if (!submission || contentItems.length === 0) return;

    const getStatusLabel = (status: string | null) => {
      if (!status) return '대기';
      return contentStatusConfig[status]?.label || status;
    };

    const excelData = contentItems.map((item, index) => ({
      '순번': index + 1,
      '작성제목': item.post_title || '',
      '발행일': item.published_date || '',
      '상태': getStatusLabel(item.status),
      '리뷰링크': item.post_url || '',
      '작성아이디': item.writer_id || '',
      '카페명': item.cafe_name || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 6 },   // 순번
      { wch: 40 },  // 작성제목
      { wch: 12 },  // 발행일
      { wch: 10 },  // 상태
      { wch: 50 },  // 리뷰링크
      { wch: 20 },  // 작성아이디
      { wch: 20 },  // 카페명
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '콘텐츠 목록');
    XLSX.writeFile(wb, `카페마케팅_${submission.company_name}_콘텐츠목록.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩중...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">접수 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 카페 침투 서비스 타입에 따른 product 파라미터 결정
  const getProductParam = () => {
    if (!submission) return 'infiltration-cafe';
    // service_type이 있으면 사용, 없으면 기본값
    return submission.service_type === 'community' ? 'infiltration-community' : 'infiltration-cafe';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/submissions?category=infiltration&product=${getProductParam()}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">카페 침투 마케팅 상세</h1>
        </div>
        <Badge className={statusColors[submission.status] || 'bg-gray-100 text-gray-800'}>
          {statusLabels[submission.status] || submission.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">총 발행 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-2xl font-bold">{submission.total_count}건</span>
              <Coffee className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">카페 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-2xl font-bold">{submission.cafe_details?.length || 0}개</span>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">완료 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-2xl font-bold">{totalCompletedCount}건</span>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-2xl font-bold">{completionRate}%</span>
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="content">콘텐츠 목록</TabsTrigger>
          <TabsTrigger value="daily">일별 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>접수 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">업체명</p>
                  <p className="font-medium">{submission.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">지역</p>
                  <p className="font-medium">{submission.region}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">컨텐츠 유형</p>
                  <p className="font-medium">{contentTypeLabels[submission.content_type] || submission.content_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">사진 포함</p>
                  <p className="font-medium">{submission.has_photo ? '예' : '아니오'}</p>
                </div>
                {submission.place_url && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">플레이스 URL</p>
                    <a href={submission.place_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      {submission.place_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">카페 상세 정보</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {submission.cafe_details?.map((cafe, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{cafe.name}</span>
                        <Badge variant="outline">{cafe.count}건</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                {submission.guideline && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">가이드라인</p>
                    <p className="font-medium whitespace-pre-wrap">{submission.guideline}</p>
                  </div>
                )}
                {submission.script_url && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">원고 링크</p>
                    <a href={submission.script_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      구글 시트로 보기
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 콘텐츠 목록 탭 */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>콘텐츠 목록</CardTitle>
                  <CardDescription>
                    업로드된 콘텐츠 {contentItems.length}건 / 총 {submission.total_count}건
                  </CardDescription>
                </div>
                {contentItems.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    엑셀 다운로드
                  </Button>
                )}
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
                  <p className="text-sm mt-1">관리자가 콘텐츠를 업로드하면 여기에 표시됩니다.</p>
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
  );
}
