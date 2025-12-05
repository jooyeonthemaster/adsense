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
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DailyRecordCalendar } from '@/components/admin/review-marketing/DailyRecordCalendar';

interface PlaceSubmissionDetail {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string;
  place_mid: string;
  daily_count: number;
  total_days: number;
  total_points: number;
  status: string;
  created_at: string;
  start_date: string | null;
  notes: string | null;
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
  approved: { label: '접수완료', variant: 'default' },
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
};

export default function RewardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<PlaceSubmissionDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
  }, [unwrappedParams.id]);

  const fetchSubmissionDetail = async () => {
    try {
      const response = await fetch(`/api/admin/reward/${unwrappedParams.id}`);
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
      const response = await fetch(`/api/admin/reward/${unwrappedParams.id}/daily-records`);
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
      const response = await fetch(`/api/admin/reward/${unwrappedParams.id}`, {
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

  const totalActualCount = dailyRecords.reduce((sum, record) => sum + record.actual_count, 0);
  const totalExpected = submission ? submission.daily_count * submission.total_days : 0;
  const completionRate = totalExpected > 0 ? Math.round((totalActualCount / totalExpected) * 100) : 0;

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
              <p className="text-sm text-muted-foreground">리워드 상세 관리</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={submission.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">확인중</SelectItem>
                <SelectItem value="approved">접수완료</SelectItem>
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
              <CardDescription>일 접수량 × 구동일수</CardDescription>
              <CardTitle className="text-3xl">{submission.daily_count} × {submission.total_days}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                총 {totalExpected}타 예정
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>실제 유입</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">{totalActualCount}타</CardTitle>
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
                  <p className="text-sm text-muted-foreground">상품명</p>
                  <p className="font-medium">{submission.company_name}</p>
                </div>
                <div>
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
                <div>
                  <p className="text-sm text-muted-foreground">플레이스 MID</p>
                  <p className="font-medium font-mono text-sm">{submission.place_mid || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">일 접수량</p>
                  <p className="font-medium">{submission.daily_count}타</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">구동일수</p>
                  <p className="font-medium">{submission.total_days}일</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 비용</p>
                  <p className="font-medium">{submission.total_points.toLocaleString()}P</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">접수일</p>
                  <p className="font-medium">
                    {new Date(submission.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </p>
                </div>
                {submission.start_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">시작일</p>
                    <p className="font-medium">
                      {new Date(submission.start_date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>거래처 정보</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">회사명</p>
                  <p className="font-medium">{submission.clients?.company_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">담당자</p>
                  <p className="font-medium">{submission.clients?.contact_person || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">이메일</p>
                  <p className="font-medium">{submission.clients?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <p className="font-medium">{submission.clients?.phone || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {submission.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>메모</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{submission.notes}</p>
                </CardContent>
              </Card>
            )}
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
                  totalCount={totalExpected}
                  dailyCount={submission.daily_count}
                  totalDays={submission.total_days}
                  createdAt={submission.created_at}
                  startDateStr={submission.start_date}
                  onRecordSave={fetchDailyRecords}
                  apiEndpoint={`/api/admin/reward/${unwrappedParams.id}/daily-records`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
