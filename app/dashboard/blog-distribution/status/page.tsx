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
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BlogDistribution {
  id: string;
  distribution_type: 'reviewer' | 'video' | 'automation';
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  keywords: string[] | null;
  total_points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'as_in_progress';
  created_at: string;
  progress_percentage?: number;
  completed_count?: number;
}

const typeConfig = {
  reviewer: { label: '리뷰어', icon: FileText, color: 'blue' },
  video: { label: '영상', icon: Video, color: 'red' },
  automation: { label: '자동화', icon: Zap, color: 'purple' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '확인중', variant: 'outline' },
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
};

export default function BlogDistributionStatusPage() {
  const { toast } = useToast();
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
  const [asConditionDialogOpen, setAsConditionDialogOpen] = useState(false);

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

  const [cancelLoading, setCancelLoading] = useState(false);

  const handleConfirmCancel = async () => {
    if (!agreedToCancel) {
      toast({
        variant: 'destructive',
        title: '동의 필요',
        description: '동의하지 않으면 중단 요청을 할 수 없습니다.',
      });
      return;
    }

    if (!selectedSubmission) return;

    setCancelLoading(true);
    try {
      const response = await fetch(`/api/submissions/blog/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '중단 처리 중 오류가 발생했습니다.');
      }

      const refundMessage = data.refund_amount > 0
        ? `환불 금액: ${data.refund_amount.toLocaleString()}P (새 잔액: ${data.new_balance.toLocaleString()}P)`
        : '';

      toast({
        title: '✅ 중단 신청 완료',
        description: refundMessage || '이미 예약 구동된 수량 제외 환불이 진행됩니다.',
      });
      setCancelDialogOpen(false);
      setSelectedSubmission(null);
      setAgreedToCancel(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: error instanceof Error ? error.message : '중단 처리 중 오류가 발생했습니다.',
      });
    } finally {
      setCancelLoading(false);
    }
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
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
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">블로그 배포 접수 현황</h1>
              </div>
              <p className="text-[11px] sm:text-sm text-emerald-100 truncate">영상/자동화/리뷰어 배포 접수 내역을 관리하세요</p>
            </div>
            <Link href="/dashboard/blog-distribution/reviewer" className="flex-shrink-0">
              <Button variant="secondary" size="sm" className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">새 접수</Button>
            </Link>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 sm:p-3 rounded-lg border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">총 접수</p>
                <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-emerald-600 mb-0.5">진행중</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-900">{stats.in_progress}</p>
              </div>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg border border-green-200 bg-green-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-green-600 mb-0.5">완료</p>
                <p className="text-lg sm:text-xl font-bold text-green-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input placeholder="업체명 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs sm:text-sm" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-32 h-8 text-xs sm:text-sm">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="reviewer">리뷰어</SelectItem>
              <SelectItem value="video">영상</SelectItem>
              <SelectItem value="automation">자동화</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-28 h-8 text-xs sm:text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">확인중</SelectItem>
              <SelectItem value="in_progress">구동중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="cancelled">중단됨</SelectItem>
              <SelectItem value="as_in_progress">AS 진행 중</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'cost')}>
            <SelectTrigger className="w-full sm:w-28 h-8 text-xs sm:text-sm">
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-amber-600 border-amber-300"
                            onClick={() => {
                              if (sub.status === 'completed') {
                                window.location.href = `/dashboard/as-request?submission_id=${sub.id}&type=blog`;
                              } else {
                                setAsConditionDialogOpen(true);
                              }
                            }}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />AS신청
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
        <div className="md:hidden space-y-2">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 bg-white border rounded-lg">
              <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const typeInfo = typeConfig[sub.distribution_type];
              const TypeIcon = typeInfo.icon;
              const statusDisplay = statusConfig[sub.status];

              return (
                <div key={sub.id} className="bg-white border rounded-lg p-2.5 space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                          <TypeIcon className="h-2.5 w-2.5 mr-0.5" />{typeInfo.label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-xs truncate">{sub.company_name}</h3>
                    </div>
                    <Badge variant={statusDisplay.variant} className="text-[10px] px-1.5 py-0.5 flex-shrink-0">{statusDisplay.label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">일 배포량</p>
                      <p className="text-xs font-medium">{sub.daily_count}건</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">총 수량</p>
                      <p className="text-xs font-medium">{sub.total_count}건</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-500 mb-1">진행률</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${sub.progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 min-w-[32px] text-right">
                          {sub.progress_percentage || 0}%
                        </span>
                      </div>
                    </div>
                    {sub.keywords && sub.keywords.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-[10px] text-gray-500 mb-1">키워드</p>
                        <div className="flex gap-1 flex-wrap">
                          {sub.keywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">접수일</p>
                      <p className="text-xs font-medium">{formatDate(sub.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">비용</p>
                      <p className="text-xs font-semibold text-emerald-600">{sub.total_points.toLocaleString()}P</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/blog-distribution/status/detail/${sub.id}`}
                      className="flex-1 text-[11px] h-7 text-blue-600 border-blue-300 px-2"
                    >
                      상세
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-[11px] h-7 text-emerald-600 border-emerald-300 px-2">
                      <Download className="h-2.5 w-2.5 mr-0.5" />리포트
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[11px] h-7 text-amber-600 border-amber-300 px-2"
                      onClick={() => {
                        if (sub.status === 'completed') {
                          window.location.href = `/dashboard/as-request?submission_id=${sub.id}&type=blog`;
                        } else {
                          setAsConditionDialogOpen(true);
                        }
                      }}
                    >
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />AS신청
                    </Button>
                    {canCancel(sub) && (
                      <Button variant="outline" size="sm" onClick={() => handleCancelClick(sub)} className="flex-1 text-[11px] h-7 text-red-600 border-red-300 px-2">중단</Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AS 신청 조건 안내 다이얼로그 */}
      <Dialog open={asConditionDialogOpen} onOpenChange={setAsConditionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              AS 신청 조건 안내
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                <p className="text-sm text-gray-700">작업이 <span className="font-semibold text-gray-900">완료된 상태</span>여야 합니다.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                <p className="text-sm text-gray-700">예정 수량 대비 실제 달성 수량이 <span className="font-semibold text-gray-900">20% 이상 부족</span>해야 합니다.</p>
              </div>
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600 font-medium">현재 작업이 아직 완료되지 않았습니다.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setAsConditionDialogOpen(false)} className="w-full sm:w-auto">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="outline" onClick={() => { setCancelDialogOpen(false); setAgreedToCancel(false); }} disabled={cancelLoading}>동의하지 않습니다</Button>
            <Button onClick={handleConfirmCancel} disabled={!agreedToCancel || cancelLoading} className="bg-red-600 hover:bg-red-700 text-white">{cancelLoading ? '처리 중...' : '중단 신청'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
