'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CafeMarketingDailyRecord } from '@/types/database';
import { SubmissionWithClient } from '@/types/admin/cafe-marketing';
import { CafeMarketingHeader } from '@/components/admin/cafe-marketing/CafeMarketingHeader';
import { CafeMarketingStats } from '@/components/admin/cafe-marketing/CafeMarketingStats';
import { CafeMarketingFilters } from '@/components/admin/cafe-marketing/CafeMarketingFilters';
import { CafeMarketingTable } from '@/components/admin/cafe-marketing/CafeMarketingTable';
import { CafeMarketingGroupView } from '@/components/admin/cafe-marketing/CafeMarketingGroupView';

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (scriptStatusFilter !== 'all') {
      filtered = filtered.filter((s) => s.script_status === scriptStatusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.company_name.toLowerCase().includes(query) ||
          s.clients?.company_name?.toLowerCase().includes(query) ||
          s.region.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="space-y-3 sm:space-y-4">
        <CafeMarketingHeader />
        <CafeMarketingStats {...stats} />
        <CafeMarketingFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          scriptStatusFilter={scriptStatusFilter}
          viewMode={viewMode}
          groupBy={groupBy}
          onSearchChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
          onScriptStatusFilterChange={setScriptStatusFilter}
          onViewModeChange={setViewMode}
          onGroupByChange={setGroupBy}
        />

        {viewMode === 'list' ? (
          <CafeMarketingTable
            submissions={filteredSubmissions}
            updatingStatusId={updatingStatusId}
            onStatusSelect={handleStatusSelect}
            onScriptChange={handleScriptChange}
            onDailyRecordOpen={handleDailyRecordOpen}
          />
        ) : (
          <CafeMarketingGroupView
            groups={groupedData()}
            expandedGroups={expandedGroups}
            updatingStatusId={updatingStatusId}
            onToggleGroup={toggleGroup}
            onStatusSelect={handleStatusSelect}
            onScriptChange={handleScriptChange}
            onDailyRecordOpen={handleDailyRecordOpen}
          />
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
            <Button variant="outline" onClick={() => setScriptDialogOpen(false)}>취소</Button>
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
            <Button variant="outline" onClick={() => setDailyRecordDialogOpen(false)}>취소</Button>
            <Button onClick={handleSaveDailyRecord}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
