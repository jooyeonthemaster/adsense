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
import { ArrowLeft, Download, Package, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DailyRecordCalendar } from '@/components/admin/review-marketing/DailyRecordCalendar';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ReceiptReviewDetail {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  has_script: boolean;
  guide_text: string | null;
  total_points: number;
  status: string;
  created_at: string;
  business_license_url?: string;
  photo_urls?: string[];
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface DailyRecord {
  date: string;
  actual_count: number;
  notes?: string;
}

const statusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '확인중', variant: 'outline' },
  approved: { label: '구동중', variant: 'default' }, // Legacy - will be migrated to in_progress
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
};

export default function VisitorReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [submission, setSubmission] = useState<ReceiptReviewDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
  }, [unwrappedParams.id]);

  const fetchSubmissionDetail = async () => {
    try {
      const response = await fetch(`/api/admin/review-marketing/visitor/${unwrappedParams.id}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubmission(data.submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast({
        title: '오류',
        description: '데이터를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyRecords = async () => {
    try {
      const response = await fetch(`/api/admin/review-marketing/visitor/${unwrappedParams.id}/daily-records`);
      if (response.ok) {
        const data = await response.json();
        setDailyRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching daily records:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/review-marketing/visitor/${unwrappedParams.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: '상태 변경 완료',
        description: '접수 상태가 변경되었습니다.',
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

  const downloadAllFiles = async () => {
    if (!submission) return;

    const filesToDownload: string[] = [];

    if (submission.business_license_url) {
      filesToDownload.push(submission.business_license_url);
    }
    if (submission.photo_urls) {
      filesToDownload.push(...submission.photo_urls);
    }

    if (filesToDownload.length === 0) {
      toast({
        title: '알림',
        description: '다운로드할 파일이 없습니다.',
      });
      return;
    }

    try {
      setDownloadLoading(true);
      const zip = new JSZip();

      for (let i = 0; i < filesToDownload.length; i++) {
        const url = filesToDownload[i];
        const response = await fetch(url);
        const blob = await response.blob();

        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        let folderName = '';
        if (url === submission.business_license_url) {
          folderName = 'business_license/';
        } else if (submission.photo_urls?.includes(url)) {
          folderName = 'photos/';
        }

        zip.file(folderName + fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `${submission.company_name}_${unwrappedParams.id.slice(0, 8)}_files.zip`;
      saveAs(zipBlob, zipFileName);

      toast({
        title: '다운로드 완료',
        description: '파일이 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: '오류',
        description: '파일 다운로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const totalActualCount = dailyRecords.reduce((sum, record) => sum + record.actual_count, 0);
  const completionRate = submission ? Math.round((totalActualCount / submission.total_count) * 100) : 0;

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
              <p className="text-sm text-muted-foreground">방문자 리뷰 상세 관리</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={submission.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">확인중</SelectItem>
                <SelectItem value="in_progress">구동중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">중단됨</SelectItem>
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
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="files">파일</TabsTrigger>
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
                  관리자가 수기로 실제 유입 건수를 기록합니다
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
                  apiEndpoint={`/api/admin/review-marketing/visitor/${unwrappedParams.id}/daily-records`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
