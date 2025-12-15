'use client';

import { FileText } from 'lucide-react';
import { useBlogDistribution } from '@/hooks/admin/useBlogDistribution';
import {
  StatsCards,
  FilterSection,
  ListView,
  GroupView,
  StatusChangeDialog,
  DailyRecordDialog,
} from '@/components/admin/blog-distribution';

export default function AdminBlogDistributionPage() {
  const {
    // Data
    filteredSubmissions,
    loading,
    stats,
    groupedData,
    // Filters
    filters,
    setSearchQuery,
    setTypeFilter,
    setStatusFilter,
    setCreatedDateFilter,
    setStartDateFilter,
    resetFilters,
    // View mode
    viewMode,
    setViewMode,
    groupBy,
    setGroupBy,
    expandedGroups,
    toggleGroup,
    // Copy
    copiedId,
    copyToClipboard,
    // Status dialog
    statusDialogOpen,
    setStatusDialogOpen,
    selectedSubmission,
    newStatus,
    setNewStatus,
    handleStatusChange,
    handleStatusUpdate,
    // Daily record dialog
    dailyRecordDialogOpen,
    setDailyRecordDialogOpen,
    dailyRecords,
    recordDate,
    setRecordDate,
    completedCount,
    setCompletedCount,
    recordNotes,
    setRecordNotes,
    handleSaveDailyRecord,
    // Utility
    formatDate,
  } = useBlogDistribution();

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
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">블로그 배포 관리</h1>
          </div>
          <p className="text-[11px] sm:text-sm text-sky-100 truncate">영상/자동화/리뷰어 배포 접수 관리</p>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Filters */}
        <FilterSection
          filters={filters}
          viewMode={viewMode}
          groupBy={groupBy}
          onSearchChange={setSearchQuery}
          onTypeChange={setTypeFilter}
          onStatusChange={setStatusFilter}
          onCreatedDateChange={setCreatedDateFilter}
          onStartDateChange={setStartDateFilter}
          onResetFilters={resetFilters}
          onViewModeChange={setViewMode}
          onGroupByChange={setGroupBy}
        />

        {/* List View */}
        {viewMode === 'list' && (
          <ListView
            submissions={filteredSubmissions}
            copiedId={copiedId}
            onCopy={copyToClipboard}
            onStatusChange={handleStatusChange}
            formatDate={formatDate}
          />
        )}

        {/* Group View */}
        {viewMode === 'group' && (
          <GroupView
            groups={groupedData}
            expandedGroups={expandedGroups}
            copiedId={copiedId}
            onToggleGroup={toggleGroup}
            onCopy={copyToClipboard}
            onStatusChange={handleStatusChange}
            formatDate={formatDate}
          />
        )}
      </div>

      {/* Status Change Dialog */}
      <StatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        submission={selectedSubmission}
        status={newStatus}
        onStatusChange={setNewStatus}
        onSave={handleStatusUpdate}
      />

      {/* Daily Record Dialog */}
      <DailyRecordDialog
        open={dailyRecordDialogOpen}
        onOpenChange={setDailyRecordDialogOpen}
        submission={selectedSubmission}
        dailyRecords={dailyRecords}
        recordDate={recordDate}
        completedCount={completedCount}
        recordNotes={recordNotes}
        onRecordDateChange={setRecordDate}
        onCompletedCountChange={setCompletedCount}
        onRecordNotesChange={setRecordNotes}
        onSave={handleSaveDailyRecord}
      />
    </div>
  );
}
