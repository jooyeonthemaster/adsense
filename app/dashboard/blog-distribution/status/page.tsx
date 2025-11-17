'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Filter,
  Calendar,
  Download,
  FileText,
  Video,
  Zap,
} from 'lucide-react';

interface BlogDistribution {
  id: string;
  distribution_type: 'reviewer' | 'video' | 'automation';
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  keywords: string[] | null;
  total_points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  progress_percentage?: number;
  completed_count?: number;
}

const typeConfig = {
  reviewer: { label: '리뷰어', icon: FileText, color: 'blue' },
  video: { label: '영상', icon: Video, color: 'red' },
  automation: { label: '자동화', icon: Zap, color: 'purple' },
};

const statusConfig = {
  pending: { label: '확인중', variant: 'outline' as const },
  in_progress: { label: '구동중', variant: 'default' as const },
  completed: { label: '완료', variant: 'secondary' as const },
  cancelled: { label: '중단됨', variant: 'destructive' as const },
};

export default function BlogDistributionStatusPage() {
  const [submissions, setSubmissions] = useState<BlogDistribution[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<BlogDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<BlogDistribution | null>(null);
  const [agreedToCancel, setAgreedToCancel] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/submissions/blog');
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

  // 필터링은 별도 함수로 처리
  useEffect(() => {
    let filtered = [...submissions];

    // 타입 필터
    if (typeFilter !== 'all') {
      filtered = filtered.filter((s) => s.distribution_type === typeFilter);
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => s.company_name.toLowerCase().includes(query));
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'cost') return b.total_points - a.total_points;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredSubmissions(filtered);
  }, [submissions, typeFilter, statusFilter, searchQuery, sortBy]);

  const handleCancelClick = (submission: BlogDistribution) => {
    setSelectedSubmission(submission);
    setAgreedToCancel(false);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!agreedToCancel) {
      alert('동의하지 않으면 중단 요청을 할 수 없습니다.');
      return;
    }
    alert('중단 신청이 완료되었습니다. 이미 예약 구동된 수량 제외 환불됩니다.');
    setCancelDialogOpen(false);
    setSelectedSubmission(null);
    fetchSubmissions();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancel = (submission: BlogDistribution) => ['pending', 'in_progress'].includes(submission.status);

  const stats = {
    total: filteredSubmissions.length,
    in_progress: filteredSubmissions.filter((s) => ['pending', 'in_progress'].includes(s.status)).length,
    completed: filteredSubmissions.filter((s) => s.status === 'completed').length,
    total_cost: filteredSubmissions.reduce((sum, s) => sum + s.total_points, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8" />
                <h1 className="text-2xl font-bold">블로그 배포 접수 현황</h1>
              </div>
              <p className="text-emerald-100">영상/자동화/리뷰어 배포 접수 내역을 관리하세요</p>
            </div>
            <Link href="/dashboard/blog-distribution/reviewer">
              <Button variant="secondary" size="sm">새 접수하기</Button>
            </Link>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg border bg-white shadow-sm">
            <p className="text-xs text-gray-500 mb-1">총 접수</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm">
            <p className="text-xs text-emerald-600 mb-1">진행중</p>
            <p className="text-2xl font-bold text-emerald-900">{stats.in_progress}</p>
          </div>
          <div className="p-4 rounded-lg border border-green-200 bg-green-50 shadow-sm">
            <p className="text-xs text-green-600 mb-1">완료</p>
            <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
          </div>
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm">
            <p className="text-xs text-emerald-600 mb-1">총 비용</p>
            <p className="text-2xl font-bold text-emerald-900">{stats.total_cost.toLocaleString()}P</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="업체명 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 text-sm" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40 h-10 text-sm">
              <SelectValue placeholder="타입 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="reviewer">리뷰어</SelectItem>
              <SelectItem value="video">영상</SelectItem>
              <SelectItem value="automation">자동화</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 h-10 text-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">확인중</SelectItem>
              <SelectItem value="in_progress">구동중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'cost')}>
            <SelectTrigger className="w-full sm:w-32 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">접수일순</SelectItem>
              <SelectItem value="cost">비용순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        <div className="hidden md:block bg-white border rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">타입</TableHead>
                <TableHead className="text-xs font-semibold">업체명</TableHead>
                <TableHead className="text-xs font-semibold">일 배포량</TableHead>
                <TableHead className="text-xs font-semibold">총 수량</TableHead>
                <TableHead className="text-xs font-semibold">상태</TableHead>
                <TableHead className="text-xs font-semibold text-center">진행률</TableHead>
                <TableHead className="text-xs font-semibold">접수일</TableHead>
                <TableHead className="text-xs font-semibold text-right">비용</TableHead>
                <TableHead className="text-xs font-semibold text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-sm text-gray-500">접수 내역이 없습니다.</TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => {
                  const typeInfo = typeConfig[sub.distribution_type];
                  const TypeIcon = typeInfo.icon;
                  const statusDisplay = statusConfig[sub.status];

                  return (
                    <TableRow key={sub.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Badge variant="outline" className={`text-xs bg-${typeInfo.color}-50 text-${typeInfo.color}-700`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{sub.company_name}</TableCell>
                      <TableCell className="text-sm">{sub.daily_count}건</TableCell>
                      <TableCell className="text-sm font-medium">{sub.total_count}건</TableCell>
                      <TableCell>
                        <Badge variant={statusDisplay.variant} className="text-xs">{statusDisplay.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all"
                              style={{ width: `${sub.progress_percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-emerald-600 min-w-[40px]">
                            {sub.progress_percentage || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(sub.created_at)}</TableCell>
                      <TableCell className="text-sm font-semibold text-right">{sub.total_points.toLocaleString()}P</TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/dashboard/blog-distribution/status/detail/${sub.id}`}
                            className="h-7 text-xs text-blue-600 border-blue-300"
                          >
                            상세
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-300">
                            <Download className="h-3 w-3 mr-1" />리포트
                          </Button>
                          {canCancel(sub) && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelClick(sub)} className="h-7 text-xs text-red-600 border-red-300">중단</Button>
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

        {/* 모바일 카드 */}
        <div className="md:hidden space-y-3">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-white border rounded-lg">
              <p className="text-sm text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const typeInfo = typeConfig[sub.distribution_type];
              const TypeIcon = typeInfo.icon;
              const statusDisplay = statusConfig[sub.status];

              return (
                <div key={sub.id} className="bg-white border rounded-lg p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          <TypeIcon className="h-3 w-3 mr-1" />{typeInfo.label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{sub.company_name}</h3>
                    </div>
                    <Badge variant={statusDisplay.variant} className="text-xs">{statusDisplay.label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">일 배포량</p>
                      <p className="text-sm font-medium">{sub.daily_count}건</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">총 수량</p>
                      <p className="text-sm font-medium">{sub.total_count}건</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-2">진행률</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${sub.progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-emerald-600 min-w-[40px]">
                          {sub.progress_percentage || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">키워드</p>
                      <div className="flex gap-1 flex-wrap">
                        {sub.keywords?.map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">접수일</p>
                      <p className="text-sm font-medium">{formatDate(sub.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">비용</p>
                      <p className="text-sm font-semibold text-emerald-600">{sub.total_points.toLocaleString()}P</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/blog-distribution/status/detail/${sub.id}`}
                      className="flex-1 text-xs h-9 text-blue-600"
                    >
                      상세
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-9 text-emerald-600">
                      <Download className="h-3 w-3 mr-1" />리포트
                    </Button>
                    {canCancel(sub) && (
                      <Button variant="outline" size="sm" onClick={() => handleCancelClick(sub)} className="flex-1 text-xs h-9 text-red-600">중단</Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 중단 다이얼로그 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작업 중단 확인</DialogTitle>
            <DialogDescription>이미 예약 구동된 수량 제외 남은 건에 대해 환불이 진행됩니다.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="agree" checked={agreedToCancel} onCheckedChange={(checked) => setAgreedToCancel(checked === true)} />
              <label htmlFor="agree" className="text-sm font-medium">동의합니다</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelDialogOpen(false); setAgreedToCancel(false); }}>동의하지 않습니다</Button>
            <Button onClick={handleConfirmCancel} disabled={!agreedToCancel} className="bg-red-600 hover:bg-red-700 text-white">중단 신청</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
