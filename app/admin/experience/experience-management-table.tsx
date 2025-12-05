'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, ExternalLink, Users, Sparkles, Clock, CheckCircle, List, Grid3x3, Building2, ChevronDown, Copy, Check } from 'lucide-react';
import { getExperienceStep } from '@/lib/submission-utils';
import { SubmissionStatus } from '@/types/submission';

interface ExperienceSubmission {
  id: string;
  submission_number?: string;
  company_name: string;
  product_type: 'experience';
  experience_type: string;
  team_count: number;
  total_points: number;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  bloggers_registered: boolean;
  bloggers_selected: boolean;
  schedule_confirmed: boolean;
  client_confirmed: boolean;
  all_published: boolean;
  campaign_completed: boolean;
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
  };
}

const statusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '확인중', variant: 'outline' },
  in_progress: { label: '진행중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
};

const experienceTypeConfig: Record<string, { label: string; color: string }> = {
  'blog-experience': { label: '블로그 체험단', color: 'violet' },
  xiaohongshu: { label: '샤오홍슈', color: 'red' },
  journalist: { label: '기자단', color: 'blue' },
  influencer: { label: '인플루언서', color: 'purple' },
};

export function ExperienceManagementTable({ submissions }: { submissions: ExperienceSubmission[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [groupBy, setGroupBy] = useState<'client' | 'company'>('client');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (submissionNumber: string) => {
    try {
      await navigator.clipboard.writeText(submissionNumber);
      setCopiedId(submissionNumber);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const getStatusDisplay = (sub: ExperienceSubmission) => {
    const { step, label, totalSteps } = getExperienceStep(sub);

    if (sub.campaign_completed) {
      return { label: '완료', variant: 'secondary' as const };
    }

    return {
      label: `${step}/${totalSteps} ${label}`,
      variant: 'default' as const
    };
  };

  // Apply filters
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.clients?.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesType = typeFilter === 'all' || sub.experience_type === typeFilter;

    // 진행 단계 필터
    let matchesStep = true;
    if (stepFilter !== 'all') {
      const currentStep = getExperienceStep(sub).step;
      matchesStep = currentStep === parseInt(stepFilter);
    }

    return matchesSearch && matchesStatus && matchesType && matchesStep;
  });

  // Calculate progress percentage based on actual workflow steps
  const calculateProgress = (sub: ExperienceSubmission) => {
    const { step, totalSteps } = getExperienceStep(sub);
    return Math.round((step / totalSteps) * 100);
  };

  // 그룹핑 데이터 생성
  const groupedData = () => {
    const groups = new Map<string, ExperienceSubmission[]>();

    filteredSubmissions.forEach((sub) => {
      const key = groupBy === 'client'
        ? sub.clients?.company_name || '거래처 없음'
        : sub.company_name;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(sub);
    });

    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
      totalCost: items.reduce((sum, item) => sum + item.total_points, 0),
      count: items.length,
      inProgress: items.filter(i => ['pending', 'in_progress'].includes(i.status)).length,
      completed: items.filter(i => i.status === 'completed').length,
    }));
  };

  const stats = {
    total: submissions.length,
    in_progress: submissions.filter((s) => ['pending', 'in_progress'].includes(s.status)).length,
    completed: submissions.filter((s) => s.status === 'completed').length,
    total_cost: submissions.reduce((sum, s) => sum + s.total_points, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 캠페인</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>진행중</CardDescription>
            <CardTitle className="text-3xl text-violet-600">{stats.in_progress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>완료</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 비용</CardDescription>
            <CardTitle className="text-3xl">{stats.total_cost.toLocaleString()}P</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="업체명 또는 거래처 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="체험단 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="blog-experience">블로그 체험단</SelectItem>
              <SelectItem value="xiaohongshu">샤오홍슈</SelectItem>
              <SelectItem value="journalist">기자단</SelectItem>
              <SelectItem value="influencer">인플루언서</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stepFilter} onValueChange={setStepFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="진행 단계" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 단계</SelectItem>
              <SelectItem value="1">1단계: 블로거 등록</SelectItem>
              <SelectItem value="2">2단계: 블로거 선택</SelectItem>
              <SelectItem value="3">3단계: 일정 등록</SelectItem>
              <SelectItem value="4">4단계: 일정 확인</SelectItem>
              <SelectItem value="5">5단계: 컨텐츠 발행</SelectItem>
              <SelectItem value="6">6단계: 키워드 순위</SelectItem>
              <SelectItem value="7">7단계: 캠페인 완료</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">확인중</SelectItem>
              <SelectItem value="in_progress">진행중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="cancelled">중단됨</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-2" />
              리스트
            </Button>
            <Button
              variant={viewMode === 'group' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('group')}
              className="h-8 px-3"
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              그룹
            </Button>
          </div>

          {viewMode === 'group' && (
            <Select value={groupBy} onValueChange={(value: 'client' | 'company') => setGroupBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">거래처별</SelectItem>
                <SelectItem value="company">업체별</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              체험단 캠페인 목록
            </CardTitle>
            <CardDescription>
              총 {filteredSubmissions.length}개의 캠페인
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>접수번호</TableHead>
                    <TableHead>거래처</TableHead>
                    <TableHead>업체명</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>진행률</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>접수일</TableHead>
                    <TableHead className="text-right">비용</TableHead>
                    <TableHead className="text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        검색 결과가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const progress = calculateProgress(sub);
                      const statusDisplay = getStatusDisplay(sub);
                      const typeDisplay = experienceTypeConfig[sub.experience_type] || { label: sub.experience_type, color: 'gray' };

                      return (
                        <TableRow key={sub.id} className="hover:bg-gray-50">
                          <TableCell>
                            {sub.submission_number ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs">{sub.submission_number}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => copyToClipboard(sub.submission_number!)}
                                >
                                  {copiedId === sub.submission_number ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {sub.clients?.company_name || '-'}
                          </TableCell>
                          <TableCell>{sub.company_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`bg-${typeDisplay.color}-50 text-${typeDisplay.color}-700`}>
                              {typeDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-gray-500" />
                              {sub.team_count}명
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-violet-600 h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 min-w-[2.5rem]">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusDisplay.variant}>
                              {statusDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {sub.total_points.toLocaleString()}P
                          </TableCell>
                          <TableCell className="text-center">
                            <Link href={`/admin/experience/${sub.id}`}>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                관리
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group View */}
      {viewMode === 'group' && (
        <div className="space-y-4">
          {groupedData().map((group) => (
            <Collapsible
              key={group.name}
              open={expandedGroups.has(group.name)}
              onOpenChange={() => toggleGroup(group.name)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-violet-500" />
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <CardDescription>
                            {group.count}개 캠페인 • 진행중 {group.inProgress}개 • 완료 {group.completed}개
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-violet-600">{group.totalCost.toLocaleString()}P</p>
                          <p className="text-xs text-gray-500">총 비용</p>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            expandedGroups.has(group.name) ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>접수번호</TableHead>
                        <TableHead>업체명</TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead>인원</TableHead>
                        <TableHead>진행률</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>접수일</TableHead>
                        <TableHead className="text-right">비용</TableHead>
                        <TableHead className="text-center">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((sub) => {
                        const progress = calculateProgress(sub);
                        const statusDisplay = getStatusDisplay(sub);
                        const typeDisplay = experienceTypeConfig[sub.experience_type] || { label: sub.experience_type, color: 'gray' };

                        return (
                          <TableRow key={sub.id} className="hover:bg-gray-50">
                            <TableCell>
                              {sub.submission_number ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-xs">{sub.submission_number}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={() => copyToClipboard(sub.submission_number!)}
                                  >
                                    {copiedId === sub.submission_number ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{sub.company_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`bg-${typeDisplay.color}-50 text-${typeDisplay.color}-700`}>
                                {typeDisplay.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-gray-500" />
                                {sub.team_count}명
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-violet-600 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600 min-w-[2.5rem]">{progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusDisplay.variant}>
                                {statusDisplay.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {sub.total_points.toLocaleString()}P
                            </TableCell>
                            <TableCell className="text-center">
                              <Link href={`/admin/experience/${sub.id}`}>
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                  관리
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
