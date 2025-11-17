'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  TrendingUp,
  MessageCircle,
  AlertCircle,
  Loader2,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WORKFLOW_CONFIG } from '@/types/experience-blogger';
import { getWorkflowSteps } from '@/lib/experience-deadline-utils';

interface ExperienceSubmission {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string | null;
  experience_type: string;
  team_count: number;
  keywords: string[] | null;
  guide_text: string | null;
  bloggers_registered: boolean;
  bloggers_selected: boolean;
  schedule_confirmed: boolean;
  client_confirmed: boolean;
  all_published: boolean;
  campaign_completed: boolean;
  total_points: number;
  status: string;
  created_at: string;
}

interface ExperienceBlogger {
  id: string;
  name: string;
  blog_url: string;
  index_score: number;
  selected_by_client: boolean;
  visit_date: string | null;
  visit_time: string | null;
  visit_count: number | null;
  client_confirmed: boolean;
  published: boolean;
  published_url: string | null;
  keyword_rankings?: KeywordRanking[];
}

interface KeywordRanking {
  keyword: string;
  rank: number;
  checked_at: string;
}

const experienceTypeLabels: Record<string, string> = {
  'blog-experience': '블로그 체험단',
  'xiaohongshu': '샤오홍슈',
  'journalist': '기자단',
  'influencer': '인플루언서',
};

export default function ClientExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<ExperienceSubmission | null>(null);
  const [bloggers, setBloggers] = useState<ExperienceBlogger[]>([]);

  // Blogger selection (Step 2)
  const [selectedBloggerIds, setSelectedBloggerIds] = useState<string[]>([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);

  // Blogger filtering and sorting
  const [bloggerSortBy, setBloggerSortBy] = useState<'index-high' | 'index-low' | 'name'>('index-high');
  const [bloggerFilter, setBloggerFilter] = useState<'all' | '700+' | '800+' | '900+'>('all');

  // Schedule confirmation (Step 4)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [unwrappedParams.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/experience/${unwrappedParams.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setSubmission(data.submission);
      setBloggers(data.bloggers || []);

      // Initialize selected bloggers
      const selected = (data.bloggers || [])
        .filter((b: ExperienceBlogger) => b.selected_by_client)
        .map((b: ExperienceBlogger) => b.id);
      setSelectedBloggerIds(selected);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: '데이터 로드 실패',
        description: '체험단 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select bloggers
  const handleSelectBloggers = async () => {
    if (selectedBloggerIds.length === 0) {
      toast({
        title: '선택 오류',
        description: '최소 1명의 블로거를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSelectLoading(true);
      const response = await fetch(
        `/api/client/experience/${unwrappedParams.id}/select-bloggers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blogger_ids: selectedBloggerIds }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to select bloggers');
      }

      toast({
        title: '블로거 선택 완료',
        description: `${selectedBloggerIds.length}명의 블로거를 선택했습니다.`,
      });

      setSelectDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error selecting bloggers:', error);
      toast({
        title: '선택 실패',
        description: '블로거 선택에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSelectLoading(false);
    }
  };

  // Step 4: Confirm schedule
  const handleConfirmSchedule = async () => {
    try {
      setConfirmLoading(true);
      const response = await fetch(
        `/api/client/experience/${unwrappedParams.id}/confirm-schedule`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmed: true }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[confirm-schedule] API error:', errorData);
        throw new Error(errorData.error || 'Failed to confirm schedule');
      }

      const data = await response.json();
      console.log('[confirm-schedule] Success:', data);

      toast({
        title: '일정 확인 완료',
        description: '방문 일정을 확인했습니다.',
      });

      setConfirmDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error confirming schedule:', error);
      toast({
        title: '확인 실패',
        description: error.message || '일정 확인에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const toggleBloggerSelection = (bloggerId: string) => {
    setSelectedBloggerIds((prev) =>
      prev.includes(bloggerId)
        ? prev.filter((id) => id !== bloggerId)
        : [...prev, bloggerId]
    );
  };

  // Quick selection functions
  const selectAllBloggers = () => {
    setSelectedBloggerIds(bloggers.map((b) => b.id));
  };

  const deselectAllBloggers = () => {
    setSelectedBloggerIds([]);
  };

  const selectTopN = (n: number) => {
    const sortedByIndex = [...bloggers].sort((a, b) => b.index_score - a.index_score);
    setSelectedBloggerIds(sortedByIndex.slice(0, n).map((b) => b.id));
  };

  // Filter and sort bloggers
  const getFilteredAndSortedBloggers = () => {
    let filtered = [...bloggers];

    // Apply filter
    if (bloggerFilter === '700+') {
      filtered = filtered.filter((b) => b.index_score >= 700);
    } else if (bloggerFilter === '800+') {
      filtered = filtered.filter((b) => b.index_score >= 800);
    } else if (bloggerFilter === '900+') {
      filtered = filtered.filter((b) => b.index_score >= 900);
    }

    // Apply sort
    if (bloggerSortBy === 'index-high') {
      filtered.sort((a, b) => b.index_score - a.index_score);
    } else if (bloggerSortBy === 'index-low') {
      filtered.sort((a, b) => a.index_score - b.index_score);
    } else if (bloggerSortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }

    return filtered;
  };

  const getCurrentStep = (): number => {
    if (!submission) return 1;

    const workflowSteps = getWorkflowSteps(submission.experience_type);

    // Find which step we're currently on
    for (let i = 0; i < workflowSteps.length; i++) {
      const stepType = workflowSteps[i];
      let isCompleted = false;

      switch (stepType) {
        case 'register':
          isCompleted = submission.bloggers_registered;
          break;
        case 'selection':
          isCompleted = submission.bloggers_selected;
          break;
        case 'schedule':
          isCompleted = submission.schedule_confirmed;
          break;
        case 'client_confirm':
          isCompleted = submission.client_confirmed;
          break;
        case 'publish':
          isCompleted = submission.all_published;
          break;
        case 'keyword_ranking':
          isCompleted = submission.all_published; // 발행 후 키워드 순위 체크
          break;
        case 'complete':
          isCompleted = submission.campaign_completed;
          break;
      }

      // If this step is not completed, this is the current step
      if (!isCompleted) {
        return i + 1;
      }
    }

    // All steps completed
    return workflowSteps.length;
  };

  const getStepStatus = (stepNumber: number): 'completed' | 'current' | 'upcoming' => {
    const currentStep = getCurrentStep();
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

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
            <Link href="/dashboard/submissions">
              <Button>목록으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = getCurrentStep();

  // Get dynamic workflow steps based on experience type
  const workflowSteps = getWorkflowSteps(submission.experience_type);
  const config = WORKFLOW_CONFIG[submission.experience_type];

  // Get bloggers for schedule confirmation based on workflow type
  const selectedBloggers = config?.hasSelection
    ? bloggers.filter((b) => b.selected_by_client)  // Blog: only selected bloggers
    : bloggers;  // Xiaohongshu, Journalist, Influencer: all registered bloggers
  const publishedCount = selectedBloggers.filter((b) => b.published).length;

  // Define step labels
  const stepLabels: Record<string, { label: string; description: string }> = {
    register: { label: '블로거 등록', description: '관리자가 블로거 목록 등록' },
    selection: { label: '블로거 선택', description: '고객이 원하는 블로거 선택' },
    schedule: { label: '일정 등록', description: '관리자가 방문 일정 등록' },
    client_confirm: { label: '일정 확인', description: '고객이 방문 일정 확인' },
    publish: { label: '컨텐츠 발행', description: '블로거들이 리뷰 작성' },
    keyword_ranking: { label: '키워드 순위', description: '노출 순위 확인' },
    complete: { label: '캠페인 완료', description: '모든 작업 완료' },
  };

  // Build dynamic steps array
  const steps = workflowSteps.map((stepType, index) => ({
    number: index + 1,
    label: stepLabels[stepType]?.label || stepType,
    description: stepLabels[stepType]?.description || '',
  }));

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/submissions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{submission.company_name}</h1>
            <p className="text-sm text-gray-500">
              {experienceTypeLabels[submission.experience_type]} • {submission.team_count}명 체험단
            </p>
          </div>
          <Badge variant={submission.campaign_completed ? 'secondary' : 'default'} className="text-sm">
            {submission.campaign_completed ? '완료' : '진행중'}
          </Badge>
        </div>

        {/* Campaign Info */}
        <Card>
          <CardHeader>
            <CardTitle>캠페인 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {/* 체험단 유형 */}
              <div className="bg-white p-4">
                <p className="text-sm text-gray-500 mb-1">체험단 유형</p>
                <p className="font-medium">{experienceTypeLabels[submission.experience_type]}</p>
              </div>

              {/* 모집 인원 */}
              <div className="bg-white p-4">
                <p className="text-sm text-gray-500 mb-1">모집 인원</p>
                <p className="font-medium">{submission.team_count}명</p>
              </div>

              {/* 신청일 */}
              <div className="bg-white p-4">
                <p className="text-sm text-gray-500 mb-1">신청일</p>
                <p className="font-medium">
                  {new Date(submission.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* 사용 포인트 */}
              <div className="bg-white p-4">
                <p className="text-sm text-gray-500 mb-1">사용 포인트</p>
                <p className="font-semibold text-violet-600">{submission.total_points.toLocaleString()}P</p>
              </div>

              {/* 타겟 키워드 - 전체 너비 */}
              {submission.keywords && submission.keywords.length > 0 && (
                <div className="bg-white p-4 md:col-span-2">
                  <p className="text-sm text-gray-500 mb-2">타겟 키워드</p>
                  <div className="flex flex-wrap gap-2">
                    {submission.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 안내사항 - 파싱해서 2열 그리드 */}
              {submission.guide_text && (() => {
                const lines = submission.guide_text.split('\n');
                const sections: { title: string; content: string }[] = [];
                let currentTitle = '';
                let currentContent: string[] = [];

                lines.forEach((line, idx) => {
                  const trimmed = line.trim();
                  if (trimmed.match(/^\[.+\]$/)) {
                    // 새로운 섹션 시작
                    if (currentTitle && currentContent.length > 0) {
                      sections.push({ title: currentTitle, content: currentContent.join('\n') });
                    }
                    currentTitle = trimmed.replace(/^\[|\]$/g, '');
                    currentContent = [];
                  } else if (trimmed) {
                    currentContent.push(trimmed);
                  }
                });
                // 마지막 섹션 추가
                if (currentTitle && currentContent.length > 0) {
                  sections.push({ title: currentTitle, content: currentContent.join('\n') });
                }

                // 방문가능요일과 방문가능시간을 합치기
                const visitDaysIdx = sections.findIndex(s => s.title === '방문가능요일' || s.title === '방문가능일');
                const visitTimeIdx = sections.findIndex(s => s.title === '방문가능시간');

                if (visitDaysIdx !== -1 && visitTimeIdx !== -1) {
                  // 두 섹션을 하나로 합치기
                  sections[visitDaysIdx].content = `${sections[visitDaysIdx].content} / ${sections[visitTimeIdx].content}`;
                  // 방문가능시간 섹션 제거
                  sections.splice(visitTimeIdx, 1);
                }

                return sections.length > 0 ? (
                  <>
                    {sections.map((section, idx) => (
                      <div key={idx} className="bg-white p-4">
                        <p className="text-sm text-gray-500 mb-1">{section.title}</p>
                        <p className="text-sm font-medium">{section.content}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="bg-white p-4 md:col-span-2">
                    <p className="text-sm text-gray-500 mb-2">안내사항</p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{submission.guide_text}</p>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps - Horizontal Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>캠페인 진행 상황</CardTitle>
            <CardDescription>현재 {currentStep}/{steps.length} 단계 진행중</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress bar background */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 hidden md:block" style={{ left: '2.5rem', right: '2.5rem' }} />
              {/* Progress bar filled */}
              <div
                className="absolute top-5 left-0 h-1 bg-violet-500 hidden md:block transition-all duration-500"
                style={{
                  left: '2.5rem',
                  width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 2.5rem)`
                }}
              />

              {/* Steps */}
              <div className="grid grid-cols-2 md:flex md:justify-between gap-4 md:gap-2 relative">
                {steps.map((step) => {
                  const status = getStepStatus(step.number);
                  return (
                    <div key={step.number} className="flex flex-col items-center text-center">
                      {/* Step circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 relative z-10 ${
                          status === 'completed'
                            ? 'bg-green-500 text-white'
                            : status === 'current'
                            ? 'bg-violet-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : status === 'current' ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <span className="text-sm">{step.number}</span>
                        )}
                      </div>

                      {/* Step label */}
                      <p
                        className={`text-sm font-semibold mb-1 ${
                          status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {step.label}
                      </p>

                      {/* Status badge */}
                      {status === 'completed' && (
                        <Badge variant="secondary" className="text-xs">
                          완료
                        </Badge>
                      )}
                      {status === 'current' && (
                        <Badge variant="default" className="text-xs">
                          진행중
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Blogger Selection - Only for types with hasSelection */}
        {config?.hasSelection && submission.bloggers_registered && !submission.bloggers_selected && (
          <Card className="border-violet-200 bg-violet-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600" />
                블로거 선택이 필요합니다
              </CardTitle>
              <CardDescription>
                관리자가 등록한 블로거 목록에서 원하시는 분들을 선택해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setSelectDialogOpen(true)} className="bg-violet-600">
                <Users className="h-4 w-4 mr-2" />
                블로거 선택하기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Schedule Confirmation */}
        {submission.schedule_confirmed && !submission.client_confirmed && (
          <Card className="border-violet-200 bg-violet-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-600" />
                방문 일정 확인이 필요합니다
              </CardTitle>
              <CardDescription>
                관리자가 등록한 방문 일정을 확인하고 승인해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => setConfirmDialogOpen(true)} className="bg-violet-600">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                일정 확인 및 승인
              </Button>
              <Link href="/dashboard/cs">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  일정 조율 요청 (1:1 문의)
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Bloggers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>블로거 목록</CardTitle>
                <CardDescription>
                  {bloggers.length}명 등록
                  {selectedBloggers.length > 0 && ` • ${selectedBloggers.length}명 선택됨`}
                  {publishedCount > 0 && ` • ${publishedCount}명 발행완료`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {bloggers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>아직 등록된 블로거가 없습니다.</p>
                <p className="text-sm">관리자가 블로거를 등록하면 여기에 표시됩니다.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>블로그 지수</TableHead>
                    {config?.hasSelection && <TableHead>선택 상태</TableHead>}
                    <TableHead>방문 일정</TableHead>
                    <TableHead>발행 상태</TableHead>
                    {config?.hasKeywordRanking && <TableHead>키워드 순위</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bloggers.map((blogger) => (
                    <TableRow key={blogger.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{blogger.name}</span>
                          <a
                            href={blogger.blog_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-500"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                          {blogger.index_score}
                        </div>
                      </TableCell>
                      {config?.hasSelection && (
                        <TableCell>
                          {blogger.selected_by_client ? (
                            <Badge variant="default" className="text-xs">
                              선택됨
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              미선택
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {blogger.visit_date && blogger.visit_time ? (
                          <div className="text-sm">
                            <p className="font-medium">
                              {new Date(blogger.visit_date).toLocaleDateString('ko-KR')}
                            </p>
                            <p className="text-gray-500">
                              {blogger.visit_time} • {blogger.visit_count}명
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">미정</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {blogger.published ? (
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              발행완료
                            </Badge>
                            {blogger.published_url && (
                              <a
                                href={blogger.published_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
                              >
                                <ExternalLink className="h-3 w-3" />
                                리뷰 보기
                              </a>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            대기중
                          </Badge>
                        )}
                      </TableCell>
                      {config?.hasKeywordRanking && (
                        <TableCell>
                          {blogger.keyword_rankings && blogger.keyword_rankings.length > 0 ? (
                            <div className="space-y-1">
                              {blogger.keyword_rankings.map((ranking, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{ranking.keyword}</span>
                                  <span className="text-violet-600 ml-2">{ranking.rank}위</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Blogger Selection Dialog */}
      <Dialog open={selectDialogOpen} onOpenChange={setSelectDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>블로거 선택</DialogTitle>
            <DialogDescription>
              원하시는 블로거를 선택해주세요. 선택된 블로거만 체험단에 참여합니다.
            </DialogDescription>
          </DialogHeader>

          {/* Filter and Sort Controls */}
          <div className="space-y-3 pb-3 border-b">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-500 mb-1 block">정렬 기준</label>
                <Select value={bloggerSortBy} onValueChange={(value) => setBloggerSortBy(value as any)}>
                  <SelectTrigger className="h-9">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="index-high">블로그 지수 높은 순</SelectItem>
                    <SelectItem value="index-low">블로그 지수 낮은 순</SelectItem>
                    <SelectItem value="name">이름순 (가나다)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-500 mb-1 block">필터</label>
                <Select value={bloggerFilter} onValueChange={(value) => setBloggerFilter(value as any)}>
                  <SelectTrigger className="h-9">
                    <Filter className="h-3.5 w-3.5 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 블로거</SelectItem>
                    <SelectItem value="700+">700 이상</SelectItem>
                    <SelectItem value="800+">800 이상</SelectItem>
                    <SelectItem value="900+">900 이상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllBloggers}
                className="h-8 text-xs"
              >
                전체 선택
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={deselectAllBloggers}
                className="h-8 text-xs"
              >
                선택 해제
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => selectTopN(3)}
                className="h-8 text-xs"
              >
                상위 3명
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => selectTopN(5)}
                className="h-8 text-xs"
              >
                상위 5명
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {getFilteredAndSortedBloggers().map((blogger) => (
              <div
                key={blogger.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <Checkbox
                  id={blogger.id}
                  checked={selectedBloggerIds.includes(blogger.id)}
                  onCheckedChange={() => toggleBloggerSelection(blogger.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <label htmlFor={blogger.id} className="font-medium cursor-pointer">
                      {blogger.name}
                    </label>
                    <a
                      href={blogger.blog_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-500"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      블로그 지수: {blogger.index_score}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSelectBloggers} disabled={selectLoading} className="bg-violet-600">
              {selectLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  선택 중...
                </>
              ) : (
                `${selectedBloggerIds.length}명 선택 완료`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>방문 일정 확인</DialogTitle>
            <DialogDescription>
              아래 일정으로 진행하시겠습니까? 일정 조율이 필요하시면 1:1 문의를 이용해주세요.
            </DialogDescription>
          </DialogHeader>

          {/* 총 인원 표시 */}
          <div className="flex items-center justify-between px-3 py-2 bg-violet-50 rounded-lg border border-violet-200">
            <span className="text-sm font-medium text-violet-700">총 {selectedBloggers.length}명</span>
            <Badge variant="secondary" className="bg-violet-100 text-violet-700">
              <Calendar className="h-3 w-3 mr-1" />
              일정 배정 완료
            </Badge>
          </div>

          {/* 블로거 일정 목록 - 스크롤 + 2열 그리드 */}
          <div className="max-h-[400px] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedBloggers.map((blogger) => (
                <div
                  key={blogger.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-300 transition-colors"
                >
                  <p className="font-semibold text-sm mb-2 text-gray-900">{blogger.name}</p>
                  {blogger.visit_date && blogger.visit_time ? (
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-violet-500" />
                        <span>{new Date(blogger.visit_date).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-violet-500" />
                        <span>{blogger.visit_time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-violet-500" />
                        <span>{blogger.visit_count}명</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">일정이 아직 등록되지 않았습니다.</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="w-full sm:w-auto">
              취소
            </Button>
            <Link href="/dashboard/cs" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                조율 요청
              </Button>
            </Link>
            <Button
              onClick={handleConfirmSchedule}
              disabled={confirmLoading}
              className="bg-violet-600 w-full sm:w-auto"
            >
              {confirmLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  확인 중...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  일정 확인
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
