import { useState, useEffect, useMemo } from 'react';
import type {
  ReceiptReviewSubmission,
  GroupedData,
  VisitorReviewStats,
  GroupByType,
} from '@/components/admin/visitor-review-management/types';

export function useVisitorReviewManagement() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<ReceiptReviewSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<GroupByType>('list');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createdDateFilter, setCreatedDateFilter] = useState<Date | undefined>();
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/review-marketing/visitor');
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching visitor reviews:', error);
    } finally {
      setLoading(false);
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

  const getProgressPercentage = (sub: ReceiptReviewSubmission) => {
    if (sub.progress_percentage !== undefined) {
      return sub.progress_percentage;
    }
    if (sub.total_count === 0) return 0;
    const contentCount = sub.content_items_count || sub.actual_count_total || 0;
    const rawProgress = (contentCount / sub.total_count) * 100;
    return contentCount > 0
      ? Math.max(1, Math.min(Math.round(rawProgress), 100))
      : 0;
  };

  const getProgressBarWidth = (sub: ReceiptReviewSubmission) => {
    return Math.min(getProgressPercentage(sub), 100);
  };

  const getDeadline = (sub: ReceiptReviewSubmission) => {
    const startDate = new Date(sub.created_at);
    const estimatedDays = Math.ceil(sub.total_count / sub.daily_count);
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + estimatedDays);
    return deadline.toLocaleDateString('ko-KR');
  };

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/review-marketing/visitor/${submissionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.clients?.company_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

      let matchesCreatedDate = true;
      if (createdDateFilter) {
        const filterStart = new Date(createdDateFilter);
        filterStart.setHours(0, 0, 0, 0);
        const filterEnd = new Date(createdDateFilter);
        filterEnd.setHours(23, 59, 59, 999);
        const createdAt = new Date(sub.created_at);
        matchesCreatedDate = createdAt >= filterStart && createdAt <= filterEnd;
      }

      let matchesStartDate = true;
      if (startDateFilter) {
        const selectedDate = new Date(startDateFilter);
        selectedDate.setHours(0, 0, 0, 0);

        const runStartDate = new Date(sub.created_at);
        runStartDate.setHours(0, 0, 0, 0);

        const estimatedDays = Math.ceil(sub.total_count / sub.daily_count);
        const runEndDate = new Date(runStartDate);
        runEndDate.setDate(runEndDate.getDate() + estimatedDays - 1);
        runEndDate.setHours(23, 59, 59, 999);

        matchesStartDate = selectedDate >= runStartDate && selectedDate <= runEndDate;
      }

      return matchesSearch && matchesStatus && matchesCreatedDate && matchesStartDate;
    });
  }, [submissions, searchQuery, statusFilter, createdDateFilter, startDateFilter]);

  const groupedData = useMemo((): GroupedData[] | null => {
    if (groupBy === 'list') return null;

    const groups = new Map<string, ReceiptReviewSubmission[]>();
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
      inProgress: items.filter(i => ['pending', 'approved'].includes(i.status)).length,
      completed: items.filter(i => i.status === 'completed').length,
    }));
  }, [groupBy, filteredSubmissions]);

  const stats: VisitorReviewStats = useMemo(() => ({
    total: submissions.length,
    in_progress: submissions.filter((s) => ['pending', 'approved', 'in_progress'].includes(s.status)).length,
    completed: submissions.filter((s) => s.status === 'completed').length,
    total_cost: submissions.reduce((sum, s) => sum + s.total_points, 0),
  }), [submissions]);

  return {
    loading,
    submissions,
    searchQuery,
    statusFilter,
    groupBy,
    expandedGroups,
    copiedId,
    createdDateFilter,
    startDateFilter,
    filteredSubmissions,
    groupedData,
    stats,

    setSearchQuery,
    setStatusFilter,
    setGroupBy,
    setCreatedDateFilter,
    setStartDateFilter,

    copyToClipboard,
    toggleGroup,
    getProgressPercentage,
    getProgressBarWidth,
    getDeadline,
    handleStatusChange,
    fetchSubmissions,
  };
}
