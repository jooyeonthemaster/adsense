'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Eye, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { UnifiedSubmission } from '@/types/admin/submissions';
import { SubmissionDetailDialog } from './submission-detail-dialog';
import { SubmissionsFilters } from '@/components/admin/submissions/SubmissionsFilters';
import { SubmissionTableRow } from '@/components/admin/submissions/SubmissionTableRow';
import { SubmissionsGroupView } from '@/components/admin/submissions/SubmissionsGroupView';
import { applySubmissionFilters, createGroupedData, formatDate, getSubmissionDetails } from '@/utils/admin/submission-helpers';
import { TYPE_LABELS, STATUS_LABELS, STATUS_VARIANTS } from '@/types/admin/submissions';
import { Badge } from '@/components/ui/badge';

// 상품 타입별 관리 페이지 URL 매핑
const getManagementUrl = (type: UnifiedSubmission['type'], id: string): string => {
  const urlMap: Record<UnifiedSubmission['type'], string> = {
    place: `/admin/reward/${id}`,
    receipt: `/admin/review-marketing/visitor/${id}`,
    kakaomap: `/admin/kakaomap/${id}`,
    blog: `/admin/blog-distribution/${id}`,
    cafe: `/admin/cafe-marketing/${id}`,
    experience: `/admin/experience/${id}`,
  };
  return urlMap[type];
};

export function AdminSubmissionsTable() {
  const [submissions, setSubmissions] = useState<UnifiedSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<UnifiedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [createdDateFilter, setCreatedDateFilter] = useState<Date | undefined>();
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>();

  // View mode states
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [groupBy, setGroupBy] = useState<'client' | 'type'>('client');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Detail dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<{
    id: string;
    type: 'place' | 'receipt' | 'kakaomap' | 'blog' | 'cafe' | 'experience';
  } | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    const filtered = applySubmissionFilters(
      submissions,
      searchQuery,
      typeFilter,
      statusFilter,
      dateFilter,
      sortBy,
      createdDateFilter,
      startDateFilter
    );
    setFilteredSubmissions(filtered);
  }, [submissions, searchQuery, typeFilter, statusFilter, dateFilter, sortBy, createdDateFilter, startDateFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/submissions');

      if (!response.ok) {
        throw new Error('접수 내역을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const formatDateForExcel = (dateStr?: string) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    };

    const excelData = filteredSubmissions.map((submission) => ({
      접수일시: formatDate(submission.created_at),
      접수번호: submission.submission_number || '-',
      거래처: submission.clients?.company_name || '-',
      상품유형: TYPE_LABELS[submission.type] || submission.type,
      업체명: submission.company_name || '-',
      업체링크: submission.place_url || '-',
      시작일: formatDateForExcel(submission.start_date),
      마감일: formatDateForExcel(submission.end_date),
      일건수: submission.daily_count !== undefined ? submission.daily_count : '-',
      상세내용: getSubmissionDetails(submission),
      진행률: submission.progress_percentage !== undefined ? `${submission.progress_percentage}%` : '-',
      사용포인트: submission.total_points.toLocaleString(),
      상태: STATUS_LABELS[submission.status] || submission.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '전체 접수 내역');

    const maxWidth = excelData.reduce((w, r) => Math.max(w, Object.keys(r).length), 10);
    worksheet['!cols'] = Array(maxWidth).fill({ wch: 15 });

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `전체접수내역_${timestamp}.xlsx`);
  };

  const openDetailDialog = (id: string, type: UnifiedSubmission['type']) => {
    setSelectedSubmission({ id, type });
    setDetailDialogOpen(true);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight truncate">
            전체 접수 내역 ({filteredSubmissions.length} / {submissions.length}건)
          </h2>
          <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
            모든 거래처의 접수 내역을 조회하고 관리합니다
          </p>
        </div>
        <Button onClick={exportToExcel} variant="outline" className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">
          <Download className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">엑셀 다운로드</span>
          <span className="sm:hidden">다운로드</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <SubmissionsFilters
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
        sortBy={sortBy}
        viewMode={viewMode}
        groupBy={groupBy}
        createdDateFilter={createdDateFilter}
        startDateFilter={startDateFilter}
        onSearchChange={setSearchQuery}
        onTypeFilterChange={setTypeFilter}
        onStatusFilterChange={setStatusFilter}
        onDateFilterChange={setDateFilter}
        onSortByChange={setSortBy}
        onViewModeChange={setViewMode}
        onGroupByChange={setGroupBy}
        onCreatedDateFilterChange={setCreatedDateFilter}
        onStartDateFilterChange={setStartDateFilter}
      />

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px] whitespace-nowrap">접수일시</TableHead>
                      <TableHead className="w-[130px] whitespace-nowrap">접수번호</TableHead>
                      <TableHead className="w-[120px] whitespace-nowrap">거래처</TableHead>
                      <TableHead className="w-[140px] whitespace-nowrap">상품유형</TableHead>
                      <TableHead className="w-[150px] whitespace-nowrap">업체명</TableHead>
                      <TableHead className="w-[50px] whitespace-nowrap text-center">링크</TableHead>
                      <TableHead className="w-[160px] whitespace-nowrap">구동기간</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap">상세내용</TableHead>
                      <TableHead className="w-[80px] whitespace-nowrap">진행률</TableHead>
                      <TableHead className="w-[100px] text-right whitespace-nowrap">사용 포인트</TableHead>
                      <TableHead className="w-[100px] whitespace-nowrap">상태</TableHead>
                      <TableHead className="w-[100px] whitespace-nowrap sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.05)] z-10">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="h-24 text-center">
                          검색 결과가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.map((submission) => (
                        <SubmissionTableRow
                          key={`${submission.type}-${submission.id}`}
                          submission={submission}
                          onOpenDetail={openDetailDialog}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-8 bg-white border rounded-lg">
                <p className="text-xs text-gray-500">검색 결과가 없습니다.</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div
                  key={`${submission.type}-${submission.id}`}
                  className="bg-white border rounded-lg p-2.5 space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold truncate">{submission.clients?.company_name || '-'}</p>
                        {submission.place_url && (
                          <a
                            href={submission.place_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{submission.company_name || '-'}</p>
                      {submission.submission_number && (
                        <p className="text-[10px] font-mono text-blue-600">{submission.submission_number}</p>
                      )}
                    </div>
                    <Badge variant={STATUS_VARIANTS[submission.status] || 'outline'} className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                      {STATUS_LABELS[submission.status] || submission.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      {TYPE_LABELS[submission.type] || submission.type}
                    </Badge>
                  </div>

                  <div className="text-[10px] text-gray-600 line-clamp-2">
                    {getSubmissionDetails(submission)}
                  </div>

                  {submission.progress_percentage !== undefined && (
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                        <span>진행률</span>
                        <span className="font-medium">{submission.progress_percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(submission.progress_percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">접수일시</p>
                      <p className="text-xs font-medium">{formatDate(submission.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">구동기간</p>
                      <p className="text-xs font-medium">
                        {submission.start_date
                          ? `${new Date(submission.start_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}${submission.end_date ? ` ~ ${new Date(submission.end_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}` : ' ~'}`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">사용 포인트</p>
                      <p className="text-xs font-semibold text-primary">{submission.total_points.toLocaleString()} P</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailDialog(submission.id, submission.type)}
                      className="flex-1 text-[11px] h-7 text-blue-600 border-blue-300 px-2"
                    >
                      <Eye className="h-2.5 w-2.5 mr-0.5" />
                      상세
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 text-[11px] h-7 px-2"
                    >
                      <Link href={getManagementUrl(submission.type, submission.id)}>
                        관리
                        <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Group View */}
      {viewMode === 'group' && (
        <SubmissionsGroupView
          groups={createGroupedData(filteredSubmissions, groupBy)}
          expandedGroups={expandedGroups}
          groupBy={groupBy}
          onToggleGroup={toggleGroup}
          onOpenDetail={openDetailDialog}
        />
      )}

      {/* Detail Dialog */}
      {selectedSubmission && (
        <SubmissionDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          submissionId={selectedSubmission.id}
          submissionType={selectedSubmission.type}
        />
      )}
    </div>
  );
}
