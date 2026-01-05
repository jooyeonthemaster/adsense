'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { SubmissionStatus } from '@/types/submission';
import { StatsCards } from '@/components/dashboard/submissions/StatsCards';
import { CategoryFilter } from '@/components/dashboard/submissions/CategoryFilter';
import { SubmissionTableRow } from '@/components/dashboard/submissions/SubmissionTableRow';
import { SubmissionCard } from '@/components/dashboard/submissions/SubmissionCard';
import { CancelDialog } from '@/components/dashboard/submissions/CancelDialog';
import { useAllSubmissions } from '@/hooks/dashboard/useAllSubmissions';

export default function AllSubmissionsPage() {
  const {
    submissions,
    stats,
    loading,
    selectedCategory,
    productFilter,
    statusFilter,
    searchQuery,
    sortBy,
    cancelDialogOpen,
    selectedSubmission,
    downloadingId,
    asConditionDialogOpen,
    setSearchQuery,
    setStatusFilter,
    setSortBy,
    setCancelDialogOpen,
    setAsConditionDialogOpen,
    handleCategorySelect,
    handleProductSelect,
    handleCancelClick,
    handleConfirmCancel,
    handleDownloadReport,
    handleAsRequest,
  } = useAllSubmissions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">통합 접수 현황</h1>
          <p className="text-sky-100">모든 마케팅 상품의 접수 현황을 한눈에 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        {stats && <StatsCards stats={stats} />}

        {/* 카테고리 필터 */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          productFilter={productFilter}
          onCategorySelect={handleCategorySelect}
          onProductSelect={handleProductSelect}
        />

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="업체명 또는 MID로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-40 h-10 text-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">확인중</SelectItem>
              <SelectItem value="in_progress">구동중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="cancellation_requested">중단요청</SelectItem>
              <SelectItem value="cancellation_approved">중단완료</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'cost' | 'progress')}>
            <SelectTrigger className="w-full sm:w-40 h-10 text-sm">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">접수일순</SelectItem>
              <SelectItem value="cost">비용순</SelectItem>
              <SelectItem value="progress">진행률순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 - Desktop */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">상품</TableHead>
                <TableHead className="text-xs font-semibold">업체명</TableHead>
                <TableHead className="text-xs font-semibold">상세 정보</TableHead>
                <TableHead className="text-xs font-semibold">구동기간</TableHead>
                <TableHead className="text-xs font-semibold">진행 상태</TableHead>
                <TableHead className="text-xs font-semibold">접수일시</TableHead>
                <TableHead className="text-xs font-semibold text-right">비용</TableHead>
                <TableHead className="text-xs font-semibold text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableHead colSpan={8} className="text-center py-12 text-sm text-gray-500">
                    접수 내역이 없습니다.
                  </TableHead>
                </TableRow>
              ) : (
                submissions.map((submission) => (
                  <SubmissionTableRow
                    key={submission.id}
                    submission={submission}
                    onCancel={handleCancelClick}
                    onDownloadReport={handleDownloadReport}
                    onAsRequest={handleAsRequest}
                    downloadingId={downloadingId}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 카드 - Mobile */}
        <div className="md:hidden space-y-3">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onCancel={handleCancelClick}
                onDownloadReport={handleDownloadReport}
                onAsRequest={handleAsRequest}
                downloadingId={downloadingId}
              />
            ))
          )}
        </div>
      </div>

      {/* 중단 확인 다이얼로그 */}
      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        submission={selectedSubmission}
        onConfirm={handleConfirmCancel}
      />

      {/* AS 신청 조건 안내 다이얼로그 */}
      <Dialog open={asConditionDialogOpen} onOpenChange={setAsConditionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              AS 신청 조건 안내
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                <p className="text-sm text-gray-700">작업이 <span className="font-semibold text-gray-900">완료된 상태</span>여야 합니다.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                <p className="text-sm text-gray-700">예정 수량 대비 실제 달성 수량이 <span className="font-semibold text-gray-900">20% 이상 부족</span>해야 합니다.</p>
              </div>
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600 font-medium">현재 작업이 아직 완료되지 않았습니다.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setAsConditionDialogOpen(false)} className="w-full sm:w-auto">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
