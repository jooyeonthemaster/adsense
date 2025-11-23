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
import { ArrowLeft, Download, Package, Image as ImageIcon, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DailyRecordCalendar } from '@/components/admin/review-marketing/DailyRecordCalendar';
import { DirectUpload } from '@/components/admin/kakaomap/DirectUpload';
import { ExcelUpload } from '@/components/admin/kakaomap/ExcelUpload';
import { ContentItemsList, type ContentItem } from '@/components/admin/kakaomap/ContentItemsList';
import { FeedbackManagement } from '@/components/admin/kakaomap/FeedbackManagement';
import { GeneralFeedbackView } from '@/components/admin/kakaomap/GeneralFeedbackView';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface KakaomapReviewDetail {
  id: string;
  client_id: string;
  company_name: string;
  kakaomap_url: string;
  daily_count: number;
  total_count: number;
  total_days: number;
  has_photo: boolean;
  photo_ratio: number;
  star_rating: string;
  script_type: string;
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
  pending: { label: '접수 대기', variant: 'outline' },
  waiting_content: { label: '콘텐츠 업로드 중', variant: 'default' },
  review: { label: '검수 대기', variant: 'outline' },
  revision_requested: { label: '수정 요청됨', variant: 'destructive' },
  in_progress: { label: '진행중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '취소됨', variant: 'destructive' },
};

const starRatingConfig: Record<string, { label: string }> = {
  mixed: { label: '4~5점 혼합' },
  five: { label: '5점대만' },
  four: { label: '4점대만' },
};

export default function KakaomapReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [submission, setSubmission] = useState<KakaomapReviewDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [photoWarningData, setPhotoWarningData] = useState<{ required: number; actual: number } | null>(null);

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
    fetchContentItems();
  }, [unwrappedParams.id]);

  const fetchSubmissionDetail = async () => {
    try {
      const response = await fetch(`/api/admin/kakaomap/${unwrappedParams.id}`);
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
      const response = await fetch(`/api/admin/kakaomap/${unwrappedParams.id}/daily-records`);
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
      const response = await fetch(`/api/admin/kakaomap/${unwrappedParams.id}/content`);
      if (response.ok) {
        const data = await response.json();
        setContentItems(data.content_items || []);
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/kakaomap/${unwrappedParams.id}/status`, {
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

  const handlePublish = async () => {
    if (!submission) return;

    try {
      const response = await fetch(`/api/admin/kakaomap/${unwrappedParams.id}/publish`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        // 사진 비율 부족 경고
        if (result.error === 'photo_ratio_insufficient') {
          setPhotoWarningData({
            required: result.required_ratio,
            actual: result.actual_ratio,
          });
          setPublishDialogOpen(true);
          return;
        }

        throw new Error(result.error || '배포에 실패했습니다.');
      }

      toast({
        title: '✓ 배포 완료',
        description: `${result.published_count}개의 콘텐츠가 유저에게 배포되었습니다.`,
      });

      // 새로고침
      fetchSubmissionDetail();
      fetchContentItems();
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '배포 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleForcePublish = async () => {
    setPublishDialogOpen(false);

    try {
      // 경고를 무시하고 강제 배포
      const response = await fetch(`/api/admin/kakaomap/${unwrappedParams.id}/publish?force=true`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '배포에 실패했습니다.');
      }

      toast({
        title: '✓ 배포 완료',
        description: `${result.published_count}개의 콘텐츠가 유저에게 배포되었습니다.`,
      });

      fetchSubmissionDetail();
      fetchContentItems();
    } catch (error) {
      console.error('Force publish error:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '배포 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
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
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="content">콘텐츠 관리</TabsTrigger>
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

          <TabsContent value="feedback" className="space-y-4">
            <GeneralFeedbackView submissionId={unwrappedParams.id} />
            <FeedbackManagement submissionId={unwrappedParams.id} />
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
                  totalDays={submission.total_days}
                  createdAt={submission.created_at}
                  onRecordSave={fetchDailyRecords}
                  apiEndpoint={`/api/admin/kakaomap/${unwrappedParams.id}/daily-records`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 사진 비율 경고 모달 */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600">⚠️ 사진 비율 부족</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              설정된 사진 비율에 도달하지 못했습니다.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">필요한 사진 비율:</span>
                <span className="text-amber-700 font-bold">{photoWarningData?.required}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">현재 사진 비율:</span>
                <span className="text-amber-700 font-bold">{photoWarningData?.actual}%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              그래도 배포하시겠습니까?
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleForcePublish} className="bg-amber-600 hover:bg-amber-700">
              강제 배포
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
