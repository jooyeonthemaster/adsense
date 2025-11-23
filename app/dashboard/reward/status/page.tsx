'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, TrendingUp, ExternalLink, Filter, Gift, DollarSign } from 'lucide-react';

type RewardStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

interface RewardSubmission {
  id: string;
  company_name: string;
  place_url: string;
  place_mid: string;
  daily_count: number;
  total_days: number;
  current_day?: number;
  completed_count?: number;
  progress_percentage?: number;
  status: RewardStatus;
  created_at: string;
  total_points: number;
}

const statusConfig: Record<RewardStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '확인중', variant: 'outline' },
  approved: { label: '접수완료', variant: 'default' },
  in_progress: { label: '구동중', variant: 'secondary' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
};

export default function RewardStatusPage() {
  const [submissions, setSubmissions] = useState<RewardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RewardStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'progress'>('date');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [agreedToCancel, setAgreedToCancel] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/submissions/reward');
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (submissionId: string) => {
    setSelectedSubmission(submissionId);
    setAgreedToCancel(false);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!agreedToCancel) {
      alert('동의하지 않으면 중단 요청을 할 수 없습니다.');
      return;
    }

    // TODO: 중단 API 호출
    console.log('중단 요청:', selectedSubmission);
    alert('중단 신청이 완료되었습니다.');

    setCancelDialogOpen(false);
    setSelectedSubmission(null);
    setAgreedToCancel(false);
  };

  const calculateProgress = (submission: RewardSubmission) => {
    return submission.progress_percentage || 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 필터링 및 검색
  const filteredSubmissions = submissions
    .filter((sub) => {
      const matchesSearch = sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           sub.place_mid?.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'cost') {
        return b.total_points - a.total_points;
      } else {
        return calculateProgress(b) - calculateProgress(a);
      }
    });

  // 통계 계산
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    in_progress: submissions.filter(s => s.status === 'in_progress' || s.status === 'approved').length,
    completed: submissions.filter(s => s.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-3 lg:p-6">
      <div className="space-y-3 sm:space-y-4">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">리워드 접수 현황</h1>
              </div>
              <p className="text-[11px] sm:text-sm text-emerald-100 truncate">리워드(플레이스 유입) 접수 내역을 관리하세요</p>
            </div>
            <Link href="/dashboard/reward/submit" className="flex-shrink-0">
              <Button variant="secondary" size="sm" className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                새 접수
              </Button>
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 sm:p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">총 접수</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-emerald-600 mb-0.5">진행중</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-900">
                  {stats.pending + stats.in_progress}
                </p>
              </div>
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 flex-shrink-0" />
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg border border-teal-200 bg-teal-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-teal-600 mb-0.5">완료</p>
                <p className="text-lg sm:text-xl font-bold text-teal-900">{stats.completed}</p>
              </div>
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-teal-400 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="업체명 또는 MID로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs sm:text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RewardStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-32 h-8 text-xs sm:text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">확인중</SelectItem>
              <SelectItem value="approved">접수완료</SelectItem>
              <SelectItem value="in_progress">구동중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="cancelled">중단됨</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'cost' | 'progress')}>
            <SelectTrigger className="w-full sm:w-32 h-8 text-xs sm:text-sm">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">접수일순</SelectItem>
              <SelectItem value="cost">비용순</SelectItem>
              <SelectItem value="progress">진행률순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 데이터 테이블 - 데스크톱 */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">업체명</TableHead>
                <TableHead className="text-xs font-semibold">일 접수량</TableHead>
                <TableHead className="text-xs font-semibold">구동일수</TableHead>
                <TableHead className="text-xs font-semibold text-center">상태</TableHead>
                <TableHead className="text-xs font-semibold text-center">진행률</TableHead>
                <TableHead className="text-xs font-semibold">접수일시</TableHead>
                <TableHead className="text-xs font-semibold text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-gray-500">
                    접수 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => {
                  const statusDisplay = statusConfig[submission.status] || { label: submission.status, variant: 'outline' as const };
                  const progress = calculateProgress(submission);

                  return (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{submission.company_name}</span>
                          <a
                            href={submission.place_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-500 hover:text-emerald-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        {submission.place_mid && <p className="text-xs text-gray-500 mt-0.5">MID: {submission.place_mid}</p>}
                      </TableCell>
                      <TableCell className="text-sm">{submission.daily_count.toLocaleString()}타</TableCell>
                      <TableCell className="text-sm font-medium">
                        {submission.total_days}일
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusDisplay.variant} className="text-xs">
                          {statusDisplay.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-500 rounded-full h-2 transition-all"
                              style={{ width: `${Math.round(progress)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-emerald-600">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(submission.created_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/reward/status/${submission.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                            >
                              상세보기
                            </Button>
                          </Link>
                          {(submission.status === 'pending' || submission.status === 'in_progress') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelClick(submission.id)}
                              className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                            >
                              중단
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 카드 형태 - 모바일 */}
        <div className="md:hidden space-y-2">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => {
              const statusDisplay = statusConfig[submission.status];
              const progress = calculateProgress(submission);

              return (
                <div
                  key={submission.id}
                  className="bg-white border border-gray-200 rounded-lg p-2.5 space-y-2 shadow-sm"
                >
                  {/* 헤더 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-xs truncate">{submission.company_name}</h3>
                        <a
                          href={submission.place_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-500 flex-shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {submission.place_mid && <p className="text-[10px] text-gray-500 truncate">MID: {submission.place_mid}</p>}
                    </div>
                    <Badge variant={statusDisplay.variant} className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                      {statusDisplay.label}
                    </Badge>
                  </div>

                  {/* 진행률 */}
                  {submission.status === 'in_progress' && progress > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                        <span>진행률</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 상세 정보 */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">일 접수량</p>
                      <p className="text-xs font-medium">{submission.daily_count.toLocaleString()}타</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">구동일수</p>
                      <p className="text-xs font-medium">{submission.total_days}일</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-500 mb-0.5">접수일시</p>
                      <p className="text-xs font-medium">{formatDate(submission.created_at)}</p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-1.5 pt-1">
                    <Link href={`/dashboard/reward/status/${submission.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[11px] h-7 text-emerald-600 border-emerald-300 px-2"
                      >
                        상세보기
                      </Button>
                    </Link>
                    {(submission.status === 'pending' || submission.status === 'in_progress') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelClick(submission.id)}
                        className="flex-1 text-[11px] h-7 text-red-600 border-red-300 px-2"
                      >
                        중단
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 중단 확인 다이얼로그 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작업 중단 확인</DialogTitle>
            <DialogDescription>
              작업 중단은 가능하나, 환불은 어렵습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agree"
                checked={agreedToCancel}
                onCheckedChange={(checked) => setAgreedToCancel(checked === true)}
              />
              <label
                htmlFor="agree"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                동의합니다
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setAgreedToCancel(false);
              }}
            >
              동의하지 않습니다
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={!agreedToCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              중단 신청
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
