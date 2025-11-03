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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Eye } from 'lucide-react';
import { SubmissionStatus } from '@/types/submission';
import * as XLSX from 'xlsx';
import { SubmissionDetailDialog } from './submission-detail-dialog';

interface Submission {
  id: string;
  client_id: string;
  company_name: string;
  total_points: number;
  status: SubmissionStatus;
  created_at: string;
  type: 'place' | 'receipt' | 'kakaomap' | 'blog'; // [UPDATED 2025-11-02] 'dynamic' 제거
  clients?: { company_name: string };
  daily_count?: number;
  total_days?: number;
  total_count?: number;
  blog_type?: string;
  // product_categories?: { name: string; slug: string }; // [DISABLED 2025-11-02] dynamic 타입 제거로 불필요
  // form_data?: Record<string, any>; // [DISABLED 2025-11-02] dynamic 타입 제거로 불필요
}

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
  // dynamic: '동적 상품', // [DISABLED 2025-11-02] 동적 상품 제거
};

export function AdminSubmissionsTable() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Detail dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<{
    id: string;
    type: 'place' | 'receipt' | 'kakaomap' | 'blog';
  } | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions, searchQuery, typeFilter, statusFilter, dateFilter, sortBy]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions');
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

  const applyFilters = () => {
    let filtered = [...submissions];

    // Search filter (company name + client company name)
    if (searchQuery) {
      filtered = filtered.filter((s) => {
        const clientName = s.clients?.company_name || '';
        const companyName = s.company_name || '';
        const searchLower = searchQuery.toLowerCase();
        return (
          clientName.toLowerCase().includes(searchLower) ||
          companyName.toLowerCase().includes(searchLower)
        );
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((s) => {
        const submissionDate = new Date(s.created_at);

        switch (dateFilter) {
          case 'today':
            return submissionDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return submissionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return submissionDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'points-asc':
          return a.total_points - b.total_points;
        case 'points-desc':
          return b.total_points - a.total_points;
        default:
          return 0;
      }
    });

    setFilteredSubmissions(filtered);
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

  const getSubmissionDetails = (submission: Submission): string => {
    switch (submission.type) {
      case 'place':
        return `일 ${submission.daily_count}타 × ${submission.total_days}일`;
      case 'receipt':
        return `총 ${submission.total_count}타`;
      case 'kakaomap':
        return `총 ${submission.total_count}타`;
      case 'blog':
        const blogTypeLabel =
          submission.blog_type === 'reviewer'
            ? '리뷰어형'
            : submission.blog_type === 'video'
            ? '영상형'
            : '자동화형';
        return `${blogTypeLabel} / 일 ${submission.daily_count}타 × ${submission.total_days}일`;
      // [DISABLED 2025-11-02] dynamic 타입 제거
      // case 'dynamic':
      //   if (submission.form_data) {
      //     const entries = Object.entries(submission.form_data)
      //       .filter(([key, value]) => key !== 'notes' && value !== '')
      //       .map(([key, value]) => `${value}`)
      //       .slice(0, 3);
      //     return entries.length > 0 ? entries.join(' / ') : '-';
      //   }
      //   return '-';
      default:
        return '-';
    }
  };

  const handleStatusChange = async (
    submissionId: string,
    submissionType: string,
    newStatus: SubmissionStatus
  ) => {
    const key = `${submissionType}-${submissionId}`;

    // Prevent duplicate requests
    if (updatingStatus[key]) return;

    // Optimistic update
    const originalSubmissions = [...submissions];
    const updatedSubmissions = submissions.map((s) =>
      s.id === submissionId && s.type === submissionType
        ? { ...s, status: newStatus }
        : s
    );
    setSubmissions(updatedSubmissions);
    setUpdatingStatus((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, type: submissionType }),
      });

      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다.');
      }

      const data = await response.json();

      // Update with server response
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId && s.type === submissionType
            ? { ...s, ...data.submission }
            : s
        )
      );
    } catch (err) {
      // Rollback on error
      setSubmissions(originalSubmissions);
      setError(err instanceof Error ? err.message : '상태 변경 중 오류가 발생했습니다.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const exportToExcel = () => {
    // Prepare data for Excel export
    const excelData = filteredSubmissions.map((submission) => ({
      '접수일시': formatDate(submission.created_at),
      '거래처': submission.clients?.company_name || '-',
      '상품유형': TYPE_LABELS[submission.type], // [UPDATED 2025-11-02] dynamic 타입 제거로 단순화
      '업체명': submission.company_name,
      '상세내용': getSubmissionDetails(submission),
      '사용포인트': submission.total_points,
      '상태': STATUS_LABELS[submission.status],
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // 접수일시
      { wch: 15 }, // 거래처
      { wch: 15 }, // 상품유형
      { wch: 20 }, // 업체명
      { wch: 30 }, // 상세내용
      { wch: 12 }, // 사용포인트
      { wch: 10 }, // 상태
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, '접수내역');

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `접수내역_${today}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            전체 접수 내역 ({filteredSubmissions.length} / {submissions.length}건)
          </CardTitle>
          <Button
            onClick={exportToExcel}
            disabled={filteredSubmissions.length === 0}
            className="gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">엑셀 다운로드</span>
            <span className="sm:hidden">다운로드</span>
          </Button>
        </div>
        {/* 필터 영역 - 모바일 가로 스크롤 */}
        <div className="mt-3 sm:mt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="grid gap-1.5 sm:gap-2 min-w-[200px] sm:min-w-0">
              <Label htmlFor="search" className="text-xs sm:text-sm whitespace-nowrap">검색</Label>
              <Input
                id="search"
                placeholder="거래처명, 업체명..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="grid gap-1.5 sm:gap-2 min-w-[140px] sm:min-w-0">
              <Label htmlFor="type-filter" className="text-xs sm:text-sm whitespace-nowrap">상품 유형</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter" className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">전체</SelectItem>
                  <SelectItem value="place" className="text-xs sm:text-sm">플레이스 유입</SelectItem>
                  <SelectItem value="receipt" className="text-xs sm:text-sm">영수증 리뷰</SelectItem>
                  <SelectItem value="kakaomap" className="text-xs sm:text-sm">카카오맵 리뷰</SelectItem>
                  <SelectItem value="blog" className="text-xs sm:text-sm">블로그 배포</SelectItem>
                  {/* <SelectItem value="dynamic">동적 상품</SelectItem> [DISABLED 2025-11-02] */}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:gap-2 min-w-[120px] sm:min-w-0">
              <Label htmlFor="status-filter" className="text-xs sm:text-sm whitespace-nowrap">상태</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">전체</SelectItem>
                  <SelectItem value="pending" className="text-xs sm:text-sm">대기중</SelectItem>
                  <SelectItem value="in_progress" className="text-xs sm:text-sm">진행중</SelectItem>
                  <SelectItem value="completed" className="text-xs sm:text-sm">완료</SelectItem>
                  <SelectItem value="cancelled" className="text-xs sm:text-sm">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:gap-2 min-w-[120px] sm:min-w-0">
              <Label htmlFor="date-filter" className="text-xs sm:text-sm whitespace-nowrap">기간</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date-filter" className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">전체</SelectItem>
                  <SelectItem value="today" className="text-xs sm:text-sm">오늘</SelectItem>
                  <SelectItem value="week" className="text-xs sm:text-sm">최근 7일</SelectItem>
                  <SelectItem value="month" className="text-xs sm:text-sm">최근 30일</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:gap-2 min-w-[120px] sm:min-w-0">
              <Label htmlFor="sort-by" className="text-xs sm:text-sm whitespace-nowrap">정렬</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by" className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="최신순" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc" className="text-xs sm:text-sm">최신순</SelectItem>
                  <SelectItem value="date-asc" className="text-xs sm:text-sm">오래된순</SelectItem>
                  <SelectItem value="points-desc" className="text-xs sm:text-sm">포인트 높은순</SelectItem>
                  <SelectItem value="points-asc" className="text-xs sm:text-sm">포인트 낮은순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        {filteredSubmissions.length === 0 ? (
          <p className="text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8">
            조회된 접수 내역이 없습니다.
          </p>
        ) : (
          <>
            {/* 모바일: 카드 레이아웃 */}
            <div className="md:hidden space-y-3">
              {filteredSubmissions.map((submission) => (
                <div key={`${submission.type}-${submission.id}`} className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{submission.company_name}</p>
                      <p className="text-xs text-muted-foreground">{submission.clients?.company_name || '-'}</p>
                    </div>
                    <p className="text-sm font-bold text-primary shrink-0">
                      {submission.total_points.toLocaleString()} P
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {TYPE_LABELS[submission.type]}
                    </Badge>
                    <Select
                      value={submission.status}
                      onValueChange={(value) =>
                        handleStatusChange(
                          submission.id,
                          submission.type,
                          value as SubmissionStatus
                        )
                      }
                      disabled={updatingStatus[`${submission.type}-${submission.id}`]}
                    >
                      <SelectTrigger className="w-[110px] h-7 text-[10px] sm:text-xs">
                        <SelectValue>
                          <Badge variant={STATUS_VARIANTS[submission.status]} className="text-[10px] sm:text-xs">
                            {STATUS_LABELS[submission.status]}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending" className="text-xs">
                          <Badge variant="outline" className="text-xs">대기중</Badge>
                        </SelectItem>
                        <SelectItem value="in_progress" className="text-xs">
                          <Badge variant="default" className="text-xs">진행중</Badge>
                        </SelectItem>
                        <SelectItem value="completed" className="text-xs">
                          <Badge variant="secondary" className="text-xs">완료</Badge>
                        </SelectItem>
                        <SelectItem value="cancelled" className="text-xs">
                          <Badge variant="destructive" className="text-xs">취소</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] sm:text-xs"
                      onClick={() => {
                        setSelectedSubmission({
                          id: submission.id,
                          type: submission.type,
                        });
                        setDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      상세보기
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{getSubmissionDetails(submission)}</p>
                    <p className="font-mono">{formatDate(submission.created_at)}</p>
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
                    <TableHead className="text-xs lg:text-sm whitespace-nowrap">거래처</TableHead>
                    <TableHead className="text-xs lg:text-sm whitespace-nowrap">상품유형</TableHead>
                    <TableHead className="text-xs lg:text-sm whitespace-nowrap">업체명</TableHead>
                    <TableHead className="text-xs lg:text-sm whitespace-nowrap">상세내용</TableHead>
                    <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap">사용 포인트</TableHead>
                    <TableHead className="text-xs lg:text-sm whitespace-nowrap">상태</TableHead>
                    <TableHead className="text-xs lg:text-sm whitespace-nowrap">상세보기</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={`${submission.type}-${submission.id}`}>
                      <TableCell className="font-mono text-xs lg:text-sm whitespace-nowrap">
                        {formatDate(submission.created_at)}
                      </TableCell>
                      <TableCell className="font-medium text-xs lg:text-sm whitespace-nowrap">
                        {submission.clients?.company_name || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[submission.type]}
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
                        <Select
                          value={submission.status}
                          onValueChange={(value) =>
                            handleStatusChange(
                              submission.id,
                              submission.type,
                              value as SubmissionStatus
                            )
                          }
                          disabled={updatingStatus[`${submission.type}-${submission.id}`]}
                        >
                          <SelectTrigger className="w-[100px] lg:w-[120px] h-8 text-xs">
                            <SelectValue>
                              <Badge variant={STATUS_VARIANTS[submission.status]} className="text-xs">
                                {STATUS_LABELS[submission.status]}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending" className="text-xs">
                              <Badge variant="outline" className="text-xs">대기중</Badge>
                            </SelectItem>
                            <SelectItem value="in_progress" className="text-xs">
                              <Badge variant="default" className="text-xs">진행중</Badge>
                            </SelectItem>
                            <SelectItem value="completed" className="text-xs">
                              <Badge variant="secondary" className="text-xs">완료</Badge>
                            </SelectItem>
                            <SelectItem value="cancelled" className="text-xs">
                              <Badge variant="destructive" className="text-xs">취소</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubmission({
                              id: submission.id,
                              type: submission.type,
                            });
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      {/* 상세보기 다이얼로그 */}
      {selectedSubmission && (
        <SubmissionDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          submissionId={selectedSubmission.id}
          submissionType={selectedSubmission.type}
        />
      )}
    </Card>
  );
}
