'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Upload, Trash2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { ProgressCard } from './ProgressCard';
import { BloggerTable } from './BloggerTable';
import type { ExperienceBlogger, ExperienceSubmission } from '@/types/experience-blogger';
import { WORKFLOW_CONFIG } from '@/types/experience-blogger';
import { calculateBloggerRegistrationDeadline } from '@/lib/experience-deadline-utils';

interface BloggersTabProps {
  submission: ExperienceSubmission;
  bloggers: ExperienceBlogger[];
  progressPercentage: number;
  selectedBloggerIds: string[];
  deleteLoading: boolean;
  bulkDeleteLoading: boolean;
  bloggerToDelete: { id: string; name: string } | null;
  onRegisterClick: () => void;
  onScheduleClick: () => void;
  onToggleSelect: (bloggerId: string) => void;
  onToggleSelectAll: () => void;
  onDelete: (bloggerId: string, bloggerName: string) => void;
  onBulkDelete: () => void;
  onPublish: (blogger: ExperienceBlogger) => void;
  onRankings: (blogger: ExperienceBlogger) => void;
}

export function BloggersTab({
  submission,
  bloggers,
  progressPercentage,
  selectedBloggerIds,
  deleteLoading,
  bulkDeleteLoading,
  bloggerToDelete,
  onRegisterClick,
  onScheduleClick,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  onBulkDelete,
  onPublish,
  onRankings,
}: BloggersTabProps) {
  const deadlineInfo = calculateBloggerRegistrationDeadline(submission.created_at);
  const config = WORKFLOW_CONFIG[submission.experience_type];

  const canShowSchedule = config?.hasSelection
    ? submission.bloggers_selected && !submission.schedule_confirmed
    : submission.bloggers_registered && !submission.schedule_confirmed;

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <ProgressCard submission={submission} bloggers={bloggers} progressPercentage={progressPercentage} />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!submission.bloggers_registered && (
          <Button onClick={onRegisterClick}>
            <Plus className="h-4 w-4 mr-2" />
            블로거 등록 (Step 1)
          </Button>
        )}
        {canShowSchedule && (
          <Button
            onClick={onScheduleClick}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg"
            size="lg"
          >
            <Calendar className="h-5 w-5 mr-2" />
            방문 일정 등록 (Step {config?.hasSelection ? '3' : '2'})
          </Button>
        )}
      </div>

      {/* Bloggers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle>블로거 목록 ({bloggers.length}명)</CardTitle>
                {!submission.bloggers_registered && deadlineInfo && (
                  <Badge
                    variant={
                      deadlineInfo.urgencyLevel === 'critical'
                        ? 'destructive'
                        : deadlineInfo.urgencyLevel === 'warning'
                        ? 'default'
                        : 'secondary'
                    }
                    className={
                      deadlineInfo.urgencyLevel === 'critical'
                        ? 'bg-red-500 text-white'
                        : deadlineInfo.urgencyLevel === 'warning'
                        ? 'bg-orange-500 text-white'
                        : 'bg-green-500 text-white'
                    }
                  >
                    {deadlineInfo.isOverdue ? (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        기한 초과 ({Math.abs(deadlineInfo.daysLeft)}일)
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        D-{deadlineInfo.daysLeft}
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <CardDescription>
                등록된 블로거 및 진행 상황
                {!submission.bloggers_registered && deadlineInfo && (
                  <span className="ml-2 text-xs">
                    • 등록 마감일: {deadlineInfo.deadline.toLocaleDateString('ko-KR')}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {bloggers.length > 0 && (
                <label htmlFor="bulk-excel-upload" className="cursor-pointer">
                  <input
                    id="bulk-excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={() => {
                      // This will be handled by RegisterBloggersDialog
                    }}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      파일 재업로드
                    </span>
                  </Button>
                </label>
              )}
              {selectedBloggerIds.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={onBulkDelete}
                  disabled={bulkDeleteLoading}
                >
                  {bulkDeleteLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      선택 삭제 ({selectedBloggerIds.length}명)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BloggerTable
            bloggers={bloggers}
            selectedIds={selectedBloggerIds}
            onToggleSelect={onToggleSelect}
            onToggleSelectAll={onToggleSelectAll}
            onDelete={onDelete}
            onPublish={onPublish}
            onRankings={onRankings}
            deleteLoading={deleteLoading}
            deletingBloggerId={bloggerToDelete?.id}
            experienceType={submission.experience_type}
          />
        </CardContent>
      </Card>
    </div>
  );
}
