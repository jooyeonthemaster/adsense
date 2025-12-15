import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { RewardSubmission, RewardStatus } from '@/components/dashboard/reward-status';

export function useRewardStatus() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<RewardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RewardStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [agreedToCancel, setAgreedToCancel] = useState(false);
  const [asConditionDialogOpen, setAsConditionDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

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
      const response = await fetch(`/api/submissions/reward/${selectedSubmission}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '중단 처리 중 오류가 발생했습니다.');
      }

      toast({
        title: '✅ 중단 신청 완료',
        description: '리워드는 환불이 진행되지 않습니다.',
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
      } else {
        // sortBy === 'cost'
        return b.total_points - a.total_points;
      }
    });

  // 통계 계산
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    in_progress: submissions.filter(s => s.status === 'in_progress' || s.status === 'approved').length,
    completed: submissions.filter(s => s.status === 'completed').length,
  };

  return {
    submissions,
    loading,
    searchQuery,
    statusFilter,
    sortBy,
    cancelDialogOpen,
    selectedSubmission,
    agreedToCancel,
    asConditionDialogOpen,
    cancelLoading,
    filteredSubmissions,
    stats,
    setSearchQuery,
    setStatusFilter,
    setSortBy,
    setCancelDialogOpen,
    setAgreedToCancel,
    setAsConditionDialogOpen,
    handleCancelClick,
    handleConfirmCancel,
    formatDate,
  };
}
