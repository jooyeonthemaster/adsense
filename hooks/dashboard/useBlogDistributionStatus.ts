import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { BlogDistribution, BlogDistributionStats } from '@/components/dashboard/blog-distribution-status/types';
import * as XLSX from 'xlsx';

export function useBlogDistributionStatus() {
  const router = useRouter();
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

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

  // 상태 한글 변환 함수
  const getStatusLabel = (status: string | null | undefined) => {
    if (!status) return '대기';
    switch (status) {
      case 'approved': return '승인됨';
      case 'revision_requested': return '수정요청';
      case 'pending':
      default: return '대기';
    }
  };

  // 배포 타입별 시트명
  const getSheetName = (distributionType: string) => {
    switch (distributionType) {
      case 'reviewer': return '리뷰어배포';
      case 'video': return '영상배포';
      case 'automation': return '자동화배포';
      default: return '블로그배포';
    }
  };

  // 리포트 다운로드 함수
  const handleDownloadReport = async (submission: BlogDistribution) => {
    setDownloadingId(submission.id);
    try {
      const response = await fetch(`/api/submissions/blog/${submission.id}/content`);
      if (!response.ok) {
        throw new Error('데이터를 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      const contentItems = data.items || [];

      if (contentItems.length === 0) {
        toast({
          variant: 'destructive',
          title: '다운로드 불가',
          description: '리포트 다운로드 기능은 관리자가 리포트를 등록한 후 사용 가능합니다.',
        });
        return;
      }

      // 네이버 리뷰 형식에 맞춘 새 엑셀 형식
      const excelData = contentItems.map((item: { blog_url?: string; blog_title?: string; published_date?: string; status?: string; blog_id?: string }) => ({
        '접수번호': submission.submission_number || '',
        '업체명': submission.company_name || '',
        '작성제목': item.blog_title || '',
        '발행일': item.published_date || '',
        '상태': getStatusLabel(item.status),
        '블로그링크': item.blog_url || '',
        '블로그아이디': item.blog_id || '',
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 18 },  // 접수번호
        { wch: 20 },  // 업체명
        { wch: 40 },  // 작성제목
        { wch: 12 },  // 발행일
        { wch: 10 },  // 상태
        { wch: 50 },  // 블로그링크
        { wch: 20 },  // 블로그아이디
      ];

      const wb = XLSX.utils.book_new();
      const sheetName = getSheetName(submission.distribution_type);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `블로그배포_${submission.submission_number}_${submission.company_name}_${today}.xlsx`);

      toast({
        title: '다운로드 완료',
        description: `${contentItems.length}건의 콘텐츠가 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: '다운로드 실패',
        description: error instanceof Error ? error.message : '리포트 다운로드 중 오류가 발생했습니다.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

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

      // Refresh the page to update points in header
      router.refresh();

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

  const stats: BlogDistributionStats = {
    total: filteredSubmissions.length,
    in_progress: filteredSubmissions.filter((s) => ['pending', 'in_progress'].includes(s.status)).length,
    completed: filteredSubmissions.filter((s) => s.status === 'completed').length,
  };

  return {
    loading,
    submissions,
    filteredSubmissions,
    searchQuery,
    typeFilter,
    statusFilter,
    sortBy,
    cancelDialogOpen,
    selectedSubmission,
    agreedToCancel,
    asConditionDialogOpen,
    downloadingId,
    cancelLoading,
    stats,

    setSearchQuery,
    setTypeFilter,
    setStatusFilter,
    setSortBy,
    setCancelDialogOpen,
    setAgreedToCancel,
    setAsConditionDialogOpen,

    fetchSubmissions,
    handleCancelClick,
    handleDownloadReport,
    handleConfirmCancel,
    formatDate,
    canCancel,
  };
}
