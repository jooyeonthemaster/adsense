import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import type {
  PlaceSubmission,
  RewardStats,
  GroupedData,
  ViewMode,
  GroupByType,
  MediaTypeFilter,
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
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>('all');

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

      // 매체 타입 필터 (투플/유레카)
      const matchesMediaType = mediaTypeFilter === 'all' ||
        (sub.media_type || 'twoople') === mediaTypeFilter;

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

      return matchesSearch && matchesStatus && matchesMediaType && matchesCreatedDate && matchesStartDate;
    });
  }, [submissions, searchQuery, statusFilter, mediaTypeFilter, createdDateFilter, startDateFilter]);

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

  const exportToExcel = () => {
    const MEDIA_TYPE_LABELS: Record<string, string> = {
      twoople: '투플',
      eureka: '블루',
    };

    const STATUS_LABELS: Record<string, string> = {
      pending: '확인중',
      approved: '접수완료',
      in_progress: '구동중',
      completed: '완료',
      cancelled: '중단됨',
      as_in_progress: 'AS 진행 중',
      cancellation_requested: '중단요청',
    };

    const formatDateForExcel = (dateStr?: string | null) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    const excelData = filteredSubmissions.map((sub) => ({
      접수번호: sub.submission_number || '-',
      매체: MEDIA_TYPE_LABELS[sub.media_type || 'twoople'] || sub.media_type || '-',
      업체명: sub.company_name || '-',
      거래처: sub.clients?.company_name || '-',
      MID: sub.place_mid || '-',
      URL: sub.place_url || '-',
      일접수량: sub.daily_count,
      구동일수: sub.total_days,
      진행률: sub.progress_percentage !== undefined ? `${Math.round(sub.progress_percentage)}%` : '-',
      상태: STATUS_LABELS[sub.status] || sub.status,
      접수일: formatDateForExcel(sub.created_at),
      시작일: formatDateForExcel(sub.start_date),
      비용: sub.total_points,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '리워드 관리');

    const colCount = Object.keys(excelData[0] || {}).length;
    worksheet['!cols'] = Array(colCount).fill({ wch: 15 });

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `리워드관리_${timestamp}.xlsx`);
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
    mediaTypeFilter,
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
    setMediaTypeFilter,
    setViewMode,
    setGroupBy,
    setCreatedDateFilter,
    setStartDateFilter,

    fetchSubmissions,
    handleStatusChange,
    copyToClipboard,
    toggleGroup,
    formatDate,
    exportToExcel,
  };
}
