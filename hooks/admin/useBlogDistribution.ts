'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import type {
  SubmissionWithClient,
  FilterState,
  ViewMode,
  GroupByMode,
  GroupedItem,
  Stats,
  BlogDistributionDailyRecord,
} from '@/components/admin/blog-distribution/types';
import { TYPE_CONFIG, INITIAL_FILTER_STATE, INITIAL_DAILY_RECORD_FORM } from '@/components/admin/blog-distribution/constants';

interface UseBlogDistributionReturn {
  // 데이터
  submissions: SubmissionWithClient[];
  filteredSubmissions: SubmissionWithClient[];
  loading: boolean;
  stats: Stats;
  groupedData: GroupedItem[];

  // 필터 상태
  filters: FilterState;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: string) => void;
  setStatusFilter: (status: string) => void;
  setCreatedDateFilter: (date: Date | null) => void;
  setStartDateFilter: (date: Date | null) => void;
  resetFilters: () => void;

  // 뷰 모드
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  groupBy: GroupByMode;
  setGroupBy: (mode: GroupByMode) => void;
  expandedGroups: Set<string>;
  toggleGroup: (groupName: string) => void;

  // 다이얼로그 상태
  statusDialogOpen: boolean;
  setStatusDialogOpen: (open: boolean) => void;
  dailyRecordDialogOpen: boolean;
  setDailyRecordDialogOpen: (open: boolean) => void;
  selectedSubmission: SubmissionWithClient | null;
  newStatus: string;
  setNewStatus: (status: string) => void;

  // 일일 기록
  dailyRecords: BlogDistributionDailyRecord[];
  recordDate: string;
  setRecordDate: (date: string) => void;
  completedCount: number;
  setCompletedCount: (count: number) => void;
  recordNotes: string;
  setRecordNotes: (notes: string) => void;

  // 복사 상태
  copiedId: string | null;
  copyToClipboard: (submissionNumber: string) => Promise<void>;

  // 핸들러
  fetchSubmissions: () => Promise<void>;
  handleStatusChange: (submission: SubmissionWithClient) => void;
  handleStatusUpdate: () => Promise<void>;
  handleDailyRecordOpen: (submission: SubmissionWithClient) => Promise<void>;
  handleSaveDailyRecord: () => Promise<void>;

  // 유틸리티
  formatDate: (dateString: string) => string;
}

export function useBlogDistribution(): UseBlogDistributionReturn {
  // 데이터 상태
  const [submissions, setSubmissions] = useState<SubmissionWithClient[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState(INITIAL_FILTER_STATE.searchQuery);
  const [typeFilter, setTypeFilter] = useState(INITIAL_FILTER_STATE.typeFilter);
  const [statusFilter, setStatusFilter] = useState(INITIAL_FILTER_STATE.statusFilter);
  const [createdDateFilter, setCreatedDateFilter] = useState<Date | null>(INITIAL_FILTER_STATE.createdDateFilter);
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(INITIAL_FILTER_STATE.startDateFilter);

  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupBy, setGroupBy] = useState<GroupByMode>('client');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 다이얼로그 상태
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [dailyRecordDialogOpen, setDailyRecordDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithClient | null>(null);
  const [newStatus, setNewStatus] = useState('');

  // 일일 기록 상태
  const [dailyRecords, setDailyRecords] = useState<BlogDistributionDailyRecord[]>([]);
  const [recordDate, setRecordDate] = useState(INITIAL_DAILY_RECORD_FORM.recordDate);
  const [completedCount, setCompletedCount] = useState(INITIAL_DAILY_RECORD_FORM.completedCount);
  const [recordNotes, setRecordNotes] = useState(INITIAL_DAILY_RECORD_FORM.recordNotes);

  // 복사 상태
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 필터 객체
  const filters: FilterState = {
    searchQuery,
    typeFilter,
    statusFilter,
    createdDateFilter,
    startDateFilter,
  };

  // 데이터 fetch
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/blog-distribution');
      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 필터 적용
  const applyFilters = useCallback(() => {
    let filtered = [...submissions];

    if (typeFilter !== 'all') {
      filtered = filtered.filter((s) => s.distribution_type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.company_name.toLowerCase().includes(query) ||
          s.clients?.company_name?.toLowerCase().includes(query)
      );
    }

    // 접수일 필터
    if (createdDateFilter) {
      const filterDateStr = format(createdDateFilter, 'yyyy-MM-dd');
      filtered = filtered.filter((s) => {
        const createdDateStr = s.created_at.split('T')[0];
        return createdDateStr === filterDateStr;
      });
    }

    // 구동일 필터
    if (startDateFilter) {
      const filterDateStr = format(startDateFilter, 'yyyy-MM-dd');
      filtered = filtered.filter((s) => {
        if (!s.start_date) return false;
        const startDateStr = s.start_date.split('T')[0];
        const endDateStr = s.end_date ? s.end_date.split('T')[0] : null;

        if (endDateStr) {
          return filterDateStr >= startDateStr && filterDateStr <= endDateStr;
        }
        return filterDateStr >= startDateStr;
      });
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setFilteredSubmissions(filtered);
  }, [submissions, searchQuery, typeFilter, statusFilter, createdDateFilter, startDateFilter]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setSearchQuery(INITIAL_FILTER_STATE.searchQuery);
    setTypeFilter(INITIAL_FILTER_STATE.typeFilter);
    setStatusFilter(INITIAL_FILTER_STATE.statusFilter);
    setCreatedDateFilter(INITIAL_FILTER_STATE.createdDateFilter);
    setStartDateFilter(INITIAL_FILTER_STATE.startDateFilter);
  }, []);

  // 그룹 토글
  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  }, []);

  // 클립보드 복사
  const copyToClipboard = useCallback(async (submissionNumber: string) => {
    try {
      await navigator.clipboard.writeText(submissionNumber);
      setCopiedId(submissionNumber);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  // 상태 변경 다이얼로그 열기
  const handleStatusChange = useCallback((submission: SubmissionWithClient) => {
    setSelectedSubmission(submission);
    setNewStatus(submission.status);
    setStatusDialogOpen(true);
  }, []);

  // 상태 업데이트
  const handleStatusUpdate = useCallback(async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/admin/blog-distribution/${selectedSubmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed');

      alert('상태가 변경되었습니다.');
      setStatusDialogOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  }, [selectedSubmission, newStatus, fetchSubmissions]);

  // 일일 기록 다이얼로그 열기
  const handleDailyRecordOpen = useCallback(async (submission: SubmissionWithClient) => {
    setSelectedSubmission(submission);
    setRecordDate(new Date().toISOString().split('T')[0]);
    setCompletedCount(0);
    setRecordNotes('');

    try {
      const response = await fetch(`/api/admin/blog-distribution/${submission.id}/daily-records`);
      if (response.ok) {
        const data = await response.json();
        setDailyRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching daily records:', error);
    }

    setDailyRecordDialogOpen(true);
  }, []);

  // 일일 기록 저장
  const handleSaveDailyRecord = useCallback(async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/admin/blog-distribution/${selectedSubmission.id}/daily-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_date: recordDate,
          completed_count: completedCount,
          notes: recordNotes,
        }),
      });

      if (!response.ok) throw new Error('Failed');

      alert('일일 기록이 저장되었습니다.');
      setDailyRecordDialogOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error saving daily record:', error);
      alert('일일 기록 저장 중 오류가 발생했습니다.');
    }
  }, [selectedSubmission, recordDate, completedCount, recordNotes, fetchSubmissions]);

  // 날짜 포맷
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, []);

  // 통계 계산
  const stats: Stats = useMemo(() => ({
    total: filteredSubmissions.length,
    pending: filteredSubmissions.filter((s) => s.status === 'pending').length,
    in_progress: filteredSubmissions.filter((s) => s.status === 'approved').length,
    completed: filteredSubmissions.filter((s) => s.status === 'completed').length,
  }), [filteredSubmissions]);

  // 그룹 데이터 계산
  const groupedData: GroupedItem[] = useMemo(() => {
    const groups = new Map<string, SubmissionWithClient[]>();

    filteredSubmissions.forEach((sub) => {
      const key = groupBy === 'client'
        ? sub.clients?.company_name || '거래처 없음'
        : TYPE_CONFIG[sub.distribution_type].label;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(sub);
    });

    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
      totalCount: items.reduce((sum, item) => sum + item.total_count, 0),
      count: items.length,
      inProgress: items.filter((i) => ['pending', 'in_progress'].includes(i.status)).length,
      completed: items.filter((i) => i.status === 'completed').length,
    }));
  }, [filteredSubmissions, groupBy]);

  // Effects
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    // 데이터
    submissions,
    filteredSubmissions,
    loading,
    stats,
    groupedData,

    // 필터 상태
    filters,
    setSearchQuery,
    setTypeFilter,
    setStatusFilter,
    setCreatedDateFilter,
    setStartDateFilter,
    resetFilters,

    // 뷰 모드
    viewMode,
    setViewMode,
    groupBy,
    setGroupBy,
    expandedGroups,
    toggleGroup,

    // 다이얼로그 상태
    statusDialogOpen,
    setStatusDialogOpen,
    dailyRecordDialogOpen,
    setDailyRecordDialogOpen,
    selectedSubmission,
    newStatus,
    setNewStatus,

    // 일일 기록
    dailyRecords,
    recordDate,
    setRecordDate,
    completedCount,
    setCompletedCount,
    recordNotes,
    setRecordNotes,

    // 복사 상태
    copiedId,
    copyToClipboard,

    // 핸들러
    fetchSubmissions,
    handleStatusChange,
    handleStatusUpdate,
    handleDailyRecordOpen,
    handleSaveDailyRecord,

    // 유틸리티
    formatDate,
  };
}
