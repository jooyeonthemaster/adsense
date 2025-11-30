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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DailyRecordCalendar } from '@/components/admin/review-marketing/DailyRecordCalendar';

interface BlogDistributionDetail {
  id: string;
  client_id: string;
  company_name: string;
  distribution_type: string;
  content_type: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  total_days: number;
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

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<BlogDistributionDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
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

  const totalCompletedCount = dailyRecords.reduce((sum, record) => sum + record.completed_count, 0);
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
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview">개요</TabsTrigger>
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

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>일별 배포 기록</CardTitle>
                <CardDescription>
                  매일 배포된 건수와 메모를 기록합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DailyRecordCalendar
                  submissionId={unwrappedParams.id}
                  records={dailyRecords.map(r => ({ date: r.record_date, actual_count: r.completed_count, notes: r.notes }))}
                  totalCount={submission.total_count}
                  dailyCount={submission.daily_count}
                  totalDays={submission.total_days}
                  createdAt={submission.created_at}
                  onRecordSave={fetchDailyRecords}
                  apiEndpoint={`/api/admin/blog-distribution/${unwrappedParams.id}/daily-records`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
