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
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DailyRecordCalendar } from '@/components/admin/review-marketing/DailyRecordCalendar';

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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
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

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>일별 발행 기록</CardTitle>
                <CardDescription>
                  매일 발행된 건수와 메모를 기록합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DailyRecordCalendar
                  submissionId={unwrappedParams.id}
                  records={dailyRecords.map(r => ({ date: r.record_date, actual_count: r.completed_count, notes: r.notes }))}
                  totalCount={submission.total_count}
                  dailyCount={0}
                  totalDays={30}
                  createdAt={submission.created_at}
                  onRecordSave={fetchDailyRecords}
                  apiEndpoint={`/api/admin/cafe-marketing/${unwrappedParams.id}/daily-records`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
