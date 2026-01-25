'use client';

import { useAIBulkManager } from '@/hooks/admin/kakaomap/useAIBulkManager';
import { AIBulkHeader } from '@/components/admin/kakaomap/ai-bulk-manager/AIBulkHeader';
import { AIBulkFilters } from '@/components/admin/kakaomap/ai-bulk-manager/AIBulkFilters';
import { AIBulkSubmissionItem } from '@/components/admin/kakaomap/ai-bulk-manager/AIBulkSubmissionItem';
import { Loader2 } from 'lucide-react';

export default function AIBulkManagerPage() {
  const {
    // 상태
    isLoading,
    submissions,
    submissionStates,
    stats,
    clientList,

    // 필터
    clientFilter,
    setClientFilter,
    sortBy,
    setSortBy,

    // 액션
    fetchSubmissions,
    toggleExpand,
    updateConfig,
    handleKeywordChange,
    handleCountChange,
    generateReviews,
    updateReview,
    deleteReview,
    saveSelectedReviews,
    publishSubmission,
    backToConfig,
  } = useAIBulkManager();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">AI 대기 접수건 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* 헤더 + 통계 */}
        <AIBulkHeader stats={stats} />

        {/* 필터 */}
        <AIBulkFilters
          clientList={clientList}
          clientFilter={clientFilter}
          setClientFilter={setClientFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onRefresh={fetchSubmissions}
        />

        {/* 접수건 목록 */}
        {submissions.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-lg border border-dashed">
            <p className="text-muted-foreground text-lg">
              AI 생성이 필요한 접수건이 없습니다.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              모든 AI 원고 접수건이 완료되었거나, 아직 접수된 건이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => {
              const state = submissionStates.get(submission.id);
              if (!state) return null;

              return (
                <AIBulkSubmissionItem
                  key={submission.id}
                  submission={submission}
                  state={state}
                  onToggleExpand={() => toggleExpand(submission.id)}
                  onUpdateConfig={(updates) => updateConfig(submission.id, updates)}
                  onKeywordChange={(value) => handleKeywordChange(submission.id, value)}
                  onCountChange={(count) => handleCountChange(submission.id, count)}
                  onGenerate={() => generateReviews(submission.id)}
                  onUpdateReview={(reviewId, updates) => updateReview(submission.id, reviewId, updates)}
                  onDeleteReview={(reviewId) => deleteReview(submission.id, reviewId)}
                  onSaveSelected={() => saveSelectedReviews(submission.id)}
                  onPublish={() => publishSubmission(submission.id)}
                  onBackToConfig={() => backToConfig(submission.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
