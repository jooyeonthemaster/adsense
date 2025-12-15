import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type {
  PlaceSubmission,
  RewardStats,
  GroupedData,
  ViewMode,
  GroupByType,
} from '@/components/admin/reward-management/types';

export function useRewardManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<PlaceSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupBy, setGroupBy] = useState<GroupByType>('client');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [createdDateFilter, setCreatedDateFilter] = useState<Date | undefined>();
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/reward');
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching reward submissions:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '데이터를 불러오는데 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/reward/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast({
        title: '상태 변경 완료',
        description: '접수 상태가 변경되었습니다.',
      });

      await fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '상태 변경 중 오류가 발생했습니다.',
      });
    }
  };

  const copyToClipboard = async (submissionNumber: string) => {
    try {
      await navigator.clipboard.writeText(submissionNumber);
      setCopiedId(submissionNumber);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.place_mid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.clients?.company_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

      // 접수일 필터
      let matchesCreatedDate = true;
      if (createdDateFilter) {
        const filterStart = new Date(createdDateFilter);
        filterStart.setHours(0, 0, 0, 0);
        const filterEnd = new Date(createdDateFilter);
        filterEnd.setHours(23, 59, 59, 999);
        const createdAt = new Date(sub.created_at);
        matchesCreatedDate = createdAt >= filterStart && createdAt <= filterEnd;
      }

      // 구동일 필터 (선택한 날짜가 구동 기간 내에 포함되는지 확인)
      let matchesStartDate = true;
      if (startDateFilter) {
        const selectedDate = new Date(startDateFilter);
        selectedDate.setHours(0, 0, 0, 0);

        // 구동 시작일
        const runStartDate = sub.start_date ? new Date(sub.start_date) : new Date(sub.created_at);
        runStartDate.setHours(0, 0, 0, 0);

        // 구동 종료일 = 시작일 + (구동일수 - 1)
        const runEndDate = new Date(runStartDate);
        runEndDate.setDate(runEndDate.getDate() + (sub.total_days || 1) - 1);
        runEndDate.setHours(23, 59, 59, 999);

        // 선택한 날짜가 구동 기간 내에 있는지 확인
        matchesStartDate = selectedDate >= runStartDate && selectedDate <= runEndDate;
      }

      return matchesSearch && matchesStatus && matchesCreatedDate && matchesStartDate;
    });
  }, [submissions, searchQuery, statusFilter, createdDateFilter, startDateFilter]);

  const groupedData = useMemo((): GroupedData[] | null => {
    if (viewMode === 'list') return null;

    const groups = new Map<string, PlaceSubmission[]>();

    filteredSubmissions.forEach((sub) => {
      const key = sub.clients?.company_name || '거래처 없음';

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(sub);
    });

    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
      totalCost: items.reduce((sum, item) => sum + item.total_points, 0),
      count: items.length,
      inProgress: items.filter(i => ['pending', 'in_progress', 'approved'].includes(i.status)).length,
      completed: items.filter(i => i.status === 'completed').length,
    }));
  }, [viewMode, filteredSubmissions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const stats: RewardStats = useMemo(() => ({
    total: submissions.length,
    in_progress: submissions.filter(s => s.status === 'in_progress' || s.status === 'approved').length,
    completed: submissions.filter(s => s.status === 'completed').length,
    total_cost: submissions.reduce((sum, s) => sum + s.total_points, 0),
  }), [submissions]);

  return {
    loading,
    submissions,
    searchQuery,
    statusFilter,
    copiedId,
    viewMode,
    groupBy,
    expandedGroups,
    createdDateFilter,
    startDateFilter,
    filteredSubmissions,
    groupedData,
    stats,

    setSearchQuery,
    setStatusFilter,
    setViewMode,
    setGroupBy,
    setCreatedDateFilter,
    setStartDateFilter,

    fetchSubmissions,
    handleStatusChange,
    copyToClipboard,
    toggleGroup,
    formatDate,
  };
}
