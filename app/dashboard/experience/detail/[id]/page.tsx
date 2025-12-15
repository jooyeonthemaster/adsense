'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useExperienceDetail } from '@/hooks/dashboard/useExperienceDetail';
import {
  CampaignInfoCard,
  ProgressTimeline,
  BloggerTable,
  BloggerSelectionDialog,
  ScheduleConfirmDialog,
  BloggerSelectionAction,
  ScheduleConfirmAction,
  EXPERIENCE_TYPE_LABELS,
} from '@/components/dashboard/experience-detail';
import { KakaoInquiryModal } from '@/components/kakao-inquiry-modal';

export default function ClientExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);

  const {
    // Data
    loading,
    submission,
    bloggers,
    selectedBloggers,
    publishedCount,
    config,
    steps,
    currentStep,

    // Blogger selection
    selectedBloggerIds,
    selectLoading,
    selectDialogOpen,
    setSelectDialogOpen,
    bloggerSortBy,
    setBloggerSortBy,
    bloggerFilter,
    setBloggerFilter,

    // Schedule confirmation
    confirmDialogOpen,
    setConfirmDialogOpen,
    confirmLoading,

    // Kakao inquiry
    kakaoInquiryOpen,
    setKakaoInquiryOpen,

    // Handlers
    handleSelectBloggers,
    handleConfirmSchedule,
    toggleBloggerSelection,
    selectAllBloggers,
    deselectAllBloggers,
    selectTopN,
    getFilteredAndSortedBloggers,
    getStepStatus,
  } = useExperienceDetail(unwrappedParams.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">체험단 정보를 찾을 수 없습니다.</p>
            <Link href="/dashboard/submissions?category=experience">
              <Button>목록으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 체험단 타입에 따른 product 파라미터 결정
  const getProductParam = () => {
    const typeMap: Record<string, string> = {
      'blog-experience': 'experience-blog',
      'xiaohongshu': 'experience-xiaohongshu',
      'journalist': 'experience-journalist',
      'influencer': 'experience-influencer',
    };
    return typeMap[submission.experience_type] || 'experience-blog';
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/submissions?category=experience&product=${getProductParam()}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{submission.company_name}</h1>
            <p className="text-sm text-gray-500">
              {EXPERIENCE_TYPE_LABELS[submission.experience_type]} • {submission.team_count}명 체험단
            </p>
          </div>
          <Badge variant={submission.campaign_completed ? 'secondary' : 'default'} className="text-sm">
            {submission.campaign_completed ? '완료' : '진행중'}
          </Badge>
        </div>

        {/* Campaign Info */}
        <CampaignInfoCard submission={submission} />

        {/* Progress Timeline */}
        <ProgressTimeline steps={steps} currentStep={currentStep} getStepStatus={getStepStatus} />

        {/* Step 2: Blogger Selection Action */}
        {config?.hasSelection && submission.bloggers_registered && !submission.bloggers_selected && (
          <BloggerSelectionAction onSelect={() => setSelectDialogOpen(true)} />
        )}

        {/* Step 4: Schedule Confirmation Action */}
        {submission.schedule_confirmed && !submission.client_confirmed && (
          <ScheduleConfirmAction
            onConfirm={() => setConfirmDialogOpen(true)}
            onInquiry={() => setKakaoInquiryOpen(true)}
          />
        )}

        {/* Bloggers Table */}
        <BloggerTable
          bloggers={bloggers}
          selectedBloggersCount={selectedBloggers.length}
          publishedCount={publishedCount}
          config={config}
        />
      </div>

      {/* Blogger Selection Dialog */}
      <BloggerSelectionDialog
        open={selectDialogOpen}
        onOpenChange={setSelectDialogOpen}
        bloggers={getFilteredAndSortedBloggers()}
        selectedBloggerIds={selectedBloggerIds}
        sortBy={bloggerSortBy}
        filter={bloggerFilter}
        loading={selectLoading}
        onSortChange={setBloggerSortBy}
        onFilterChange={setBloggerFilter}
        onToggleSelection={toggleBloggerSelection}
        onSelectAll={selectAllBloggers}
        onDeselectAll={deselectAllBloggers}
        onSelectTopN={selectTopN}
        onConfirm={handleSelectBloggers}
      />

      {/* Schedule Confirmation Dialog */}
      <ScheduleConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        bloggers={selectedBloggers}
        loading={confirmLoading}
        onConfirm={handleConfirmSchedule}
        onRequestChange={() => {
          setConfirmDialogOpen(false);
          setKakaoInquiryOpen(true);
        }}
      />

      {/* Kakao Inquiry Modal */}
      <KakaoInquiryModal
        open={kakaoInquiryOpen}
        onOpenChange={setKakaoInquiryOpen}
        title="일정 조율 문의"
        description="일정 변경이 필요하시면 카카오톡으로 문의해주세요"
      />
    </div>
  );
}
