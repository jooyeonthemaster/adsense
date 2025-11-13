'use client';

import { useState } from 'react';
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
import { Search, Calendar, TrendingUp, DollarSign, ExternalLink, Filter } from 'lucide-react';

type RewardStatus = 'checking' | 'approved' | 'running' | 'completed' | 'cancelled';

interface RewardSubmission {
  id: string;
  businessName: string;
  placeUrl: string;
  placeMid: string;
  dailyVolume: number;
  operationDays: number;
  currentDay: number;
  status: RewardStatus;
  submittedAt: string;
  totalCost: number;
}

// 임시 데이터 (실제로는 API에서 가져옴)
const mockSubmissions: RewardSubmission[] = [
  {
    id: '1',
    businessName: '강남 맛집',
    placeUrl: 'https://map.naver.com/p/place/123456',
    placeMid: '123456',
    dailyVolume: 200,
    operationDays: 7,
    currentDay: 3,
    status: 'running',
    submittedAt: '2025-01-10T09:30:00',
    totalCost: 14000,
  },
  {
    id: '2',
    businessName: '홍대 카페',
    placeUrl: 'https://map.naver.com/p/place/234567',
    placeMid: '234567',
    dailyVolume: 100,
    operationDays: 5,
    currentDay: 0,
    status: 'approved',
    submittedAt: '2025-01-12T14:20:00',
    totalCost: 5000,
  },
  {
    id: '3',
    businessName: '역삼 헬스장',
    placeUrl: 'https://map.naver.com/p/place/345678',
    placeMid: '345678',
    dailyVolume: 150,
    operationDays: 10,
    currentDay: 0,
    status: 'checking',
    submittedAt: '2025-01-13T16:45:00',
    totalCost: 15000,
  },
  {
    id: '4',
    businessName: '판교 레스토랑',
    placeUrl: 'https://map.naver.com/p/place/456789',
    placeMid: '456789',
    dailyVolume: 300,
    operationDays: 14,
    currentDay: 14,
    status: 'completed',
    submittedAt: '2024-12-20T10:15:00',
    totalCost: 42000,
  },
  {
    id: '5',
    businessName: '선릉 피부과',
    placeUrl: 'https://map.naver.com/p/place/567890',
    placeMid: '567890',
    dailyVolume: 250,
    operationDays: 7,
    currentDay: 4,
    status: 'cancelled',
    submittedAt: '2025-01-08T11:30:00',
    totalCost: 17500,
  },
];

const statusConfig: Record<RewardStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  checking: { label: '확인중', variant: 'outline' },
  approved: { label: '접수완료', variant: 'default' },
  running: { label: '구동중', variant: 'secondary' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
};

export default function RewardStatusPage() {
  const [submissions] = useState<RewardSubmission[]>(mockSubmissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RewardStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'progress'>('date');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [agreedToCancel, setAgreedToCancel] = useState(false);

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

    console.log('중단 요청:', selectedSubmission);
    alert('중단 신청이 완료되었습니다.');

    setCancelDialogOpen(false);
    setSelectedSubmission(null);
    setAgreedToCancel(false);
  };

  const calculateProgress = (submission: RewardSubmission) => {
    if (submission.status === 'checking' || submission.status === 'approved') return 0;
    if (submission.status === 'completed') return 100;
    return (submission.currentDay / submission.operationDays) * 100;
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
      const matchesSearch = sub.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           sub.placeMid.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      } else if (sortBy === 'cost') {
        return b.totalCost - a.totalCost;
      } else {
        return calculateProgress(b) - calculateProgress(a);
      }
    });

  // 통계 계산
  const stats = {
    total: submissions.length,
    checking: submissions.filter(s => s.status === 'checking').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    running: submissions.filter(s => s.status === 'running').length,
    completed: submissions.filter(s => s.status === 'completed').length,
    totalCost: submissions.reduce((sum, s) => sum + s.totalCost, 0),
  };

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">총 접수</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-sky-200 bg-sky-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sky-600">진행중</p>
                <p className="text-xl font-bold text-sky-900">{stats.checking + stats.approved + stats.running}</p>
              </div>
              <Calendar className="h-8 w-8 text-sky-400" />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600">완료</p>
                <p className="text-xl font-bold text-emerald-900">{stats.completed}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600">총 비용</p>
                <p className="text-xl font-bold text-purple-900">{stats.totalCost.toLocaleString()}P</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="업체명 또는 MID로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RewardStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="checking">확인중</SelectItem>
              <SelectItem value="approved">접수완료</SelectItem>
              <SelectItem value="running">구동중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="cancelled">중단됨</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'cost' | 'progress')}>
            <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
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
        <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">업체명</TableHead>
                <TableHead className="text-xs font-semibold">MID</TableHead>
                <TableHead className="text-xs font-semibold">일 접수량</TableHead>
                <TableHead className="text-xs font-semibold">구동일수</TableHead>
                <TableHead className="text-xs font-semibold">진행상태</TableHead>
                <TableHead className="text-xs font-semibold">접수일시</TableHead>
                <TableHead className="text-xs font-semibold text-right">총 비용</TableHead>
                <TableHead className="text-xs font-semibold text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-gray-500">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => {
                  const status = statusConfig[submission.status];
                  const progress = calculateProgress(submission);
                  const canCancel = submission.status === 'checking' || submission.status === 'approved' || submission.status === 'running';

                  return (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <span>{submission.businessName}</span>
                          <a
                            href={submission.placeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-500 hover:text-sky-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{submission.placeMid}</TableCell>
                      <TableCell className="text-sm">{submission.dailyVolume.toLocaleString()}타</TableCell>
                      <TableCell className="text-sm">
                        {submission.status === 'running' ? (
                          <span className="text-sky-600 font-medium">
                            {submission.currentDay}/{submission.operationDays}일
                          </span>
                        ) : (
                          <span>{submission.operationDays}일</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                          {submission.status === 'running' && (
                            <div className="w-full">
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-sky-500 transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(submission.submittedAt)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-right">
                        {submission.totalCost.toLocaleString()}P
                      </TableCell>
                      <TableCell className="text-center">
                        {canCancel ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelClick(submission.id)}
                            className="text-xs h-7 text-red-600 border-red-300 hover:bg-red-50"
                          >
                            중단
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 카드 형태 - 모바일 */}
        <div className="md:hidden space-y-3">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => {
              const status = statusConfig[submission.status];
              const progress = calculateProgress(submission);
              const canCancel = submission.status === 'checking' || submission.status === 'approved' || submission.status === 'running';

              return (
                <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{submission.businessName}</h3>
                        <a
                          href={submission.placeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-500"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <p className="text-xs text-gray-500">MID: {submission.placeMid}</p>
                    </div>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>

                  {/* 진행바 */}
                  {submission.status === 'running' && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>진행률</span>
                        <span>{submission.currentDay}/{submission.operationDays}일</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 상세 정보 */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">일 접수량</p>
                      <p className="text-sm font-medium">{submission.dailyVolume.toLocaleString()}타</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">구동일수</p>
                      <p className="text-sm font-medium">{submission.operationDays}일</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">접수일시</p>
                      <p className="text-sm font-medium">{formatDate(submission.submittedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">총 비용</p>
                      <p className="text-sm font-semibold text-sky-600">{submission.totalCost.toLocaleString()}P</p>
                    </div>
                  </div>

                  {/* 액션 */}
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelClick(submission.id)}
                      className="w-full text-xs h-8 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      중단 신청
                    </Button>
                  )}
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
