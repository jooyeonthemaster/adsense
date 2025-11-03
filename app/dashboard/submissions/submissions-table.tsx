'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnySubmission, SubmissionStatus } from '@/types/submission';

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: '대기중',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
};

const STATUS_VARIANTS: Record<
  SubmissionStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'outline',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
};

const TYPE_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
  dynamic: '동적 상품',
};

export function SubmissionsTable() {
  const [submissions, setSubmissions] = useState<AnySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();

    // 페이지 포커스 시 자동 새로고침 (관리자가 상태 변경한 경우 반영)
    const handleFocus = () => {
      fetchSubmissions();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      if (!response.ok) {
        throw new Error('접수 내역을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubmissionDetails = (submission: AnySubmission): string => {
    switch (submission.type) {
      case 'place':
        return `일 ${submission.daily_count}타 × ${submission.total_days}일`;
      case 'receipt':
        return `총 ${submission.total_count}타`;
      case 'kakaomap':
        return `총 ${submission.total_count}타`;
      case 'blog':
        return `${submission.blog_type === 'reviewer' ? '리뷰어형' : submission.blog_type === 'video' ? '영상형' : '자동화형'} / 일 ${submission.daily_count}타 × ${submission.total_days}일`;
      case 'dynamic':
        if (submission.form_data) {
          const entries = Object.entries(submission.form_data)
            .filter(([key, value]) => key !== 'notes' && value !== '')
            .map(([key, value]) => `${value}`)
            .slice(0, 3);
          return entries.length > 0 ? entries.join(' / ') : '-';
        }
        return '-';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <p className="text-center text-muted-foreground text-xs sm:text-sm">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <p className="text-center text-destructive text-xs sm:text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <p className="text-center text-muted-foreground text-xs sm:text-sm">
            접수 내역이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg lg:text-xl">전체 접수 내역 ({submissions.length}건)</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        {/* 모바일: 카드 레이아웃 */}
        <div className="md:hidden space-y-3">
          {submissions.map((submission) => (
            <div key={`${submission.type}-${submission.id}`} className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{submission.company_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{formatDate(submission.created_at)}</p>
                </div>
                <p className="text-sm font-bold text-primary shrink-0">
                  {submission.total_points.toLocaleString()} P
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  {submission.type === 'dynamic' && submission.product_categories
                    ? submission.product_categories.name
                    : TYPE_LABELS[submission.type]}
                </Badge>
                <Badge variant={STATUS_VARIANTS[submission.status]} className="text-[10px] sm:text-xs">
                  {STATUS_LABELS[submission.status]}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>{getSubmissionDetails(submission)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 데스크탑: 테이블 레이아웃 */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs lg:text-sm whitespace-nowrap">접수일시</TableHead>
                <TableHead className="text-xs lg:text-sm whitespace-nowrap">상품유형</TableHead>
                <TableHead className="text-xs lg:text-sm whitespace-nowrap">업체명</TableHead>
                <TableHead className="text-xs lg:text-sm whitespace-nowrap">상세내용</TableHead>
                <TableHead className="text-xs lg:text-sm text-right whitespace-nowrap">포인트</TableHead>
                <TableHead className="text-xs lg:text-sm whitespace-nowrap">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={`${submission.type}-${submission.id}`}>
                  <TableCell className="font-mono text-xs lg:text-sm whitespace-nowrap">
                    {formatDate(submission.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className="text-xs">
                      {submission.type === 'dynamic' && submission.product_categories
                        ? submission.product_categories.name
                        : TYPE_LABELS[submission.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-xs lg:text-sm whitespace-nowrap">
                    {submission.company_name}
                  </TableCell>
                  <TableCell className="text-xs lg:text-sm text-muted-foreground whitespace-nowrap">
                    {getSubmissionDetails(submission)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs lg:text-sm whitespace-nowrap">
                    {submission.total_points.toLocaleString()} P
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={STATUS_VARIANTS[submission.status]} className="text-xs">
                      {STATUS_LABELS[submission.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
