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
import { Search, Calendar, Coffee, ExternalLink, List, Grid3x3, Building2, ChevronDown } from 'lucide-react';
import { CafeMarketingSubmission, CafeMarketingDailyRecord } from '@/types/database';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SubmissionWithClient extends CafeMarketingSubmission {
  clients?: {
    company_name: string;
  };
  progress_percentage?: number;
  completed_count?: number;
}

const statusConfig = {
  pending: { label: '확인중', color: 'bg-gray-100 text-gray-800' },
  approved: { label: '접수완료', color: 'bg-blue-100 text-blue-800' },
  script_writing: { label: '원고작성중', color: 'bg-yellow-100 text-yellow-800' },
  script_completed: { label: '원고작업완료', color: 'bg-purple-100 text-purple-800' },
  in_progress: { label: '구동중', color: 'bg-sky-100 text-sky-800' },
  completed: { label: '완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '중단', color: 'bg-red-100 text-red-800' },
};

const scriptStatusLabels: Record<string, string> = {
  pending: '대기중',
  writing: '작성중',
  completed: '완료',
};

const STATUS_OPTIONS: { value: SubmissionWithClient['status']; label: string }[] = [
  { value: 'pending', label: '확인중' },
  { value: 'approved', label: '접수완료' },
  { value: 'script_writing', label: '원고작성중' },
  { value: 'script_completed', label: '원고작업완료' },
  { value: 'in_progress', label: '구동중' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '중단' },
];

export default function AdminCafeMarketingPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithClient[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scriptStatusFilter, setScriptStatusFilter] = useState('all');

  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [groupBy, setGroupBy] = useState<'client' | 'region'>('client');

  // 다이얼로그 상태
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [dailyRecordDialogOpen, setDailyRecordDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithClient | null>(null);
  const [newScriptStatus, setNewScriptStatus] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // 일일 기록 상태
  const [dailyRecords, setDailyRecords] = useState<CafeMarketingDailyRecord[]>([]);
  const [recordDate, setRecordDate] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const [recordNotes, setRecordNotes] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [submissions, searchQuery, statusFilter, scriptStatusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/cafe-marketing');
      if (!response.ok) {
        console.error('[카페 침투] API 응답 실패:', response.status, response.statusText);
        throw new Error('Failed');
      }

      const data = await response.json();
      console.log('[카페 침투] API 응답 데이터:', data);
      console.log('[카페 침투] submissions 개수:', data.submissions?.length || 0);

      if (data.submissions && data.submissions.length > 0) {
        console.log('[카페 침투] 첫 번째 submission 샘플:', data.submissions[0]);
      }

      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('[카페 침투] Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];
    console.log('[카페 침투] applyFilters 시작 - 전체 submissions:', submissions.length);

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
      console.log('[카페 침투] status 필터 적용 후:', filtered.length, '(필터:', statusFilter, ')');
    }

    if (scriptStatusFilter !== 'all') {
      filtered = filtered.filter((s) => s.script_status === scriptStatusFilter);
      console.log('[카페 침투] script status 필터 적용 후:', filtered.length, '(필터:', scriptStatusFilter, ')');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.company_name.toLowerCase().includes(query) ||
          s.clients?.company_name?.toLowerCase().includes(query) ||
          s.region.toLowerCase().includes(query)
      );
      console.log('[카페 침투] 검색 필터 적용 후:', filtered.length, '(검색어:', searchQuery, ')');
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    console.log('[카페 침투] 최종 filteredSubmissions:', filtered.length);
    setFilteredSubmissions(filtered);
  };

  const handleScriptChange = (submission: SubmissionWithClient) => {
    setSelectedSubmission(submission);
    setNewScriptStatus(submission.script_status || 'pending');
    setScriptUrl(submission.script_url || '');
    setScriptDialogOpen(true);
  };

  const handleStatusSelect = async (
    submission: SubmissionWithClient,
    targetStatus: SubmissionWithClient['status']
  ) => {
    if (submission.status === targetStatus) return;

    setUpdatingStatusId(submission.id);
    try {
      const response = await fetch(`/api/admin/cafe-marketing/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!response.ok) throw new Error('Failed');

      alert('상태가 변경되었습니다.');
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleScriptUpdate = async () => {
    if (!selectedSubmission) return;

    if (newScriptStatus === 'completed' && !scriptUrl) {
      alert('원고 완료 상태로 변경하려면 Google Sheets 링크를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/cafe-marketing/${selectedSubmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_status: newScriptStatus,
          script_url: scriptUrl || null,
        }),
      });

      if (!response.ok) throw new Error('Failed');

      alert('원고 상태가 변경되었습니다.');
      setScriptDialogOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating script status:', error);
      alert('원고 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDailyRecordOpen = async (submission: SubmissionWithClient) => {
    setSelectedSubmission(submission);
    setRecordDate(new Date().toISOString().split('T')[0]);
    setCompletedCount(0);
    setRecordNotes('');

    // 기존 일일 기록 조회
    try {
      const response = await fetch(`/api/admin/cafe-marketing/${submission.id}/daily-records`);
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
      const response = await fetch(`/api/admin/cafe-marketing/${selectedSubmission.id}/daily-records`, {
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

  const renderStatusDropdown = (submission: SubmissionWithClient) => {
    const statusInfo = statusConfig[submission.status];
    const label = statusInfo?.label || submission.status;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={updatingStatusId === submission.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-70',
              statusInfo?.color || 'bg-gray-100 text-gray-800'
            )}
          >
            {label}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-36">
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              className={cn(
                'text-xs',
                option.value === submission.status && 'bg-sky-50 text-sky-600'
              )}
              onSelect={() => handleStatusSelect(submission, option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // 그룹핑 데이터 생성
  const groupedData = () => {
    const groups = new Map<string, SubmissionWithClient[]>();

    filteredSubmissions.forEach((sub) => {
      const key = groupBy === 'client'
        ? sub.clients?.company_name || '거래처 없음'
        : sub.region;

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
      inProgress: items.filter(i => ['pending', 'approved', 'in_progress'].includes(i.status)).length,
      completed: items.filter(i => i.status === 'completed').length,
    }));
  };

  const stats = {
    total: filteredSubmissions.length,
    pending: filteredSubmissions.filter((s) => s.status === 'pending').length,
    in_progress: filteredSubmissions.filter((s) => s.status === 'in_progress').length,
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
    <div className="p-6">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Coffee className="h-8 w-8" />
            <h1 className="text-2xl font-bold">카페 침투 마케팅 관리</h1>
          </div>
          <p className="text-amber-100">카페 마케팅 접수 관리</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-500">총 접수</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-500">확인중</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-700">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-sky-600">구동중</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-sky-600">{stats.in_progress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-600">완료</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* 필터 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="업체명, 거래처, 지역 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">확인중</SelectItem>
                <SelectItem value="approved">접수완료</SelectItem>
                <SelectItem value="script_writing">원고작성중</SelectItem>
                <SelectItem value="script_completed">원고작업완료</SelectItem>
                <SelectItem value="in_progress">구동중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">중단</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scriptStatusFilter} onValueChange={setScriptStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="원고 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 원고</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="writing">작성중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-2" />
                리스트
              </Button>
              <Button
                variant={viewMode === 'group' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('group')}
                className="h-8 px-3"
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                그룹
              </Button>
            </div>

            {viewMode === 'group' && (
              <Select value={groupBy} onValueChange={(value: 'client' | 'region') => setGroupBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">거래처별</SelectItem>
                  <SelectItem value="region">지역별</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <Card>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>업체명</TableHead>
                <TableHead>거래처</TableHead>
                <TableHead>지역</TableHead>
                <TableHead className="text-center">카페 수</TableHead>
                <TableHead className="text-center">발행 건수</TableHead>
                <TableHead>진행 상태</TableHead>
                <TableHead className="text-center">진행률</TableHead>
                <TableHead>접수일</TableHead>
                <TableHead className="text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    접수 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => {
                  const statusInfo = statusConfig[sub.status];
                  const scriptLabel = scriptStatusLabels[sub.script_status || ''] || '원고 상태 미입력';

                  return (
                    <TableRow
                      key={sub.id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="font-medium">{sub.company_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {sub.clients?.company_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {sub.region}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{sub.cafe_details?.length || 0}개</TableCell>
                      <TableCell className="text-center font-medium">{sub.total_count}건</TableCell>
                      <TableCell>{renderStatusDropdown(sub)}</TableCell>
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
                            onClick={() => window.location.href = `/admin/cafe-marketing/${sub.id}`}
                            className="text-xs text-blue-600 border-blue-300"
                          >
                            상세
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleScriptChange(sub)}
                            className="text-xs"
                            title={`원고 상태: ${scriptLabel}`}
                          >
                            원고
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDailyRecordOpen(sub)}
                            className="text-xs"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            기록
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
        )}

        {/* Group View */}
        {viewMode === 'group' && (
          <div className="space-y-4">
            {groupedData().map((group) => (
              <Card key={group.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-amber-500" />
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription>
                          {group.count}개 접수 • 진행중 {group.inProgress}개 • 완료 {group.completed}개
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-600">{group.totalCount.toLocaleString()}건</p>
                      <p className="text-xs text-gray-500">총 발행 건수</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>업체명</TableHead>
                          <TableHead>거래처</TableHead>
                          <TableHead>지역</TableHead>
                          <TableHead className="text-center">카페 수</TableHead>
                          <TableHead className="text-center">발행 건수</TableHead>
                          <TableHead>진행 상태</TableHead>
                          <TableHead className="text-center">진행률</TableHead>
                          <TableHead>접수일</TableHead>
                          <TableHead className="text-center">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((sub) => {
                          const statusInfo = statusConfig[sub.status];
                          const scriptLabel = scriptStatusLabels[sub.script_status || ''] || '원고 상태 미입력';

                          return (
                            <TableRow
                              key={sub.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium">{sub.company_name}</TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {sub.clients?.company_name || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {sub.region}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{sub.cafe_details?.length || 0}개</TableCell>
                              <TableCell className="text-center font-medium">{sub.total_count}건</TableCell>
                              <TableCell>{renderStatusDropdown(sub)}</TableCell>
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
                                    onClick={() => window.location.href = `/admin/cafe-marketing/${sub.id}`}
                                    className="text-xs text-blue-600 border-blue-300"
                                  >
                                    상세
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleScriptChange(sub)}
                                    className="text-xs"
                                    title={`원고 상태: ${scriptLabel}`}
                                  >
                                    원고
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDailyRecordOpen(sub)}
                                    className="text-xs"
                                  >
                                    <Calendar className="h-3 w-3 mr-1" />
                                    기록
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
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 원고 관리 다이얼로그 */}
      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>원고 관리</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.company_name}의 원고 상태를 관리합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>원고 상태</Label>
              <Select value={newScriptStatus} onValueChange={setNewScriptStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="writing">작성중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Google Sheets 링크</Label>
              <Input
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
              />
              <p className="text-xs text-gray-500">원고 완료 시 필수 입력</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScriptDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleScriptUpdate}>변경</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일일 기록 다이얼로그 */}
      <Dialog open={dailyRecordDialogOpen} onOpenChange={setDailyRecordDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>일일 진행 기록</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.company_name} - {selectedSubmission?.region}
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
