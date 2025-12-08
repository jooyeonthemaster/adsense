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
  Filter,
  Calendar,
  Coffee,
  ExternalLink,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface CafeSubmission {
  id: string;
  company_name: string;
  place_url?: string | null;
  content_type: 'review' | 'info';
  region: string;
  cafe_details: Array<{ name: string; count: number }>;
  total_count: number;
  has_photo: boolean;
  guideline?: string | null;
  photo_urls?: string[] | null;
  script_status: 'pending' | 'writing' | 'completed';
  script_url?: string | null;
  total_points: number;
  status: 'pending' | 'approved' | 'script_writing' | 'script_completed' | 'in_progress' | 'completed' | 'cancelled' | 'as_in_progress';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  completed_count?: number;
  progress_percentage?: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '확인중', variant: 'outline' },
  approved: { label: '접수완료', variant: 'default' },
  script_writing: { label: '원고작성중', variant: 'default' },
  script_completed: { label: '원고작업완료', variant: 'default' },
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
};

const scriptStatusConfig = {
  pending: { label: '대기중', color: 'gray' },
  writing: { label: '원고작성중', color: 'purple' },
  completed: { label: '원고완료', color: 'teal' },
};

export default function CafeMarketingStatusPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<CafeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<CafeSubmission | null>(null);
  const [agreedToCancel, setAgreedToCancel] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, searchQuery, sortBy]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/submissions/cafe');
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (submission: CafeSubmission) => {
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
      const response = await fetch(`/api/submissions/cafe/${selectedSubmission.id}`, {
        method: 'PATCH',
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

  const canCancel = (submission: CafeSubmission) => ['pending', 'in_progress'].includes(submission.status);

  // 개별 접수 건 리포트 다운로드 핸들러
  const handleDownloadReport = async (submissionId: string, companyName: string) => {
    try {
      // 해당 접수의 콘텐츠 아이템 조회
      const response = await fetch(`/api/submissions/cafe/${submissionId}`);
      const data = await response.json();

      if (!data.success || !data.content_items || data.content_items.length === 0) {
        toast({
          variant: 'destructive',
          title: '다운로드 실패',
          description: '다운로드할 콘텐츠가 없습니다.',
        });
        return;
      }

      const contentStatusLabels: Record<string, string> = {
        pending: '대기',
        approved: '승인됨',
        revision_requested: '수정요청',
      };

      const excelData = data.content_items.map((item: any, index: number) => ({
        '순번': index + 1,
        '작성제목': item.post_title || '',
        '발행일': item.published_date || '',
        '상태': contentStatusLabels[item.status] || item.status || '대기',
        '리뷰링크': item.post_url || '',
        '작성아이디': item.writer_id || '',
        '카페명': item.cafe_name || '',
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 6 },   // 순번
        { wch: 40 },  // 작성제목
        { wch: 12 },  // 발행일
        { wch: 10 },  // 상태
        { wch: 50 },  // 리뷰링크
        { wch: 20 },  // 작성아이디
        { wch: 20 },  // 카페명
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '콘텐츠 목록');
      XLSX.writeFile(wb, `카페마케팅_${companyName}_콘텐츠목록.xlsx`);

      toast({
        title: '✅ 다운로드 완료',
        description: `${companyName} 콘텐츠 리포트가 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: '다운로드 오류',
        description: '리포트 다운로드 중 오류가 발생했습니다.',
      });
    }
  };

  const stats = {
    total: submissions.length,
    in_progress: submissions.filter((s) => ['pending', 'in_progress'].includes(s.status)).length,
    completed: submissions.filter((s) => s.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-3 lg:p-6">
      <div className="space-y-3 sm:space-y-4">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Coffee className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">카페 침투 마케팅 접수 현황</h1>
              </div>
              <p className="text-[11px] sm:text-sm text-orange-100 truncate">지역 카페 마케팅 접수 내역을 관리하세요</p>
            </div>
            <Link href="/dashboard/cafe" className="flex-shrink-0">
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
          <div className="p-2.5 sm:p-3 rounded-lg border border-orange-200 bg-orange-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-orange-600 mb-0.5">진행중</p>
                <p className="text-lg sm:text-xl font-bold text-orange-900">{stats.in_progress}</p>
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
                <TableHead className="text-xs font-semibold">업체명</TableHead>
                <TableHead className="text-xs font-semibold">카페 수</TableHead>
                <TableHead className="text-xs font-semibold">발행 건수</TableHead>
                <TableHead className="text-xs font-semibold text-center">진행률</TableHead>
                <TableHead className="text-xs font-semibold">사진</TableHead>
                <TableHead className="text-xs font-semibold">진행 상태</TableHead>
                <TableHead className="text-xs font-semibold">접수일</TableHead>
                <TableHead className="text-xs font-semibold text-right">비용</TableHead>
                <TableHead className="text-xs font-semibold text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-sm text-gray-500">접수 내역이 없습니다.</TableCell>
                </TableRow>
              ) : (
                submissions.map((sub) => {
                  const statusDisplay = statusConfig[sub.status];

                  return (
                    <TableRow key={sub.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          {sub.company_name}
                          {sub.place_url && (
                            <a href={sub.place_url} target="_blank" rel="noopener noreferrer" className="text-orange-500">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{sub.cafe_details?.length || 0}개</TableCell>
                      <TableCell className="text-sm font-medium">{sub.total_count || 0}건</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 max-w-[80px] bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full transition-all"
                              style={{ width: `${sub.progress_percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-orange-600 min-w-[40px]">
                            {sub.progress_percentage || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.has_photo && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">사진 O</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusDisplay.variant} className="text-xs">{statusDisplay.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(sub.created_at)}</TableCell>
                      <TableCell className="text-sm font-semibold text-right">{sub.total_points.toLocaleString()}P</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Link href={`/dashboard/cafe/status/detail/${sub.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs text-blue-600 border-blue-300 hover:bg-blue-50 font-medium">상세보기</Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(sub.id, sub.company_name)}
                            className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            리포트
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
          {submissions.length === 0 ? (
            <div className="text-center py-8 bg-white border rounded-lg">
              <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            submissions.map((sub) => {
              const statusDisplay = statusConfig[sub.status];
              const scriptStatus = scriptStatusConfig[sub.script_status || 'pending'];

              return (
                <div key={sub.id} className="bg-white border rounded-lg p-2.5 space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-xs truncate flex-1 min-w-0">{sub.company_name}</h3>
                    <Badge variant={statusDisplay.variant} className="text-[10px] px-1.5 py-0.5 flex-shrink-0">{statusDisplay.label}</Badge>
                  </div>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{scriptStatus.label}</Badge>
                    {sub.script_status === 'completed' && sub.script_url && (
                      <a href={sub.script_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-teal-600">
                        <FileSpreadsheet className="h-2.5 w-2.5" />구글시트 열기
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">카페 수</p>
                      <p className="text-xs font-medium">{sub.cafe_details?.length || 0}개</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">발행 건수</p>
                      <p className="text-xs font-medium">{sub.total_count || 0}건</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-500 mb-0.5">진행률</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-orange-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${sub.progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-orange-600 min-w-[32px] text-right">
                          {sub.progress_percentage || 0}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">접수일</p>
                      <p className="text-xs font-medium">{formatDate(sub.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">비용</p>
                      <p className="text-xs font-semibold text-orange-600">{sub.total_points.toLocaleString()}P</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <Link href={`/dashboard/cafe/status/detail/${sub.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-[11px] h-7 text-blue-600 border-blue-300 hover:bg-blue-50 font-medium px-2">상세보기</Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(sub.id, sub.company_name)}
                      className="flex-1 text-[11px] h-7 px-2 text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      리포트
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
