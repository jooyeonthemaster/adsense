import { useState, useMemo } from 'react';
import type {
  KakaomapSubmission,
  GroupedData,
  KakaomapStats,
  GroupByType,
  ContentFilter,
} from '@/components/admin/kakaomap-management/types';

export function useKakaomapManagement(submissions: KakaomapSubmission[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [groupBy, setGroupBy] = useState<GroupByType>('list');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createdDateFilter, setCreatedDateFilter] = useState<Date | undefined>();
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>();

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
        sub.clients?.company_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

      let matchesContent = true;
      if (contentFilter === 'needs_upload') {
        matchesContent = sub.content_items_count < sub.total_count;
      } else if (contentFilter === 'needs_review') {
        matchesContent = sub.status === 'review';
      } else if (contentFilter === 'has_messages') {
        matchesContent = sub.unread_messages_count > 0;
      } else if (contentFilter === 'has_revision') {
        matchesContent = sub.pending_revision_count > 0;
      }

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

      return matchesSearch && matchesStatus && matchesContent && matchesCreatedDate && matchesStartDate;
    });
  }, [submissions, searchQuery, statusFilter, contentFilter, createdDateFilter, startDateFilter]);

  const groupedData = useMemo((): GroupedData[] | null => {
    if (groupBy === 'list') return null;

    const groups = new Map<string, KakaomapSubmission[]>();
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
      inProgress: items.filter(i => ['pending', 'waiting_content', 'in_progress', 'review'].includes(i.status)).length,
      completed: items.filter(i => i.status === 'completed').length,
      needsUpload: items.filter(i => i.content_items_count < i.total_count).length,
      unreadMessages: items.reduce((sum, i) => sum + i.unread_messages_count, 0),
    }));
  }, [groupBy, filteredSubmissions]);

  const stats: KakaomapStats = useMemo(() => ({
    total: submissions.length,
    needs_upload: submissions.filter((s) => s.content_items_count < s.total_count).length,
    needs_review: submissions.filter((s) => s.status === 'review').length,
    in_progress: submissions.filter((s) => ['pending', 'waiting_content', 'in_progress'].includes(s.status)).length,
    completed: submissions.filter((s) => s.status === 'completed').length,
    total_cost: submissions.reduce((sum, s) => sum + s.total_points, 0),
    unread_messages: submissions.reduce((sum, s) => sum + s.unread_messages_count, 0),
  }), [submissions]);

  const getProgressPercentage = (sub: KakaomapSubmission) => {
    return Math.round(((sub.completed_count || 0) / sub.total_count) * 100);
  };

  const getProgressBarWidth = (sub: KakaomapSubmission) => {
    return Math.min(getProgressPercentage(sub), 100);
  };

  return {
    // State
    searchQuery,
    statusFilter,
    contentFilter,
    groupBy,
    expandedGroups,
    copiedId,
    createdDateFilter,
    startDateFilter,

    // Setters
    setSearchQuery,
    setStatusFilter,
    setContentFilter,
    setGroupBy,
    setCreatedDateFilter,
    setStartDateFilter,

    // Data
    filteredSubmissions,
    groupedData,
    stats,

    // Handlers
    copyToClipboard,
    toggleGroup,
    getProgressPercentage,
    getProgressBarWidth,
  };
}
