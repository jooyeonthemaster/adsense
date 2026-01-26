'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  FileText,
  TrendingUp,
  Activity,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { DailyRecordCalendar } from '@/components/admin/review-marketing/DailyRecordCalendar';

interface BlogDistributionSubmission {
  id: string;
  client_id: string;
  submission_number: string;
  company_name: string;
  distribution_type: string;
  content_type: string;
  daily_count: number;
  total_count: number;
  total_points: number;
  place_url: string;
  keywords: string;
  notes: string | null;
  account_id: string | null;
  charge_count: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  total_days: number;
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
  in_progress: '구동중',
  completed: '완료',
  cancelled: '중단됨',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const distributionTypeLabels: Record<string, string> = {
  reviewer: '리뷰어 배포',
  video: '247 배포',
  automation: '자동화 배포',
};

const contentTypeLabels: Record<string, string> = {
  review: '후기성',
  info: '정보성',
};

export default function BlogDistributionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<BlogDistributionSubmission | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [progress, setProgress] = useState<Progress>({ totalCompletedCount: 0, completionRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [unwrappedParams.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/blog-distribution/${unwrappedParams.id}`);
      const data = await response.json();

      if (data.success) {
        setSubmission(data.submission);
        setDailyRecords(data.dailyRecords || []);
        setProgress(data.progress);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
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

  // 외부계정 충전 요청 여부 판단
  const isExternalAccountRequest = submission.account_id && submission.charge_count && submission.daily_count === 0;

  // 블로그 배포 타입에 따른 product 파라미터 결정
  const getProductParam = () => {
    if (!submission) return 'blog-video';
    const typeMap: Record<string, string> = {
      'video': 'blog-video',
      'automation': 'blog-automation',
      'reviewer': 'blog-reviewer',
    };
    return typeMap[submission.distribution_type] || 'blog-video';
  };

  // 외부계정 충전 요청 UI
  if (isExternalAccountRequest) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/submissions?category=blog&product=${getProductParam()}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">외부계정 충전 요청</h1>
          </div>
          <Badge className={statusColors[submission.status] || 'bg-gray-100 text-gray-800'}>
            {statusLabels[submission.status] || submission.status}
          </Badge>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">충전 건수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-lg sm:text-2xl font-bold">{submission.charge_count}건</span>
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-sky-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">사용 포인트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-lg sm:text-2xl font-bold">{submission.total_points?.toLocaleString()}P</span>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">계정 ID</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-lg sm:text-2xl font-bold truncate">{submission.account_id}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">접수번호</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-bold">{submission.submission_number || '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 상세 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>충전 요청 정보</CardTitle>
            <CardDescription>외부 계정 충전 요청 상세 내역입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">계정 ID</p>
                <p className="font-medium">{submission.account_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">충전 건수</p>
                <p className="font-medium">{submission.charge_count}건</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">차감 포인트</p>
                <p className="font-medium text-blue-600">{submission.total_points?.toLocaleString()}P</p>
                <p className="text-xs text-gray-500">{submission.charge_count}건 × 10P</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">접수번호</p>
                <p className="font-medium">{submission.submission_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">접수일시</p>
                <p className="font-medium">{new Date(submission.created_at).toLocaleString('ko-KR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">상태</p>
                <Badge className={statusColors[submission.status] || 'bg-gray-100 text-gray-800'}>
                  {statusLabels[submission.status] || submission.status}
                </Badge>
              </div>
              {submission.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">메모</p>
                  <p className="font-medium">{submission.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 일반 블로그 배포 UI
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/submissions?category=blog&product=${getProductParam()}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">블로그 배포 상세</h1>
        </div>
        <Badge className={statusColors[submission.status] || 'bg-gray-100 text-gray-800'}>
          {statusLabels[submission.status] || submission.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">총 접수 수량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-2xl font-bold">{submission.total_count}건</span>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">일 접수량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-2xl font-bold">{submission.daily_count}건/일</span>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">완료 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-2xl font-bold">{progress.totalCompletedCount}건</span>
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
              <span className="text-lg sm:text-2xl font-bold">{progress.completionRate}%</span>
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
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
                {submission.company_name && (
                  <div>
                    <p className="text-sm text-gray-600">업체명</p>
                    <p className="font-medium">{submission.company_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">배포 유형</p>
                  <p className="font-medium">{distributionTypeLabels[submission.distribution_type] || submission.distribution_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">컨텐츠 유형</p>
                  <p className="font-medium">{contentTypeLabels[submission.content_type] || submission.content_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">예상 총 구동일</p>
                  <p className="font-medium">{submission.total_days}일</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">사용 포인트</p>
                  <p className="font-medium text-blue-600">{submission.total_points?.toLocaleString()}P</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">접수번호</p>
                  <p className="font-medium">{submission.submission_number || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {submission.distribution_type === 'reviewer' ? '플레이스/상품 링크' : '플레이스 링크'}
                  </p>
                  {submission.place_url ? (
                    <a href={submission.place_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                      {submission.place_url}
                    </a>
                  ) : (
                    <p className="text-gray-400 text-sm">-</p>
                  )}
                </div>
                {submission.keywords && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">키워드</p>
                    <p className="font-medium">{Array.isArray(submission.keywords) ? submission.keywords.join(', ') : submission.keywords}</p>
                  </div>
                )}
                {submission.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">메모</p>
                    <p className="font-medium">{submission.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>일별 배포 기록</CardTitle>
              <CardDescription>
                매일 배포된 건수를 확인합니다
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
                dailyCount={submission.daily_count}
                totalDays={submission.total_days}
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
