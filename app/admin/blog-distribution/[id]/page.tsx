'use client';

import { use, useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, Loader2, FileSpreadsheet, Upload, ExternalLink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContentBasedCalendar } from '@/components/admin/blog-distribution/ContentBasedCalendar';
import * as XLSX from 'xlsx';

interface BlogDistributionDetail {
  id: string;
  client_id: string;
  submission_number: string;
  company_name: string;
  distribution_type: string;
  content_type: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  total_days: number;
  start_date: string | null;
  end_date: string | null;
  keywords: string[] | null;
  guide_text: string | null;
  account_id: string | null;
  charge_count: number | null;
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

interface BlogContentItem {
  id: string;
  submission_id: string;
  upload_order: number;
  blog_url: string | null;
  blog_title: string | null;
  keyword: string | null;
  published_date: string | null;
  notes: string | null;
  status: string | null;
  blog_id: string | null;
  created_at: string;
}

const contentStatusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '대기', variant: 'outline' },
  approved: { label: '승인됨', variant: 'default' },
  revision_requested: { label: '수정요청', variant: 'destructive' },
};

const statusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '확인중', variant: 'outline' },
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
};

const distributionTypeConfig: Record<string, string> = {
  reviewer: '리뷰어',
  video: '영상',
  automation: '자동화',
};

const contentTypeConfig: Record<string, string> = {
  review: '후기성',
  info: '정보성',
};

export default function BlogDistributionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<BlogDistributionDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [contentItems, setContentItems] = useState<BlogContentItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
    fetchContentItems();
  }, [unwrappedParams.id]);

  const fetchSubmissionDetail = async () => {
    try {
      const response = await fetch(`/api/admin/blog-distribution/${unwrappedParams.id}`);
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
      const response = await fetch(`/api/admin/blog-distribution/${unwrappedParams.id}/daily-records`);
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
      const response = await fetch(`/api/admin/blog-distribution/${unwrappedParams.id}/content-items`);
      if (response.ok) {
        const data = await response.json();
        setContentItems(data.contentItems || []);
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/blog-distribution/${unwrappedParams.id}/status`, {
        method: 'PUT',
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

  // 진행률은 content_items 개수 기반으로 계산
  const totalCompletedCount = contentItems.length;
  const completionRate = submission ? Math.round((totalCompletedCount / submission.total_count) * 100) : 0;

  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

      if (jsonData.length === 0) {
        toast({
          title: '오류',
          description: '엑셀 파일에 데이터가 없습니다.',
          variant: 'destructive',
        });
        return;
      }

      // 엑셀 데이터를 API 형식으로 변환
      // 새 형식: 작성제목, 발행일, 상태, 블로그링크, 블로그아이디
      // 기존 형식도 호환 지원: 블로그URL, 블로그제목, 키워드, 발행일, 메모
      const items = jsonData.map((row) => ({
        blog_title: row['작성제목'] || row['블로그제목'] || row['blog_title'] || row['제목'] || '',
        published_date: row['발행일'] || row['published_date'] || row['날짜'] || '',
        status: row['상태'] || row['status'] || '대기',
        blog_url: row['블로그링크'] || row['블로그URL'] || row['blog_url'] || row['URL'] || '',
        blog_id: row['블로그아이디'] || row['blog_id'] || '',
        keyword: row['키워드'] || row['keyword'] || '',
        notes: row['메모'] || row['notes'] || row['비고'] || '',
      }));

      // API로 업로드
      const response = await fetch(`/api/admin/blog-distribution/${unwrappedParams.id}/content-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '업로드 실패');
      }

      toast({
        title: '업로드 완료',
        description: result.message || `${items.length}건의 콘텐츠가 업로드되었습니다.`,
      });

      fetchContentItems();
    } catch (error) {
      console.error('Error uploading excel:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '엑셀 파일 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 상태 한글 변환 함수
  const getStatusLabel = (status: string | null) => {
    if (!status) return '대기';
    switch (status) {
      case 'approved': return '승인됨';
      case 'revision_requested': return '수정요청';
      case 'pending':
      default: return '대기';
    }
  };

  // 엑셀 다운로드 핸들러
  const downloadContentItemsAsExcel = () => {
    if (!submission || contentItems.length === 0) {
      toast({
        title: '알림',
        description: '다운로드할 콘텐츠가 없습니다.',
      });
      return;
    }

    // 네이버 리뷰 형식에 맞춘 새 엑셀 형식
    const excelData = contentItems.map((item) => ({
      '접수번호': submission.submission_number || '',
      '업체명': submission.company_name || '',
      '작성제목': item.blog_title || '',
      '발행일': item.published_date || '',
      '상태': getStatusLabel(item.status),
      '블로그링크': item.blog_url || '',
      '블로그아이디': item.blog_id || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
      { wch: 18 },  // 접수번호
      { wch: 20 },  // 업체명
      { wch: 40 },  // 작성제목
      { wch: 12 },  // 발행일
      { wch: 10 },  // 상태
      { wch: 50 },  // 블로그링크
      { wch: 20 },  // 블로그아이디
    ];

    // 배포 타입에 따른 시트명
    const sheetName = distributionTypeConfig[submission.distribution_type]
      ? `${distributionTypeConfig[submission.distribution_type]}배포`
      : '블로그배포';

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fileName = `블로그배포_${submission.submission_number}_${submission.company_name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: '다운로드 완료',
      description: `${contentItems.length}건의 콘텐츠가 다운로드되었습니다.`,
    });
  };

  // 콘텐츠 전체 삭제
  const handleDeleteAllContent = async () => {
    if (!confirm('모든 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog-distribution/${unwrappedParams.id}/content-items`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      toast({
        title: '삭제 완료',
        description: '모든 콘텐츠가 삭제되었습니다.',
      });

      fetchContentItems();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: '오류',
        description: '콘텐츠 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

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
