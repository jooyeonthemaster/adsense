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
import { Search, ExternalLink, MessageSquare, Image, AlertCircle, Clock, CheckCircle, Building2, ChevronDown, CalendarIcon, X, Copy, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { KAKAOMAP_STATUS_LABELS } from '@/config/kakaomap-status';

interface KakaomapSubmission {
  id: string;
  submission_number: string;
  company_name: string;
  kakaomap_url: string;
  total_count: number;
  daily_count: number;
  has_photo: boolean;
  photo_ratio: number;
  star_rating: string;
  script_type: string;
  total_points: number;
  status: string;
  created_at: string;
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  };
  content_items_count: number;
  unread_messages_count: number;
  pending_revision_count: number;
  actual_count_total: number;
}

// 상태 라벨은 공통 설정 사용 (KAKAOMAP_STATUS_LABELS)

const starRatingConfig: Record<string, { label: string; icon: string }> = {
  mixed: { label: '혼합', icon: '⭐' },
  five: { label: '5점만', icon: '⭐⭐⭐⭐⭐' },
  four: { label: '4점만', icon: '⭐⭐⭐⭐' },
};

export function KakaomapManagementTable({ submissions }: { submissions: KakaomapSubmission[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contentFilter, setContentFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'list' | 'client'>('list');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calendar filter states
  const [createdDateFilter, setCreatedDateFilter] = useState<Date | undefined>();
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>();

  // Copy submission number to clipboard
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

  // Apply filters
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.clients?.company_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    let matchesContent = true;
    if (contentFilter === 'needs_upload') {
      matchesContent = sub.content_items_count < sub.total_count;
    } else if (contentFilter === 'needs_review') {
      matchesContent = sub.status === 'review';
    } else if (contentFilter === 'has_messages') {
      matchesContent = sub.unread_messages_count > 0;
    } else if (contentFilter === 'has_revision') {
      matchesContent = sub.pending_revision_count > 0;
    }

    // 접수일 필터
    let matchesCreatedDate = true;
    if (createdDateFilter) {
      const filterStart = new Date(createdDateFilter);
      filterStart.setHours(0, 0, 0, 0);
      const filterEnd = new Date(createdDateFilter);
      filterEnd.setHours(23, 59, 59, 999);
      const createdAt = new Date(sub.created_at);
      matchesCreatedDate = createdAt >= filterStart && createdAt <= filterEnd;
    }

    // 구동일 필터 (선택한 날짜가 구동 기간 내에 포함되는지 확인)
    let matchesStartDate = true;
    if (startDateFilter) {
      const selectedDate = new Date(startDateFilter);
      selectedDate.setHours(0, 0, 0, 0);

      // 구동 시작일 (카카오맵은 접수일 = 구동 시작일)
      const runStartDate = new Date(sub.created_at);
      runStartDate.setHours(0, 0, 0, 0);

      // 구동 종료일 = 시작일 + 예상 구동일수 - 1
      const estimatedDays = Math.ceil(sub.total_count / sub.daily_count);
      const runEndDate = new Date(runStartDate);
      runEndDate.setDate(runEndDate.getDate() + estimatedDays - 1);
      runEndDate.setHours(23, 59, 59, 999);

      // 선택한 날짜가 구동 기간 내에 있는지 확인
      matchesStartDate = selectedDate >= runStartDate && selectedDate <= runEndDate;
    }

    return matchesSearch && matchesStatus && matchesContent && matchesCreatedDate && matchesStartDate;
  });

  // Group by client
  const groupedData = () => {
    if (groupBy === 'list') return null;

    const groups = new Map<string, KakaomapSubmission[]>();
    filteredSubmissions.forEach((sub) => {
      const key = sub.clients?.company_name || '거래처 없음';
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
      inProgress: items.filter(i => ['pending', 'waiting_content', 'in_progress', 'review'].includes(i.status)).length,
      completed: items.filter(i => i.status === 'completed').length,
      needsUpload: items.filter(i => i.content_items_count < i.total_count).length,
      unreadMessages: items.reduce((sum, i) => sum + i.unread_messages_count, 0),
    }));
  };

  // Calculate stats
  const stats = {
    total: submissions.length,
    needs_upload: submissions.filter((s) => s.content_items_count < s.total_count).length,
    needs_review: submissions.filter((s) => s.status === 'review').length,
    in_progress: submissions.filter((s) => ['pending', 'waiting_content', 'in_progress'].includes(s.status)).length,
    completed: submissions.filter((s) => s.status === 'completed').length,
    total_cost: submissions.reduce((sum, s) => sum + s.total_points, 0),
    unread_messages: submissions.reduce((sum, s) => sum + s.unread_messages_count, 0),
  };

  const getProgressPercentage = (sub: KakaomapSubmission) => {
    return Math.round((sub.content_items_count / sub.total_count) * 100);
  };

  // 진행률 바 너비용 (최대 100%로 제한)
  const getProgressBarWidth = (sub: KakaomapSubmission) => {
    return Math.min(getProgressPercentage(sub), 100);
  };

  const grouped = groupedData();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 캠페인</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              진행중 {stats.in_progress}개 · 완료 {stats.completed}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>콘텐츠 업로드 필요</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.needs_upload}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              업로드가 필요한 캠페인
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>검수 대기</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.needs_review}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              클라이언트 검수 필요
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>읽지 않은 메시지</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.unread_messages}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              클라이언트 메시지 확인
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="상품명 또는 거래처로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="pending">{KAKAOMAP_STATUS_LABELS.pending.label}</SelectItem>
                <SelectItem value="waiting_content">{KAKAOMAP_STATUS_LABELS.waiting_content.label}</SelectItem>
                <SelectItem value="review">{KAKAOMAP_STATUS_LABELS.review.label}</SelectItem>
                <SelectItem value="revision_requested">{KAKAOMAP_STATUS_LABELS.revision_requested.label}</SelectItem>
                <SelectItem value="in_progress">{KAKAOMAP_STATUS_LABELS.in_progress.label}</SelectItem>
                <SelectItem value="completed">{KAKAOMAP_STATUS_LABELS.completed.label}</SelectItem>
                <SelectItem value="cancelled">{KAKAOMAP_STATUS_LABELS.cancelled.label}</SelectItem>
              </SelectContent>
            </Select>

            {/* Content Filter */}
            <Select value={contentFilter} onValueChange={setContentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="작업 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 작업</SelectItem>
                <SelectItem value="needs_upload">업로드 필요</SelectItem>
                <SelectItem value="needs_review">검수 필요</SelectItem>
                <SelectItem value="has_messages">읽지 않은 메시지</SelectItem>
                <SelectItem value="has_revision">수정 요청</SelectItem>
              </SelectContent>
            </Select>

            {/* Group By */}
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'list' | 'client')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="보기 방식" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">리스트</SelectItem>
                <SelectItem value="client">거래처별</SelectItem>
              </SelectContent>
            </Select>

            {/* 접수일 캘린더 필터 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[140px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {createdDateFilter ? format(createdDateFilter, 'MM/dd', { locale: ko }) : '접수일'}
                  {createdDateFilter && (
                    <X
                      className="ml-auto h-4 w-4 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreatedDateFilter(undefined);
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={createdDateFilter}
                  onSelect={setCreatedDateFilter}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* 구동일 캘린더 필터 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[140px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDateFilter ? format(startDateFilter, 'MM/dd', { locale: ko }) : '구동일'}
                  {startDateFilter && (
                    <X
                      className="ml-auto h-4 w-4 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStartDateFilter(undefined);
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDateFilter}
                  onSelect={setStartDateFilter}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent>
          {grouped ? (
            // Grouped View
            <div className="space-y-4">
              {grouped.map((group) => (
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
                            <Building2 className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle>{group.name}</CardTitle>
                              <CardDescription>
                                {group.count}개 캠페인 · {group.totalCost.toLocaleString()}P
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                              <Badge variant="default">{group.inProgress}개 진행중</Badge>
                              <Badge variant="secondary">{group.completed}개 완료</Badge>
                              {group.needsUpload > 0 && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  {group.needsUpload}개 업로드 필요
                                </Badge>
                              )}
                              {group.unreadMessages > 0 && (
                                <Badge variant="destructive">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {group.unreadMessages}
                                </Badge>
                              )}
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
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>접수번호</TableHead>
                            <TableHead>상품명</TableHead>
                            <TableHead className="text-center">상태</TableHead>
                            <TableHead className="text-center">콘텐츠 진행</TableHead>
                            <TableHead className="text-center">수량</TableHead>
                            <TableHead className="text-center">옵션</TableHead>
                            <TableHead className="text-right">비용</TableHead>
                            <TableHead className="text-center">알림</TableHead>
                            <TableHead className="text-center">관리</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((sub) => (
                            <TableRow key={sub.id}>
                              {/* 접수번호 */}
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-mono text-muted-foreground">
                                    {sub.submission_number || '-'}
                                  </span>
                                  {sub.submission_number && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => copyToClipboard(sub.submission_number)}
                                    >
                                      {copiedId === sub.submission_number ? (
                                        <Check className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>

                              {/* 상품명 */}
                              <TableCell>
                                <div className="flex flex-col">
                                  <div className="font-medium">{sub.company_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                                  </div>
                                </div>
                              </TableCell>

                              {/* 상태 */}
                              <TableCell className="text-center">
                                <Badge variant={KAKAOMAP_STATUS_LABELS[sub.status as keyof typeof KAKAOMAP_STATUS_LABELS]?.variant || 'outline'}>
                                  {KAKAOMAP_STATUS_LABELS[sub.status as keyof typeof KAKAOMAP_STATUS_LABELS]?.label || sub.status}
                                </Badge>
                              </TableCell>

                              {/* 콘텐츠 진행 */}
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-1">
                                    <Image className="h-3 w-3" />
                                    <span className="text-sm font-medium">
                                      {sub.content_items_count} / {sub.total_count}
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all"
                                      style={{ width: `${getProgressBarWidth(sub)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {getProgressPercentage(sub)}%
                                  </span>
                                </div>
                              </TableCell>

                              {/* 수량 */}
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-sm font-medium">{sub.total_count}타</span>
                                  <span className="text-xs text-muted-foreground">
                                    {sub.daily_count}타/일
                                  </span>
                                </div>
                              </TableCell>

                              {/* 옵션 */}
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {sub.has_photo && (
                                    <Badge variant="outline" className="text-xs">
                                      사진 {sub.photo_ratio}%
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {starRatingConfig[sub.star_rating]?.label || sub.star_rating}
                                  </Badge>
                                </div>
                              </TableCell>

                              {/* 비용 */}
                              <TableCell className="text-right font-medium">
                                {sub.total_points.toLocaleString()}P
                              </TableCell>

                              {/* 알림 */}
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {sub.unread_messages_count > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      {sub.unread_messages_count}
                                    </Badge>
                                  )}
                                  {sub.pending_revision_count > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      수정 {sub.pending_revision_count}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>

                              {/* 관리 */}
                              <TableCell className="text-center">
                                <Button asChild size="sm" variant="outline">
                                  <Link href={`/admin/kakaomap/${sub.id}`}>
                                    관리
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          ) : (
            // List View
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>접수번호</TableHead>
                    <TableHead>거래처</TableHead>
                    <TableHead>상품명</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="text-center">콘텐츠 진행</TableHead>
                    <TableHead className="text-center">수량</TableHead>
                    <TableHead className="text-center">옵션</TableHead>
                    <TableHead className="text-right">비용</TableHead>
                    <TableHead className="text-center">알림</TableHead>
                    <TableHead className="text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' || contentFilter !== 'all'
                          ? '검색 결과가 없습니다.'
                          : '카카오맵 접수 내역이 없습니다.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <TableRow key={sub.id}>
                        {/* 접수번호 */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-mono text-muted-foreground">
                              {sub.submission_number || '-'}
                            </span>
                            {sub.submission_number && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(sub.submission_number)}
                              >
                                {copiedId === sub.submission_number ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>

                        {/* 거래처 */}
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium">{sub.clients?.company_name || '-'}</div>
                            {sub.clients?.contact_person && (
                              <div className="text-xs text-muted-foreground">{sub.clients.contact_person}</div>
                            )}
                          </div>
                        </TableCell>

                        {/* 상품명 */}
                        <TableCell>
                          <div className="flex flex-col max-w-[200px]">
                            <div className="font-medium truncate">{sub.company_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </TableCell>

                        {/* 상태 */}
                        <TableCell className="text-center">
                          <Badge variant={KAKAOMAP_STATUS_LABELS[sub.status as keyof typeof KAKAOMAP_STATUS_LABELS]?.variant || 'outline'}>
                            {KAKAOMAP_STATUS_LABELS[sub.status as keyof typeof KAKAOMAP_STATUS_LABELS]?.label || sub.status}
                          </Badge>
                        </TableCell>

                        {/* 콘텐츠 진행 */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              <Image className="h-3 w-3" />
                              <span className="text-sm font-medium">
                                {sub.content_items_count} / {sub.total_count}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className="bg-primary rounded-full h-1.5 transition-all"
                                style={{ width: `${getProgressBarWidth(sub)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {getProgressPercentage(sub)}%
                            </span>
                          </div>
                        </TableCell>

                        {/* 수량 */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-medium">{sub.total_count}타</span>
                            <span className="text-xs text-muted-foreground">
                              {sub.daily_count}타/일
                            </span>
                          </div>
                        </TableCell>

                        {/* 옵션 */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {sub.has_photo && (
                              <Badge variant="outline" className="text-xs">
                                사진 {sub.photo_ratio}%
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {starRatingConfig[sub.star_rating]?.label || sub.star_rating}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* 비용 */}
                        <TableCell className="text-right font-medium">
                          {sub.total_points.toLocaleString()}P
                        </TableCell>

                        {/* 알림 */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {sub.unread_messages_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {sub.unread_messages_count}
                              </Badge>
                            )}
                            {sub.pending_revision_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                수정 {sub.pending_revision_count}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* 관리 */}
                        <TableCell className="text-center">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/kakaomap/${sub.id}`}>
                              관리
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredSubmissions.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              총 {filteredSubmissions.length}개의 캠페인 · 총 비용{' '}
              {filteredSubmissions.reduce((sum, s) => sum + s.total_points, 0).toLocaleString()}P
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
