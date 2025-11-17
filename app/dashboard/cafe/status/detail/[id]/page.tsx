'use client';

import { use, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Coffee, TrendingUp, Activity, ExternalLink } from 'lucide-react';
import { DailyRecordCalendar } from '@/components/admin/review-marketing/DailyRecordCalendar';

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
  created_at: string;
  updated_at: string;
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

interface Progress {
  totalCompletedCount: number;
  completionRate: number;
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
  const [submission, setSubmission] = useState<CafeMarketingSubmission | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [progress, setProgress] = useState<Progress>({ totalCompletedCount: 0, completionRate: 0 });
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
        setDailyRecords(data.daily_records || []);

        // Calculate progress
        const totalCompletedCount = (data.daily_records || []).reduce(
          (sum: number, r: DailyRecord) => sum + r.completed_count,
          0
        );
        const completionRate = data.submission.total_count > 0
          ? Math.round((totalCompletedCount / data.submission.total_count) * 100)
          : 0;

        setProgress({ totalCompletedCount, completionRate });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">카페 침투 마케팅 상세</h1>
        <Badge className={statusColors[submission.status] || 'bg-gray-100 text-gray-800'}>
          {statusLabels[submission.status] || submission.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">총 발행 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{submission.total_count}건</span>
              <Coffee className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">카페 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{submission.cafe_details?.length || 0}개</span>
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">완료 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{progress.totalCompletedCount}건</span>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{progress.completionRate}%</span>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">개요</TabsTrigger>
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

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>일별 발행 기록</CardTitle>
              <CardDescription>
                매일 발행된 건수를 확인합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyRecordCalendar
                submissionId={unwrappedParams.id}
                records={dailyRecords.map(r => ({
                  date: r.record_date,
                  actual_count: r.completed_count,
                  notes: r.notes || undefined
                }))}
                totalCount={submission.total_count}
                dailyCount={0}
                totalDays={30}
                createdAt={submission.created_at}
                onRecordSave={() => {}}
                apiEndpoint=""
                readOnly={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
