'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useKakaomapManagement } from '@/hooks/admin/useKakaomapManagement';
import {
  StatsCards,
  FilterSection,
  ListView,
  GroupView,
  type KakaomapSubmission,
} from '@/components/admin/kakaomap-management';

export function KakaomapManagementTable({ submissions }: { submissions: KakaomapSubmission[] }) {
  const hook = useKakaomapManagement(submissions);

  return (
    <div className="space-y-6">
      <StatsCards stats={hook.stats} />

      <Card>
        <CardHeader>
          <FilterSection
            searchQuery={hook.searchQuery}
            statusFilter={hook.statusFilter}
            contentFilter={hook.contentFilter}
            groupBy={hook.groupBy}
            createdDateFilter={hook.createdDateFilter}
            startDateFilter={hook.startDateFilter}
            onSearchChange={hook.setSearchQuery}
            onStatusFilterChange={hook.setStatusFilter}
            onContentFilterChange={hook.setContentFilter}
            onGroupByChange={hook.setGroupBy}
            onCreatedDateFilterChange={hook.setCreatedDateFilter}
            onStartDateFilterChange={hook.setStartDateFilter}
          />
        </CardHeader>

        <CardContent>
          {hook.groupedData ? (
            <GroupView
              groups={hook.groupedData}
              expandedGroups={hook.expandedGroups}
              copiedId={hook.copiedId}
              onToggleGroup={hook.toggleGroup}
              onCopy={hook.copyToClipboard}
              getProgressPercentage={hook.getProgressPercentage}
              getProgressBarWidth={hook.getProgressBarWidth}
            />
          ) : (
            <ListView
              submissions={hook.filteredSubmissions}
              copiedId={hook.copiedId}
              searchQuery={hook.searchQuery}
              statusFilter={hook.statusFilter}
              contentFilter={hook.contentFilter}
              onCopy={hook.copyToClipboard}
              getProgressPercentage={hook.getProgressPercentage}
              getProgressBarWidth={hook.getProgressBarWidth}
            />
          )}

          {hook.filteredSubmissions.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              총 {hook.filteredSubmissions.length}개의 캠페인 · 총 비용{' '}
              {hook.filteredSubmissions.reduce((sum, s) => sum + s.total_points, 0).toLocaleString()}P
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
