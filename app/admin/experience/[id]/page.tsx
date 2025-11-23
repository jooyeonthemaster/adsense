'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Calendar, Upload, Trash2, Loader2, AlertCircle, Clock, Download, FileText, Image as ImageIcon, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  ExperienceBlogger,
  ExperienceSubmission,
  NewBlogger,
  BloggerSchedule,
  KeywordRanking,
  WORKFLOW_CONFIG,
} from '@/types/experience-blogger';
import { calculateBloggerRegistrationDeadline, isStepRequired } from '@/lib/experience-deadline-utils';
import { RegisterBloggersDialog } from '@/components/admin/experience/RegisterBloggersDialog';
import { ScheduleDialog } from '@/components/admin/experience/ScheduleDialog';
import { PublishDialog } from '@/components/admin/experience/PublishDialog';
import { RankingsDialog } from '@/components/admin/experience/RankingsDialog';
import {
  DeleteBloggerDialog,
  BulkDeleteDialog,
  ReuploadConfirmDialog,
} from '@/components/admin/experience/DeleteDialogs';
import { BloggerTable } from '@/components/admin/experience/BloggerTable';
import { ProgressCard } from '@/components/admin/experience/ProgressCard';

export default function ExperienceAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  // Data states
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<ExperienceSubmission | null>(null);
  const [bloggers, setBloggers] = useState<ExperienceBlogger[]>([]);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [rankingsDialogOpen, setRankingsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [reuploadDialogOpen, setReuploadDialogOpen] = useState(false);

  // Selection states
  const [selectedBloggerIds, setSelectedBloggerIds] = useState<string[]>([]);
  const [selectedBlogger, setSelectedBlogger] = useState<ExperienceBlogger | null>(null);
  const [bloggerToDelete, setBloggerToDelete] = useState<{ id: string; name: string } | null>(null);

  // Loading states
  const [registerLoading, setRegisterLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [downloadingImages, setDownloadingImages] = useState(false);

  // Temporary data for reupload
  const [pendingBloggers, setPendingBloggers] = useState<NewBlogger[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStatus();
  }, [unwrappedParams.id]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/experience/${unwrappedParams.id}/status`);
      if (!response.ok) throw new Error('Failed to fetch status');

      const data = await response.json();
      setSubmission(data.submission);
      setBloggers(data.bloggers || []);
      setProgressPercentage(data.progress_percentage || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deadlineInfo = calculateBloggerRegistrationDeadline(submission?.created_at || null);

  // Register Bloggers
  const handleRegisterBloggers = async (validBloggers: NewBlogger[]) => {
    if (registerLoading) return;

    try {
      setRegisterLoading(true);
      const response = await fetch(`/api/admin/experience/${unwrappedParams.id}/bloggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloggers: validBloggers }),
      });

      if (!response.ok) throw new Error('Failed to register bloggers');

      toast({
        title: '블로거 등록 완료',
        description: `${validBloggers.length}명의 블로거가 등록되었습니다.`,
      });
      setRegisterDialogOpen(false);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '등록 실패',
        description: '블로거 등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  // Handle File Reupload
  const handleFileReupload = async () => {
    try {
      setRegisterLoading(true);
      setReuploadDialogOpen(false);

      // Delete all existing unpublished bloggers
      const unpublishedBloggers = bloggers.filter((b) => !b.published);
      for (const blogger of unpublishedBloggers) {
        try {
          await fetch(`/api/admin/experience/${unwrappedParams.id}/bloggers/${blogger.id}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.error('Delete error:', error);
        }
      }

      // Register new bloggers
      const response = await fetch(`/api/admin/experience/${unwrappedParams.id}/bloggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloggers: pendingBloggers }),
      });

      if (!response.ok) throw new Error('Failed to register bloggers');

      toast({
        title: '파일 재등록 완료',
        description: `${pendingBloggers.length}명이 등록되었습니다.`,
      });

      setPendingBloggers([]);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '재등록 실패',
        description: '블로거 재등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  // Delete Blogger
  const handleDeleteBlogger = async () => {
    if (!bloggerToDelete || deleteLoading) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(
        `/api/admin/experience/${unwrappedParams.id}/bloggers/${bloggerToDelete.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete blogger');

      toast({
        title: '블로거 삭제 완료',
        description: `${bloggerToDelete.name} 블로거가 삭제되었습니다.`,
      });
      setDeleteDialogOpen(false);
      setBloggerToDelete(null);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '삭제 실패',
        description: '블로거 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (bulkDeleteLoading) return;

    const deletableBloggers = bloggers.filter(
      (b) => selectedBloggerIds.includes(b.id) && !b.published
    );

    try {
      setBulkDeleteLoading(true);
      setBulkDeleteDialogOpen(false);

      let successCount = 0;
      for (const blogger of deletableBloggers) {
        try {
          const response = await fetch(
            `/api/admin/experience/${unwrappedParams.id}/bloggers/${blogger.id}`,
            { method: 'DELETE' }
          );
          if (response.ok) successCount++;
        } catch {
          // continue
        }
      }

      toast({
        title: '일괄 삭제 완료',
        description: `${successCount}명의 블로거가 삭제되었습니다.`,
      });

      setSelectedBloggerIds([]);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '삭제 실패',
        description: '일괄 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Save Schedule
  const handleSaveSchedule = async (schedules: BloggerSchedule[]) => {
    try {
      const response = await fetch(`/api/admin/experience/${unwrappedParams.id}/bloggers/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogger_schedules: schedules }),
      });

      if (!response.ok) throw new Error('Failed to add schedules');

      toast({
        title: '일정 등록 완료',
        description: '방문 일정이 등록되었습니다.',
      });
      setScheduleDialogOpen(false);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '등록 실패',
        description: '일정 등록에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Publish
  const handlePublish = async (publishUrl: string) => {
    if (!selectedBlogger || !publishUrl) return;

    try {
      const response = await fetch(
        `/api/admin/experience/${unwrappedParams.id}/bloggers/${selectedBlogger.id}/publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published_url: publishUrl }),
        }
      );

      if (!response.ok) throw new Error('Failed to mark as published');

      toast({
        title: '발행 완료',
        description: '발행 완료 처리되었습니다.',
      });
      setPublishDialogOpen(false);
      setSelectedBlogger(null);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '처리 실패',
        description: '발행 처리에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Save Rankings
  const handleSaveRankings = async (rankings: KeywordRanking[]) => {
    if (!selectedBlogger) return;

    try {
      const response = await fetch(
        `/api/admin/experience/${unwrappedParams.id}/bloggers/${selectedBlogger.id}/rankings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rankings }),
        }
      );

      if (!response.ok) throw new Error('Failed to add rankings');

      toast({
        title: '순위 등록 완료',
        description: '키워드 순위가 등록되었습니다.',
      });
      setRankingsDialogOpen(false);
      setSelectedBlogger(null);
      fetchStatus();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '등록 실패',
        description: '순위 등록에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // UI Helper Functions
  const toggleBloggerSelection = (bloggerId: string) => {
    setSelectedBloggerIds((prev) =>
      prev.includes(bloggerId) ? prev.filter((id) => id !== bloggerId) : [...prev, bloggerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBloggerIds.length === bloggers.length) {
      setSelectedBloggerIds([]);
    } else {
      setSelectedBloggerIds(bloggers.map((b) => b.id));
    }
  };

  const openDeleteDialog = (bloggerId: string, bloggerName: string) => {
    setBloggerToDelete({ id: bloggerId, name: bloggerName });
    setDeleteDialogOpen(true);
  };

  const openBulkDeleteDialog = () => {
    const deletableBloggers = bloggers.filter(
      (b) => selectedBloggerIds.includes(b.id) && !b.published
    );

    if (deletableBloggers.length === 0) {
      toast({
        title: '삭제 불가',
        description: '삭제할 수 있는 블로거가 없습니다. (발행된 블로거는 삭제할 수 없습니다)',
        variant: 'destructive',
      });
      return;
    }

    setBulkDeleteDialogOpen(true);
  };

  // Download all images as ZIP
  const handleDownloadAllImages = async () => {
    if (!submission?.image_urls || submission.image_urls.length === 0) return;

    try {
      setDownloadingImages(true);
      const zip = new JSZip();
      const folder = zip.folder('images');

      if (!folder) {
        throw new Error('Failed to create ZIP folder');
      }

      for (let i = 0; i < submission.image_urls.length; i++) {
        const url = submission.image_urls[i];
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const fileName = `image_${i + 1}.${blob.type.split('/')[1] || 'jpg'}`;
          folder.file(fileName, blob);
        } catch (error) {
          console.error(`Failed to download image ${i + 1}:`, error);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${submission.company_name}_images.zip`);

      toast({
        title: '다운로드 완료',
        description: `${submission.image_urls.length}개의 이미지가 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('Error downloading images:', error);
      toast({
        title: '다운로드 실패',
        description: '이미지 다운로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingImages(false);
    }
  };

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

  // Get bloggers for scheduling based on workflow type
  const config = WORKFLOW_CONFIG[submission.experience_type];
  const selectedBloggers = config?.hasSelection
    ? bloggers.filter((b) => b.selected_by_client)  // Blog: only selected bloggers
    : bloggers;  // Xiaohongshu, Journalist, Influencer: all registered bloggers

  // Get experience type display name
  const getExperienceTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'blog-experience': '블로그 체험단',
      'xiaohongshu': '샤오홍슈',
      'journalist': '블로그 기자단',
      'influencer': '인플루언서',
    };
    return typeMap[type] || type;
  };

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
          <TabsList className={`grid w-full max-w-3xl h-12 bg-gray-100 p-1 rounded-lg ${submission.image_urls && submission.image_urls.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span className="font-medium">접수 정보</span>
            </TabsTrigger>
            {submission.image_urls && submission.image_urls.length > 0 && (
              <TabsTrigger
                value="images"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="font-medium">첨부 이미지</span>
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                  {submission.image_urls.length}
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
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-violet-500">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">거래처</CardDescription>
                  <CardTitle className="text-xl truncate">{submission.company_name}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">서비스</CardDescription>
                  <CardTitle className="text-xl">{getExperienceTypeName(submission.experience_type)}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">팀 수량</CardDescription>
                  <CardTitle className="text-xl">{submission.team_count}팀</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">포인트</CardDescription>
                  <CardTitle className="text-xl text-violet-600">{submission.total_points.toLocaleString()}P</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* 2열 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 왼쪽: 기본 정보 */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">기본 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">업체명</span>
                      <span className="font-medium">{submission.company_name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">접수일</span>
                      <span className="font-medium">
                        {new Date(submission.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">상태</span>
                      <Badge variant={submission.status === 'completed' ? 'secondary' : 'default'}>
                        {submission.status === 'completed' ? '완료' : '진행중'}
                      </Badge>
                    </div>
                    <div className="py-2">
                      <span className="text-gray-500 block mb-2">장소 URL</span>
                      <a
                        href={submission.place_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs break-all"
                      >
                        {submission.place_url || 'N/A'}
                      </a>
                    </div>
                  </CardContent>
                </Card>

                {/* 키워드 */}
                {submission.keywords && submission.keywords.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">타겟 키워드</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {submission.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 방문 일정 */}
                {submission.available_days && submission.available_days.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">방문 가능 일정</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">요일</span>
                        <span className="font-medium">{submission.available_days.join(', ')}</span>
                      </div>
                      {submission.available_time_start && submission.available_time_end && (
                        <div className="flex justify-between py-2">
                          <span className="text-gray-500">시간</span>
                          <span className="font-medium">
                            {submission.available_time_start} ~ {submission.available_time_end}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* 오른쪽: 상세 내용 */}
              <div className="space-y-6">
                {/* 가이드라인 */}
                {submission.guide_text && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">가이드라인</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {submission.guide_text}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 제공 내역 */}
                {submission.provided_items && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">제공 내역</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                        {submission.provided_items}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 이미지 미리보기 */}
                {submission.image_urls && submission.image_urls.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">첨부 이미지</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('images')}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          전체 보기 →
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {submission.image_urls?.slice(0, 6).map((url: string, index: number) => (
                          <div key={index} className="relative group cursor-pointer" onClick={() => setActiveTab('images')}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`이미지 ${index + 1}`}
                              className="w-full h-20 object-cover rounded border border-gray-200 group-hover:border-blue-500 transition-colors"
                            />
                            {index === 5 && submission.image_urls && submission.image_urls.length > 6 && (
                              <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  +{submission.image_urls.length - 6}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 이미지 탭 */}
          {submission.image_urls && submission.image_urls.length > 0 && (
            <TabsContent value="images" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        첨부된 이미지 ({submission.image_urls.length}개)
                      </CardTitle>
                      <CardDescription>
                        고객이 제출한 이미지 파일
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleDownloadAllImages}
                      disabled={downloadingImages}
                      variant="outline"
                    >
                      {downloadingImages ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          다운로드 중...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          전체 다운로드 (ZIP)
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {submission.image_urls.map((url: string, index: number) => (
                      <div key={index} className="relative group">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`첨부 이미지 ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:border-sky-500 transition-colors cursor-pointer"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">
                              새 탭에서 열기
                            </span>
                          </div>
                        </a>
                        <div className="absolute bottom-2 right-2">
                          <a
                            href={url}
                            download
                            className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4 text-gray-700" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* 블로거 관리 탭 */}
          <TabsContent value="bloggers" className="space-y-6">
            {/* Progress Card */}
            <ProgressCard submission={submission} bloggers={bloggers} progressPercentage={progressPercentage} />

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {!submission.bloggers_registered && (
                <Button onClick={() => setRegisterDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  블로거 등록 (Step 1)
                </Button>
              )}
              {(() => {
                const config = WORKFLOW_CONFIG[submission.experience_type];
                const hasSelection = config?.hasSelection ?? true;
                const canShowSchedule = hasSelection
                  ? submission.bloggers_selected && !submission.schedule_confirmed
                  : submission.bloggers_registered && !submission.schedule_confirmed;

                return canShowSchedule ? (
                  <Button
                    onClick={() => setScheduleDialogOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg"
                    size="lg"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    방문 일정 등록 (Step {hasSelection ? '3' : '2'})
                  </Button>
                ) : null;
              })()}
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // This will be handled by RegisterBloggersDialog
                              // For now, just show reupload dialog
                            }
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
                        onClick={openBulkDeleteDialog}
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
                  onToggleSelect={toggleBloggerSelection}
                  onToggleSelectAll={toggleSelectAll}
                  onDelete={openDeleteDialog}
                  onPublish={(blogger) => {
                    setSelectedBlogger(blogger);
                    setPublishDialogOpen(true);
                  }}
                  onRankings={(blogger) => {
                    setSelectedBlogger(blogger);
                    setRankingsDialogOpen(true);
                  }}
                  deleteLoading={deleteLoading}
                  deletingBloggerId={bloggerToDelete?.id}
                  experienceType={submission.experience_type}
                />
              </CardContent>
            </Card>
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
