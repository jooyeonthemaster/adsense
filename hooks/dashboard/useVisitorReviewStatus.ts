import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import type { ReceiptReviewSubmission, SortBy } from '@/components/dashboard/visitor-review/types';

export function useVisitorReviewStatus() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ReceiptReviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ReceiptReviewSubmission | null>(null);
  const [agreedToCancel, setAgreedToCancel] = useState(false);
  const [asConditionDialogOpen, setAsConditionDialogOpen] = useState(false);

  // Download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

      // Refresh the page to update points in header
      router.refresh();

      setCancelDialogOpen(false);
      setSelectedSubmission(null);
      setAgreedToCancel(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Cancel request error:', error);
      alert(error instanceof Error ? error.message : '중단 신청에 실패했습니다.');
    }
  };

  const handleDownloadReport = async (submission: ReceiptReviewSubmission) => {
    setDownloadingId(submission.id);
    try {
      const response = await fetch(`/api/submissions/receipt/${submission.id}/content`);
      if (!response.ok) throw new Error('데이터를 가져오는데 실패했습니다.');

      const data = await response.json();
      const contentItems = data.items || [];

      if (contentItems.length === 0) {
        alert('다운로드할 리포트 데이터가 없습니다. 관리자가 리포트를 등록한 후 다운로드할 수 있습니다.');
        return;
      }

      const excelData = contentItems.map((item: {
        script_text: string | null;
        review_registered_date: string | null;
        receipt_date: string | null;
        review_status: string;
        review_link: string | null;
        review_id: string | null;
      }) => ({
        '접수번호': submission.submission_number || '',
        '업체명': submission.company_name || '',
        '리뷰원고': item.script_text || '',
        '리뷰등록날짜': item.review_registered_date || '',
        '영수증날짜': item.receipt_date || '',
        '상태': item.review_status === 'approved' ? '승인됨' : item.review_status === 'revision_requested' ? '수정요청' : '대기',
        '리뷰링크': item.review_link || '',
        '리뷰아이디': item.review_id || '',
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '방문자리뷰');

      ws['!cols'] = [
        { wch: 18 }, // 접수번호
        { wch: 20 }, // 업체명
        { wch: 60 }, // 리뷰원고
        { wch: 14 }, // 리뷰등록날짜
        { wch: 14 }, // 영수증날짜
        { wch: 10 }, // 상태
        { wch: 45 }, // 리뷰링크
        { wch: 18 }, // 리뷰아이디
      ];

      XLSX.writeFile(wb, `방문자리뷰_${submission.company_name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error('Download error:', error);
      alert(error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloadingId(null);
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

    const actualCount = submission.actual_count_total || 0;
    return submission.total_count > 0
      ? Math.round((actualCount / submission.total_count) * 100)
      : 0;
  };

  const canCancel = (submission: ReceiptReviewSubmission) => {
    return ['pending', 'in_progress'].includes(submission.status);
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    in_progress: submissions.filter((s) => s.status === 'in_progress').length,
    completed: submissions.filter((s) => s.status === 'completed').length,
  };

  return {
    // State
    submissions,
    loading,
    searchQuery,
    statusFilter,
    sortBy,
    downloadingId,
    stats,

    // Cancel dialog
    cancelDialogOpen,
    selectedSubmission,
    agreedToCancel,
    asConditionDialogOpen,

    // Setters
    setSearchQuery,
    setStatusFilter,
    setSortBy,
    setCancelDialogOpen,
    setAgreedToCancel,
    setAsConditionDialogOpen,

    // Handlers
    handleCancelClick,
    handleConfirmCancel,
    handleDownloadReport,

    // Utilities
    formatDate,
    extractMid,
    calculateProgress,
    canCancel,
  };
}
