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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Filter,
  Calendar,
  Download,
  Camera,
  FileText as FileTextIcon,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';

interface ReceiptReviewSubmission {
  id: string;
  client_id: string;
  submission_number?: string;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  has_script: boolean;
  guide_text: string | null;
  business_license_url: string | null;
  sample_receipt_url: string | null;
  photo_urls: string[] | null;
  total_points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'as_in_progress';
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  actual_count_total?: number;
  progress_percentage?: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  pending: { label: '확인중', variant: 'outline', color: 'gray' },
  approved: { label: '구동중', variant: 'default', color: 'blue' }, // Legacy - will be migrated to in_progress
  in_progress: { label: '구동중', variant: 'default', color: 'blue' },
  completed: { label: '완료', variant: 'secondary', color: 'green' },
  cancelled: { label: '중단됨', variant: 'destructive', color: 'red' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default', color: 'amber' },
};

export default function VisitorReviewStatusPage() {
  const [submissions, setSubmissions] = useState<ReceiptReviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ReceiptReviewSubmission | null>(null);
  const [agreedToCancel, setAgreedToCancel] = useState(false);
  const [asConditionDialogOpen, setAsConditionDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, searchQuery, sortBy]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/submissions/receipt');
      if (!response.ok) throw new Error('Failed to fetch submissions');

      const data = await response.json();
      let filtered = data.submissions || [];

      // 상태 필터
      if (statusFilter !== 'all') {
        filtered = filtered.filter((s: ReceiptReviewSubmission) => s.status === statusFilter);
      }

      // 검색
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((s: ReceiptReviewSubmission) =>
          s.company_name.toLowerCase().includes(query)
        );
      }

      // 정렬
      filtered.sort((a: ReceiptReviewSubmission, b: ReceiptReviewSubmission) => {
        if (sortBy === 'cost') {
          return b.total_points - a.total_points;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setSubmissions(filtered);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (submission: ReceiptReviewSubmission) => {
    setSelectedSubmission(submission);
    setAgreedToCancel(false);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!agreedToCancel || !selectedSubmission) {
      alert('동의하지 않으면 중단 요청을 할 수 없습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/submissions/receipt/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '중단 신청에 실패했습니다.');
      }

      const data = await response.json();
      alert(
        `중단 신청이 완료되었습니다.\n환불 금액: ${data.refund_amount?.toLocaleString()}P (${
          data.refund_rate ? data.refund_rate * 100 : 0
        }%)`
      );
      setCancelDialogOpen(false);
      setSelectedSubmission(null);
      setAgreedToCancel(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Cancel request error:', error);
      alert(error instanceof Error ? error.message : '중단 신청에 실패했습니다.');
    }
  };

  const handleDownloadReport = async (submissionId: string) => {
    try {
      // TODO: 리포트 다운로드 API
      alert('리포트 다운로드 기능은 관리자가 리포트를 등록한 후 사용 가능합니다.');
    } catch (error) {
      console.error('Download error:', error);
    }
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

  const extractMid = (url: string) => {
    const match = url.match(/place\/(\d+)/);
    return match ? match[1] : '';
  };

  const calculateProgress = (submission: ReceiptReviewSubmission) => {
    if (submission.status === 'completed') return 100;
    if (submission.progress_percentage !== undefined) return submission.progress_percentage;

    // Fallback calculation
    const actualCount = submission.actual_count_total || 0;
    return submission.total_count > 0
      ? Math.round((actualCount / submission.total_count) * 100)
      : 0;
  };

  const canCancel = (submission: ReceiptReviewSubmission) => {
    return ['pending', 'in_progress'].includes(submission.status);
  };

  // 통계 계산
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    in_progress: submissions.filter((s) => s.status === 'in_progress').length,
    completed: submissions.filter((s) => s.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-3 lg:p-6">
      <div className="space-y-3 sm:space-y-4">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">영수증 리뷰 접수 현황</h1>
              </div>
              <p className="text-[11px] sm:text-sm text-purple-100 truncate">방문자 영수증 리뷰 접수 내역을 관리하세요</p>
            </div>
            <Link href="/dashboard/review/visitor" className="flex-shrink-0">
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

          <div className="p-2.5 sm:p-3 rounded-lg border border-purple-200 bg-purple-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-purple-600 mb-0.5">진행중</p>
                <p className="text-lg sm:text-xl font-bold text-purple-900">
                  {stats.pending + stats.in_progress}
                </p>
              </div>
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 flex-shrink-0" />
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-emerald-600 mb-0.5">완료</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-900">{stats.completed}</p>
              </div>
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 flex-shrink-0" />
            </div>
          </div>

        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="업체명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs sm:text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32 h-8 text-xs sm:text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="전체" />
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

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'cost')}>
            <SelectTrigger className="w-full sm:w-32 h-8 text-xs sm:text-sm">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">접수일순</SelectItem>
              <SelectItem value="cost">비용순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 - Desktop */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">업체명</TableHead>
                <TableHead className="text-xs font-semibold">일 발행수량</TableHead>
                <TableHead className="text-xs font-semibold">총 작업수량</TableHead>
                <TableHead className="text-xs font-semibold">옵션</TableHead>
                <TableHead className="text-xs font-semibold text-center">상태</TableHead>
                <TableHead className="text-xs font-semibold text-center">진행률</TableHead>
                <TableHead className="text-xs font-semibold">접수일시</TableHead>
                <TableHead className="text-xs font-semibold text-right">비용</TableHead>
                <TableHead className="text-xs font-semibold text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-sm text-gray-500">
                    접수 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((submission) => {
                  const statusDisplay = statusConfig[submission.status] || { label: submission.status, variant: 'outline' as const, color: 'gray' };
                  const progress = calculateProgress(submission);
                  const mid = extractMid(submission.place_url);

                  return (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{submission.company_name}</span>
                          <a
                            href={submission.place_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-500 hover:text-purple-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        {submission.submission_number && (
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">{submission.submission_number}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{submission.daily_count}건</TableCell>
                      <TableCell className="text-sm font-medium">
                        {submission.total_count}건
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {submission.has_photo && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              사진
                            </Badge>
                          )}
                          {submission.has_script && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <FileTextIcon className="h-3 w-3 mr-1" />
                              원고
                            </Badge>
                          )}
                        </div>
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
                              className="bg-purple-500 rounded-full h-2 transition-all"
                              style={{ width: `${Math.round(progress)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-purple-600">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(submission.created_at)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-right">
                        {submission.total_points.toLocaleString()}P
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/review/visitor/status/${submission.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-purple-600 border-purple-300 hover:bg-purple-50"
                            >
                              상세보기
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(submission.id)}
                            className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            리포트
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                            onClick={() => {
                              if (submission.status === 'completed') {
                                window.location.href = `/dashboard/as-request?submission_id=${submission.id}&type=receipt`;
                              } else {
                                setAsConditionDialogOpen(true);
                              }
                            }}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            AS신청
                          </Button>
                          {canCancel(submission) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelClick(submission)}
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

        {/* 카드 - Mobile */}
        <div className="md:hidden space-y-2">
          {submissions.length === 0 ? (
            <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            submissions.map((submission) => {
              const statusDisplay = statusConfig[submission.status];
              const progress = calculateProgress(submission);
              const mid = extractMid(submission.place_url);

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
                          className="text-purple-500 flex-shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {submission.submission_number && (
                        <p className="text-[10px] text-gray-500 truncate font-mono">{submission.submission_number}</p>
                      )}
                    </div>
                    <Badge variant={statusDisplay.variant} className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                      {statusDisplay.label}
                    </Badge>
                  </div>

                  {/* 옵션 */}
                  {(submission.has_photo || submission.has_script) && (
                    <div className="flex gap-1.5">
                      {submission.has_photo && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                          <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
                          사진
                        </Badge>
                      )}
                      {submission.has_script && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                          <FileTextIcon className="h-2.5 w-2.5 mr-0.5" />
                          원고
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* 진행률 */}
                  {submission.status === 'in_progress' && progress > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                        <span>진행률</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 상세 정보 */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">일 발행수량</p>
                      <p className="text-xs font-medium">{submission.daily_count}건</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">총 작업수량</p>
                      <p className="text-xs font-medium">{submission.total_count}건</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-500 mb-0.5">접수일시</p>
                      <p className="text-xs font-medium">{formatDate(submission.created_at)}</p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-1.5 pt-1">
                    <Link href={`/dashboard/review/visitor/status/${submission.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[11px] h-7 text-purple-600 border-purple-300 px-2"
                      >
                        상세
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(submission.id)}
                      className="flex-1 text-[11px] h-7 text-emerald-600 border-emerald-300 px-2"
                    >
                      <Download className="h-2.5 w-2.5 mr-0.5" />
                      리포트
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[11px] h-7 text-amber-600 border-amber-300 px-2"
                      onClick={() => {
                        if (submission.status === 'completed') {
                          window.location.href = `/dashboard/as-request?submission_id=${submission.id}&type=receipt`;
                        } else {
                          setAsConditionDialogOpen(true);
                        }
                      }}
                    >
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                      AS신청
                    </Button>
                    {canCancel(submission) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelClick(submission)}
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

      {/* 중단 확인 다이얼로그 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작업 중단 확인</DialogTitle>
            <DialogDescription>
              이미 예약 구동된 수량 제외 남은 건에 대해 환불이 진행됩니다.
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
