'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, CalendarIcon, FileText, Video, Zap, Users, List, Grid3x3, Building2, ChevronDown, X, Copy, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { BlogDistributionSubmission, BlogDistributionDailyRecord } from '@/types/database';

interface SubmissionWithClient extends BlogDistributionSubmission {
  clients?: {
    company_name: string;
  };
  submission_number?: string;
  progress_percentage?: number;
  completed_count?: number;
}

const typeConfig = {
  video: { label: '영상', icon: Video, color: 'bg-blue-500' },
  automation: { label: '자동화', icon: Zap, color: 'bg-emerald-500' },
  reviewer: { label: '리뷰어', icon: Users, color: 'bg-amber-500' },
};

const statusConfig = {
  pending: { label: '확인중', color: 'bg-gray-100 text-gray-800' },
  approved: { label: '승인됨', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '구동중', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '중단', color: 'bg-red-100 text-red-800' },
  as_in_progress: { label: 'AS 진행 중', color: 'bg-amber-100 text-amber-800' },
};

export default function AdminBlogDistributionPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithClient[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (submissionNumber: string) => {
    try {
      await navigator.clipboard.writeText(submissionNumber);
      setCopiedId(submissionNumber);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createdDateFilter, setCreatedDateFilter] = useState<Date | null>(null); // 접수일 필터
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null); // 구동일 필터

  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [groupBy, setGroupBy] = useState<'client' | 'type'>('client');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  // 다이얼로그 상태
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [dailyRecordDialogOpen, setDailyRecordDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithClient | null>(null);
  const [newStatus, setNewStatus] = useState('');

  // 일일 기록 상태
  const [dailyRecords, setDailyRecords] = useState<BlogDistributionDailyRecord[]>([]);
  const [recordDate, setRecordDate] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const [recordNotes, setRecordNotes] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [submissions, searchQuery, typeFilter, statusFilter, createdDateFilter, startDateFilter]);

  const fetchSubmissions = async () => {
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
  };

  const applyFilters = () => {
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

    // 구동일 필터 - 선택한 날짜가 구동 기간(start_date ~ end_date) 내에 있는지 확인
    if (startDateFilter) {
      const filterDateStr = format(startDateFilter, 'yyyy-MM-dd');
      filtered = filtered.filter((s) => {
        if (!s.start_date) return false;
        const startDateStr = s.start_date.split('T')[0];
        const endDateStr = s.end_date ? s.end_date.split('T')[0] : null;

        // 필터 날짜가 start_date ~ end_date 범위 내에 있는지 확인
        if (endDateStr) {
          return filterDateStr >= startDateStr && filterDateStr <= endDateStr;
        }
        // end_date가 없으면 start_date 이후인지만 확인
        return filterDateStr >= startDateStr;
      });
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setFilteredSubmissions(filtered);
  };

  const handleStatusChange = (submission: SubmissionWithClient) => {
    setSelectedSubmission(submission);
    setNewStatus(submission.status);
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
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
  };

  const handleDailyRecordOpen = async (submission: SubmissionWithClient) => {
    setSelectedSubmission(submission);
    setRecordDate(new Date().toISOString().split('T')[0]);
    setCompletedCount(0);
    setRecordNotes('');

    // 기존 일일 기록 조회
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
  };

  const handleSaveDailyRecord = async () => {
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
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getTotalCompleted = (submissionId: string) => {
    return dailyRecords
      .filter((r) => r.submission_id === submissionId)
      .reduce((sum, r) => sum + r.completed_count, 0);
  };

  // 그룹핑 데이터 생성
  const groupedData = () => {
    const groups = new Map<string, SubmissionWithClient[]>();

    filteredSubmissions.forEach((sub) => {
      const key = groupBy === 'client'
        ? sub.clients?.company_name || '거래처 없음'
        : typeConfig[sub.distribution_type].label;

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
      inProgress: items.filter(i => ['pending', 'in_progress'].includes(i.status)).length,
      completed: items.filter(i => i.status === 'completed').length,
    }));
  };

  const stats = {
    total: filteredSubmissions.length,
    pending: filteredSubmissions.filter((s) => s.status === 'pending').length,
    in_progress: filteredSubmissions.filter((s) => s.status === 'approved').length,
    completed: filteredSubmissions.filter((s) => s.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="space-y-3 sm:space-y-4">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">블로그 배포 관리</h1>
          </div>
          <p className="text-[11px] sm:text-sm text-sky-100 truncate">영상/자동화/리뷰어 배포 접수 관리</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card>
            <CardHeader className="pb-2 p-2.5 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs text-gray-500">총 접수</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 pt-0">
              <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-2.5 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs text-gray-500">확인중</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 pt-0">
              <p className="text-lg sm:text-xl font-bold text-gray-700">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-2.5 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs text-sky-600">구동중</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 pt-0">
              <p className="text-lg sm:text-xl font-bold text-sky-600">{stats.in_progress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-2.5 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs text-green-600">완료</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 pt-0">
              <p className="text-lg sm:text-xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* 필터 */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="업체명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs sm:text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-24 sm:w-28 h-8 text-xs sm:text-sm">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="video">영상</SelectItem>
                <SelectItem value="automation">자동화</SelectItem>
                <SelectItem value="reviewer">리뷰어</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-24 sm:w-28 h-8 text-xs sm:text-sm">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">확인중</SelectItem>
                <SelectItem value="in_progress">구동중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">중단</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 필터 (접수일/구동일) */}
          <div className="flex flex-wrap gap-2">
            {/* 접수일 필터 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={createdDateFilter ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 text-xs sm:text-sm ${
                    createdDateFilter ? 'bg-sky-500 hover:bg-sky-600 text-white' : ''
                  }`}
                >
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                  {createdDateFilter
                    ? `접수일: ${format(createdDateFilter, 'M/d', { locale: ko })}`
                    : '접수일'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={createdDateFilter || undefined}
                  onSelect={(date) => setCreatedDateFilter(date || null)}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {createdDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreatedDateFilter(null)}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* 구동일 필터 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={startDateFilter ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 text-xs sm:text-sm ${
                    startDateFilter ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''
                  }`}
                >
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                  {startDateFilter
                    ? `구동일: ${format(startDateFilter, 'M/d', { locale: ko })}`
                    : '구동일'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDateFilter || undefined}
                  onSelect={(date) => setStartDateFilter(date || null)}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {startDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStartDateFilter(null)}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* 필터 초기화 */}
            {(createdDateFilter || startDateFilter || typeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCreatedDateFilter(null);
                  setStartDateFilter(null);
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="h-8 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
              >
                전체 초기화
              </Button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 px-2 sm:px-3 text-xs"
              >
                <List className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                리스트
              </Button>
              <Button
                variant={viewMode === 'group' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('group')}
                className="h-7 px-2 sm:px-3 text-xs"
              >
                <Grid3x3 className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                그룹
              </Button>
            </div>

            {viewMode === 'group' && (
              <Select value={groupBy} onValueChange={(value: 'client' | 'type') => setGroupBy(value)}>
                <SelectTrigger className="w-32 h-7 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">거래처별</SelectItem>
                  <SelectItem value="type">타입별</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>접수번호</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>업체명</TableHead>
                  <TableHead>거래처</TableHead>
                  <TableHead className="text-center">일 배포</TableHead>
                  <TableHead className="text-center">총 수량</TableHead>
                  <TableHead>키워드</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-center">진행률</TableHead>
                  <TableHead>접수일</TableHead>
                  <TableHead className="text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-gray-500">
                      접수 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const typeInfo = typeConfig[sub.distribution_type];
                    const TypeIcon = typeInfo.icon;
                    const statusInfo = statusConfig[sub.status];

                    return (
                      <TableRow key={sub.id} className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = `/admin/blog-distribution/${sub.id}`}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {sub.submission_number ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">{sub.submission_number}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() => copyToClipboard(sub.submission_number!)}
                              >
                                {copiedId === sub.submission_number ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                              <TypeIcon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-medium">{typeInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{sub.company_name}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {sub.clients?.company_name || '-'}
                        </TableCell>
                        <TableCell className="text-center">{sub.daily_count}건</TableCell>
                        <TableCell className="text-center font-medium">{sub.total_count}건</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap max-w-xs">
                            {sub.keywords?.slice(0, 2).map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                            {(sub.keywords?.length || 0) > 2 && (
                              <span className="text-xs text-gray-500">+{(sub.keywords?.length || 0) - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(sub.progress_percentage || 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-blue-600 min-w-[40px]">
                              {sub.progress_percentage || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(sub.created_at)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/admin/blog-distribution/${sub.id}`}
                              className="text-xs text-blue-600 border-blue-300"
                            >
                              상세
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(sub)}
                              className="text-xs"
                            >
                              상태 변경
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-8 bg-white border rounded-lg">
                <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
              </div>
            ) : (
              filteredSubmissions.map((sub) => {
                const typeInfo = typeConfig[sub.distribution_type];
                const TypeIcon = typeInfo.icon;
                const statusInfo = statusConfig[sub.status];

                return (
                  <div key={sub.id} className="bg-white border rounded-lg p-2.5 space-y-2 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                            <TypeIcon className="h-2.5 w-2.5 mr-0.5" />
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <p className="font-semibold text-xs truncate">{sub.company_name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{sub.clients?.company_name || '-'}</p>
                        {sub.submission_number && (
                          <p className="text-[10px] font-mono text-blue-600">{sub.submission_number}</p>
                        )}
                      </div>
                      <Badge className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {sub.keywords && sub.keywords.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {sub.keywords.slice(0, 3).map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">일 배포/총 수량</p>
                        <p className="text-xs font-medium">{sub.daily_count}건 / {sub.total_count}건</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">진행률</p>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(sub.progress_percentage || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-blue-600">
                            {sub.progress_percentage || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-gray-500 mb-0.5">접수일</p>
                        <p className="text-xs font-medium">{formatDate(sub.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex gap-1 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/blog-distribution/${sub.id}`}
                        className="flex-1 text-[11px] h-7 text-blue-600 border-blue-300 px-2"
                      >
                        상세
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(sub)}
                        className="flex-1 text-[11px] h-7 px-2"
                      >
                        상태
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </>
        )}

        {/* Group View */}
        {viewMode === 'group' && (
          <div className="space-y-3">
            {groupedData().map((group) => (
              <Collapsible
                key={group.name}
                open={expandedGroups.has(group.name)}
                onOpenChange={() => toggleGroup(group.name)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm sm:text-base lg:text-lg truncate">{group.name}</CardTitle>
                            <CardDescription className="text-[10px] sm:text-xs truncate">
                              {group.count}개 • 진행중 {group.inProgress} • 완료 {group.completed}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm sm:text-lg lg:text-xl font-bold text-sky-600">{group.totalCount.toLocaleString()}건</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">총 배포 수량</p>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                              expandedGroups.has(group.name) ? 'transform rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>접수번호</TableHead>
                          <TableHead>타입</TableHead>
                          <TableHead>업체명</TableHead>
                          <TableHead className="text-center">일 배포</TableHead>
                          <TableHead className="text-center">총 수량</TableHead>
                          <TableHead>키워드</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead className="text-center">진행률</TableHead>
                          <TableHead>접수일</TableHead>
                          <TableHead className="text-center">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((sub) => {
                          const typeInfo = typeConfig[sub.distribution_type];
                          const TypeIcon = typeInfo.icon;
                          const statusInfo = statusConfig[sub.status];

                          return (
                            <TableRow key={sub.id} className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = `/admin/blog-distribution/${sub.id}`}>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                {sub.submission_number ? (
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-xs">{sub.submission_number}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => copyToClipboard(sub.submission_number!)}
                                    >
                                      {copiedId === sub.submission_number ? (
                                        <Check className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                                    <TypeIcon className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-sm font-medium">{typeInfo.label}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{sub.company_name}</TableCell>
                              <TableCell className="text-center">{sub.daily_count}건</TableCell>
                              <TableCell className="text-center font-medium">{sub.total_count}건</TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap max-w-xs">
                                  {sub.keywords?.slice(0, 2).map((kw, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {kw}
                                    </Badge>
                                  ))}
                                  {(sub.keywords?.length || 0) > 2 && (
                                    <span className="text-xs text-gray-500">+{(sub.keywords?.length || 0) - 2}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all"
                                      style={{ width: `${sub.progress_percentage || 0}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-blue-600 min-w-[40px]">
                                    {sub.progress_percentage || 0}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">{formatDate(sub.created_at)}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.location.href = `/admin/blog-distribution/${sub.id}`}
                                    className="text-xs text-blue-600 border-blue-300"
                                  >
                                    상세
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusChange(sub)}
                                    className="text-xs"
                                  >
                                    상태 변경
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>

      {/* 상태 변경 다이얼로그 */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상태 변경</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.company_name}의 상태를 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>새로운 상태</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">확인중</SelectItem>
                  <SelectItem value="in_progress">구동중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="cancelled">중단</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleStatusUpdate}>변경</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일일 기록 다이얼로그 */}
      <Dialog open={dailyRecordDialogOpen} onOpenChange={setDailyRecordDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>일일 진행 기록</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.company_name} - {selectedSubmission && typeConfig[selectedSubmission.distribution_type].label} 배포
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>날짜</Label>
                <Input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>완료 건수</Label>
                <Input
                  type="number"
                  min="0"
                  value={completedCount}
                  onChange={(e) => setCompletedCount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>총 수량</Label>
                <Input value={`${selectedSubmission?.total_count || 0}건`} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>메모</Label>
              <Input
                value={recordNotes}
                onChange={(e) => setRecordNotes(e.target.value)}
                placeholder="메모 (선택사항)"
              />
            </div>

            {/* 기존 기록 목록 */}
            {dailyRecords.length > 0 && (
              <div className="space-y-2">
                <Label>최근 기록</Label>
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {dailyRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-2 text-sm flex justify-between">
                      <span>{new Date(record.record_date).toLocaleDateString('ko-KR')}</span>
                      <span className="font-medium">{record.completed_count}건</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDailyRecordDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveDailyRecord}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
