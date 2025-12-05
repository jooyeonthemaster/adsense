'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Calendar, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
};

// 일자 기준 자동 진행률 계산 함수
function calculateAutoProgress(startDate: string | null, totalDays: number) {
  if (!startDate) {
    return { currentDay: 0, progressPercent: 0, isStarted: false, isCompleted: false };
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays <= 0) {
    return { currentDay: 0, progressPercent: 0, isStarted: false, isCompleted: false };
  }

  if (diffDays >= totalDays) {
    return { currentDay: totalDays, progressPercent: 100, isStarted: true, isCompleted: true };
  }

  return {
    currentDay: diffDays,
    progressPercent: Math.round((diffDays / totalDays) * 100),
    isStarted: true,
    isCompleted: false,
  };
}

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
      const response = await fetch(`/api/submissions/reward/${unwrappedParams.id}`);
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
      const response = await fetch(`/api/submissions/reward/${unwrappedParams.id}/daily-records`);
      if (response.ok) {
        const data = await response.json();
        setDailyRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching daily records:', error);
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
              <p className="text-sm text-muted-foreground">리워드 상세 정보</p>
            </div>
          </div>
          <Badge variant={statusConfig[submission.status]?.variant || 'outline'}>
            {statusConfig[submission.status]?.label || submission.status}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>총 접수 수량</CardDescription>
              <CardTitle className="text-3xl">{totalExpected.toLocaleString()}타</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {submission.daily_count.toLocaleString()}타/일 × {submission.total_days}일
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                일자 기준 진행률
              </CardDescription>
              <CardTitle className="text-3xl text-sky-600">
                {(() => {
                  const progress = calculateAutoProgress(submission.start_date, submission.total_days);
                  return `${progress.progressPercent}%`;
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const progress = calculateAutoProgress(submission.start_date, submission.total_days);
                if (!progress.isStarted) {
                  return <p className="text-xs text-muted-foreground">구동 시작 대기중</p>;
                }
                if (progress.isCompleted) {
                  return <p className="text-xs text-emerald-600 font-medium">구동 완료!</p>;
                }
                return (
                  <p className="text-xs text-muted-foreground">
                    {progress.currentDay}일차 / {submission.total_days}일
                  </p>
                );
              })()}
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
                    className="text-sm text-emerald-600 hover:underline truncate block"
                  >
                    {submission.place_url}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">플레이스 MID</p>
                  <p className="font-medium">{submission.place_mid}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">일 접수량</p>
                  <p className="font-medium">{submission.daily_count.toLocaleString()}타</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">구동일수</p>
                  <p className="font-medium">{submission.total_days}일</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">접수일</p>
                  <p className="font-medium">
                    {new Date(submission.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                {submission.start_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">시작일</p>
                    <p className="font-medium">
                      {new Date(submission.start_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
                {submission.start_date && submission.total_days && (
                  <div>
                    <p className="text-sm text-muted-foreground">종료일</p>
                    <p className="font-medium">
                      {(() => {
                        const startDate = new Date(submission.start_date);
                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + submission.total_days - 1);
                        return endDate.toLocaleDateString('ko-KR');
                      })()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 일자별 진행 현황 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-sky-600" />
                  일자별 진행 현황
                </CardTitle>
                <CardDescription>
                  구동 시작일 기준 자동 계산된 진행률입니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const progress = calculateAutoProgress(submission.start_date, submission.total_days);

                  if (!submission.start_date) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">구동 시작일이 설정되지 않았습니다</p>
                        <p className="text-xs text-muted-foreground mt-1">관리자가 시작일을 설정하면 진행률이 자동 계산됩니다</p>
                      </div>
                    );
                  }

                  const endDate = new Date(submission.start_date);
                  endDate.setDate(endDate.getDate() + submission.total_days - 1);

                  return (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">진행률</span>
                        <span className="font-bold text-sky-600">{progress.progressPercent}%</span>
                      </div>
                      <Progress value={progress.progressPercent} className="h-3" />
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-muted-foreground">시작일</p>
                          <p className="font-medium">{new Date(submission.start_date).toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-muted-foreground">예상 종료일</p>
                          <p className="font-medium">{endDate.toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div className="p-3 bg-sky-50 rounded-lg">
                          <p className="text-xs text-sky-600">현재 진행</p>
                          <p className="font-bold text-sky-700">{progress.currentDay}일차 / {submission.total_days}일</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <p className="text-xs text-emerald-600">상태</p>
                          <p className="font-bold text-emerald-700">
                            {progress.isCompleted ? '완료' : progress.isStarted ? '진행중' : '대기중'}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {submission.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>관리자 메모</CardTitle>
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
                  실제 유입 건수를 일별로 확인할 수 있습니다
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
                  apiEndpoint={`/api/submissions/reward/${unwrappedParams.id}/daily-records`}
                  readOnly={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
