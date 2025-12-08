'use client';

import { use, useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { CafeContentBasedCalendar } from '@/components/admin/cafe-marketing/CafeContentBasedCalendar';
import * as XLSX from 'xlsx';

interface CafeMarketingDetail {
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
  created_at: string;
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface DailyRecord {
  record_date: string;
  completed_count: number;
  notes?: string;
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

const contentStatusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '대기', variant: 'outline' },
  approved: { label: '승인됨', variant: 'default' },
  revision_requested: { label: '수정요청', variant: 'destructive' },
};

const statusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '확인중', variant: 'outline' },
  approved: { label: '접수완료', variant: 'default' },
  script_writing: { label: '원고작성중', variant: 'default' },
  script_completed: { label: '원고완료', variant: 'default' },
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
};

const contentTypeConfig: Record<string, string> = {
  review: '후기성',
  info: '정보성',
};

const scriptStatusConfig: Record<string, { label: string }> = {
  pending: { label: '대기중' },
  writing: { label: '작성중' },
  completed: { label: '완료' },
};

export default function CafeMarketingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<CafeMarketingDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
    fetchContentItems();
  }, [unwrappedParams.id]);

  const fetchSubmissionDetail = async () => {
    try {
      const response = await fetch(`/api/admin/cafe-marketing/${unwrappedParams.id}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubmission(data.submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast({
        title: '오류',
        description: '접수 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyRecords = async () => {
    try {
      const response = await fetch(`/api/admin/cafe-marketing/${unwrappedParams.id}/daily-records`);
      if (response.ok) {
        const data = await response.json();
        setDailyRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching daily records:', error);
    }
  };

  const fetchContentItems = async () => {
    try {
      const response = await fetch(`/api/admin/cafe-marketing/${unwrappedParams.id}/content-items`);
      if (response.ok) {
        const data = await response.json();
        setContentItems(data.contentItems || []);
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast({
          title: '오류',
          description: '엑셀 파일에 데이터가 없습니다.',
          variant: 'destructive',
        });
        return;
      }

      // 엑셀 컬럼 매핑 (한글/영문 지원)
      const items = jsonData.map((row) => ({
        post_title: row['작성제목'] || row['제목'] || row['post_title'] || '',
        published_date: row['발행일'] || row['published_date'] || row['날짜'] || '',
        status: row['상태'] || row['status'] || '대기',
        post_url: row['리뷰링크'] || row['글링크'] || row['post_url'] || row['URL'] || '',
        writer_id: row['작성아이디'] || row['작성 아이디'] || row['writer_id'] || '',
        cafe_name: row['카페명'] || row['카페'] || row['cafe_name'] || '',
        notes: row['메모'] || row['notes'] || row['비고'] || '',
      }));

      // API 호출
      const response = await fetch(`/api/admin/cafe-marketing/${unwrappedParams.id}/content-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '업로드 실패');
      }

      const result = await response.json();
      toast({
        title: '업로드 완료',
        description: result.message,
      });
      fetchContentItems();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: '업로드 오류',
        description: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // 파일 입력 초기화
      event.target.value = '';
    }
  };

  // 엑셀 다운로드 핸들러
  const handleDownloadExcel = () => {
    if (!submission) return;

    const getStatusLabel = (status: string | null) => {
      if (!status) return '대기';
      return contentStatusConfig[status]?.label || status;
    };

    const excelData = contentItems.map((item) => ({
      '접수번호': (submission as any).submission_number || '',
      '업체명': submission.company_name || '',
      '작성제목': item.post_title || '',
      '발행일': item.published_date || '',
      '상태': getStatusLabel(item.status),
      '리뷰링크': item.post_url || '',
      '작성아이디': item.writer_id || '',
      '카페명': item.cafe_name || '',
      '메모': item.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 18 },  // 접수번호
      { wch: 20 },  // 업체명
      { wch: 40 },  // 작성제목
      { wch: 12 },  // 발행일
      { wch: 10 },  // 상태
      { wch: 50 },  // 리뷰링크
      { wch: 20 },  // 작성아이디
      { wch: 20 },  // 카페명
      { wch: 30 },  // 메모
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '콘텐츠 목록');
    XLSX.writeFile(wb, `카페마케팅_${submission.company_name}_콘텐츠.xlsx`);
  };

  // 템플릿 다운로드 핸들러
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        '접수번호': 'CM-2025-0001',
        '업체명': '예시업체',
        '작성제목': '예시 제목입니다',
        '발행일': '2025-01-01',
        '상태': '대기',
        '리뷰링크': 'https://cafe.naver.com/...',
        '작성아이디': 'writer123',
        '카페명': '강남맘카페',
        '메모': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 40 },
      { wch: 12 },
      { wch: 10 },
      { wch: 50 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '템플릿');
    XLSX.writeFile(wb, '카페마케팅_콘텐츠_템플릿.xlsx');
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/cafe-marketing/${unwrappedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: '상태 변경 완료',
        description: '상태가 변경되었습니다.',
      });
      fetchSubmissionDetail();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 콘텐츠 기반 진행률 계산
  const totalCompletedCount = contentItems.length;
  const completionRate = submission ? Math.round((totalCompletedCount / submission.total_count) * 100) : 0;

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
              <p className="text-sm text-muted-foreground">카페 침투 마케팅 상세 정보</p>
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
