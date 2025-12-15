'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  TrendingUp,
  Filter,
  Calendar,
  Camera,
} from 'lucide-react';
import { useVisitorReviewStatus } from '@/hooks/dashboard/useVisitorReviewStatus';
import {
  SubmissionTable,
  SubmissionCard,
  CancelDialog,
  AsConditionDialog,
} from '@/components/dashboard/visitor-review';

export default function VisitorReviewStatusPage() {
  const hook = useVisitorReviewStatus();

  const handleAsClick = (submission: any) => {
    if (submission.status === 'completed') {
      window.location.href = `/dashboard/as-request?submission_id=${submission.id}&type=receipt`;
    } else {
      hook.setAsConditionDialogOpen(true);
    }
  };

  if (hook.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-3 lg:p-6">
      <div className="space-y-3 sm:space-y-4">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">영수증 리뷰 접수 현황</h1>
              </div>
              <p className="text-[11px] sm:text-sm text-purple-100 truncate">방문자 영수증 리뷰 접수 내역을 관리하세요</p>
            </div>
            <Link href="/dashboard/review/visitor" className="flex-shrink-0">
              <Button variant="secondary" size="sm" className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                새 접수
              </Button>
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 sm:p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">총 접수</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{hook.stats.total}</p>
              </div>
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg border border-purple-200 bg-purple-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-purple-600 mb-0.5">진행중</p>
                <p className="text-lg sm:text-xl font-bold text-purple-900">
                  {hook.stats.pending + hook.stats.in_progress}
                </p>
              </div>
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 flex-shrink-0" />
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-emerald-600 mb-0.5">완료</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-900">{hook.stats.completed}</p>
              </div>
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="업체명으로 검색..."
              value={hook.searchQuery}
              onChange={(e) => hook.setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs sm:text-sm"
            />
          </div>

          <Select value={hook.statusFilter} onValueChange={hook.setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32 h-8 text-xs sm:text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">확인중</SelectItem>
              <SelectItem value="in_progress">구동중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="cancelled">중단됨</SelectItem>
              <SelectItem value="as_in_progress">AS 진행 중</SelectItem>
            </SelectContent>
          </Select>

          <Select value={hook.sortBy} onValueChange={(value) => hook.setSortBy(value as 'date' | 'cost')}>
            <SelectTrigger className="w-full sm:w-32 h-8 text-xs sm:text-sm">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">접수일순</SelectItem>
              <SelectItem value="cost">비용순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 - Desktop */}
        <div className="hidden md:block">
          <SubmissionTable
            submissions={hook.submissions}
            downloadingId={hook.downloadingId}
            onCancelClick={hook.handleCancelClick}
            onDownloadReport={hook.handleDownloadReport}
            onAsClick={handleAsClick}
            formatDate={hook.formatDate}
            extractMid={hook.extractMid}
            calculateProgress={hook.calculateProgress}
            canCancel={hook.canCancel}
          />
        </div>

        {/* 카드 - Mobile */}
        <div className="md:hidden">
          <SubmissionCard
            submissions={hook.submissions}
            downloadingId={hook.downloadingId}
            onCancelClick={hook.handleCancelClick}
            onDownloadReport={hook.handleDownloadReport}
            onAsClick={handleAsClick}
            formatDate={hook.formatDate}
            extractMid={hook.extractMid}
            calculateProgress={hook.calculateProgress}
            canCancel={hook.canCancel}
          />
        </div>
      </div>

      <AsConditionDialog
        open={hook.asConditionDialogOpen}
        onOpenChange={hook.setAsConditionDialogOpen}
      />

      <CancelDialog
        open={hook.cancelDialogOpen}
        onOpenChange={hook.setCancelDialogOpen}
        agreed={hook.agreedToCancel}
        onAgreedChange={hook.setAgreedToCancel}
        onConfirm={hook.handleConfirmCancel}
      />
    </div>
  );
}
