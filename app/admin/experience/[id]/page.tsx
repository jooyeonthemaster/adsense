'use client';

import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Image as ImageIcon, Users } from 'lucide-react';
import { useExperienceAdmin } from '@/hooks/admin/useExperienceAdmin';
import {
  RegisterBloggersDialog,
  ScheduleDialog,
  PublishDialog,
  RankingsDialog,
  DeleteBloggerDialog,
  BulkDeleteDialog,
  ReuploadConfirmDialog,
  OverviewTab,
  ImagesTab,
  BloggersTab,
} from '@/components/admin/experience';

export default function ExperienceAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);

  const {
    // Data states
    loading,
    submission,
    bloggers,
    progressPercentage,
    selectedBloggers,

    // Dialog states
    registerDialogOpen,
    setRegisterDialogOpen,
    scheduleDialogOpen,
    setScheduleDialogOpen,
    publishDialogOpen,
    setPublishDialogOpen,
    rankingsDialogOpen,
    setRankingsDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    reuploadDialogOpen,
    setReuploadDialogOpen,

    // Selection states
    selectedBloggerIds,
    selectedBlogger,
    bloggerToDelete,

    // Loading states
    registerLoading,
    deleteLoading,
    bulkDeleteLoading,
    downloadingImages,

    // Pending data
    setPendingBloggers,

    // Tab state
    activeTab,
    setActiveTab,

    // Handlers
    handleRegisterBloggers,
    handleFileReupload,
    handleDeleteBlogger,
    handleBulkDelete,
    handleSaveSchedule,
    handlePublish,
    handleSaveRankings,
    handleDownloadAllImages,

    // UI Helper Functions
    toggleBloggerSelection,
    toggleSelectAll,
    openDeleteDialog,
    openBulkDeleteDialog,
    openPublishDialog,
    openRankingsDialog,

    // Navigation
    router,
  } = useExperienceAdmin(unwrappedParams.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!submission) {
    return <div>Submission not found</div>;
  }

  const hasImages = submission.image_urls && submission.image_urls.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{submission.company_name}</h1>
              <p className="text-sm text-gray-500">체험단 마케팅 관리</p>
            </div>
          </div>
          <Badge variant={submission.status === 'completed' ? 'secondary' : 'default'}>
            {submission.status === 'completed' ? '완료' : '진행중'}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full max-w-3xl h-12 bg-gray-100 p-1 rounded-lg ${hasImages ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span className="font-medium">접수 정보</span>
            </TabsTrigger>
            {hasImages && (
              <TabsTrigger
                value="images"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="font-medium">첨부 이미지</span>
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                  {submission.image_urls?.length}
                </Badge>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="bloggers"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              <span className="font-medium">블로거 관리</span>
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab
              submission={submission}
              onViewImages={() => setActiveTab('images')}
            />
          </TabsContent>

          {/* 이미지 탭 */}
          {hasImages && (
            <TabsContent value="images" className="space-y-6">
              <ImagesTab
                submission={submission}
                downloadingImages={downloadingImages}
                onDownloadAllImages={handleDownloadAllImages}
              />
            </TabsContent>
          )}

          {/* 블로거 관리 탭 */}
          <TabsContent value="bloggers" className="space-y-6">
            <BloggersTab
              submission={submission}
              bloggers={bloggers}
              progressPercentage={progressPercentage}
              selectedBloggerIds={selectedBloggerIds}
              deleteLoading={deleteLoading}
              bulkDeleteLoading={bulkDeleteLoading}
              bloggerToDelete={bloggerToDelete}
              onRegisterClick={() => setRegisterDialogOpen(true)}
              onScheduleClick={() => setScheduleDialogOpen(true)}
              onToggleSelect={toggleBloggerSelection}
              onToggleSelectAll={toggleSelectAll}
              onDelete={openDeleteDialog}
              onBulkDelete={openBulkDeleteDialog}
              onPublish={openPublishDialog}
              onRankings={openRankingsDialog}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <RegisterBloggersDialog
        open={registerDialogOpen}
        onOpenChange={setRegisterDialogOpen}
        onRegister={handleRegisterBloggers}
        loading={registerLoading}
        existingBloggersCount={bloggers.length}
        onReuploadConfirm={(bloggers) => {
          setPendingBloggers(bloggers);
          setReuploadDialogOpen(true);
        }}
      />

      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        selectedBloggers={selectedBloggers}
        submission={submission}
        onSave={handleSaveSchedule}
      />

      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        blogger={selectedBlogger}
        onPublish={handlePublish}
      />

      <RankingsDialog
        open={rankingsDialogOpen}
        onOpenChange={setRankingsDialogOpen}
        blogger={selectedBlogger}
        onSave={handleSaveRankings}
      />

      <DeleteBloggerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        bloggerName={bloggerToDelete?.name || ''}
        onConfirm={handleDeleteBlogger}
        loading={deleteLoading}
      />

      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        count={bloggers.filter((b) => selectedBloggerIds.includes(b.id) && !b.published).length}
        onConfirm={handleBulkDelete}
        loading={bulkDeleteLoading}
      />

      <ReuploadConfirmDialog
        open={reuploadDialogOpen}
        onOpenChange={setReuploadDialogOpen}
        onConfirm={handleFileReupload}
        loading={registerLoading}
      />
    </div>
  );
}
