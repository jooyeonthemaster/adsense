'use client';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Search, ExternalLink, Loader2, Eye, List, Grid3x3, Building2, ChevronDown, CalendarIcon, X, Copy, Check, MoreVertical } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useRewardManagement } from '@/hooks/admin/useRewardManagement';
import { statusConfig } from '@/components/admin/reward-management';

export default function RewardManagementPage() {
  const {
    loading,
    searchQuery,
    statusFilter,
    copiedId,
    viewMode,
    expandedGroups,
    createdDateFilter,
    startDateFilter,
    filteredSubmissions,
    groupedData,
    stats,
    setSearchQuery,
    setStatusFilter,
    setViewMode,
    setCreatedDateFilter,
    setStartDateFilter,
    handleStatusChange,
    copyToClipboard,
    toggleGroup,
    formatDate,
  } = useRewardManagement();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const grouped = groupedData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">리워드 관리</h1>
        <p className="text-muted-foreground">
          플레이스 유입(리워드) 캠페인을 관리하세요
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 접수</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 비용</CardDescription>
            <CardTitle className="text-3xl">{stats.total_cost.toLocaleString()}P</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>진행중</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.in_progress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>완료</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="업체명, MID, 거래처명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">확인중</SelectItem>
              <SelectItem value="approved">접수완료</SelectItem>
              <SelectItem value="in_progress">구동중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="cancelled">중단됨</SelectItem>
            </SelectContent>
          </Select>

          {/* 접수일 캘린더 필터 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-40 justify-start text-left font-normal">
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
              <Button variant="outline" className="w-full sm:w-40 justify-start text-left font-normal">
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
              그룹 (거래처별)
            </Button>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>접수번호</TableHead>
                <TableHead>업체명</TableHead>
                <TableHead>거래처</TableHead>
                <TableHead>MID</TableHead>
                <TableHead className="text-center">일 접수량</TableHead>
                <TableHead className="text-center">구동일수</TableHead>
                <TableHead className="text-center">진행률</TableHead>
                <TableHead className="text-center">상태</TableHead>
                <TableHead>접수일</TableHead>
                <TableHead className="text-right">비용</TableHead>
                <TableHead className="text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => {
                  const statusDisplay = statusConfig[submission.status] || { label: submission.status, variant: 'outline' as const };
                  const progress = submission.progress_percentage || 0;

                  return (
                    <TableRow key={submission.id}>
                      <TableCell>
                        {submission.submission_number ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">{submission.submission_number}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => copyToClipboard(submission.submission_number!)}
                            >
                              {copiedId === submission.submission_number ? (
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{submission.company_name}</span>
                          <a
                            href={submission.place_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.clients?.company_name || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {submission.place_mid || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {submission.daily_count.toLocaleString()}타
                      </TableCell>
                      <TableCell className="text-center">
                        {submission.total_days}일
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-500 rounded-full h-2 transition-all"
                              style={{ width: `${Math.min(Math.round(progress), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-emerald-600">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusDisplay.variant} className="text-xs">
                          {statusDisplay.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(submission.created_at)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {submission.total_points.toLocaleString()}P
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/reward/${submission.id}`}>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              상세
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'in_progress')}>
                                구동중으로 변경
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'completed')}>
                                완료로 변경
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'cancelled')}>
                                중단으로 변경
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {/* Group View */}
      {viewMode === 'group' && grouped && (
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
                        <Building2 className="h-5 w-5 text-emerald-500" />
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <CardDescription>
                            {group.count}개 접수 • 진행중 {group.inProgress}개 • 완료 {group.completed}개
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">{group.totalCost.toLocaleString()} P</p>
                          <p className="text-xs text-muted-foreground">총 사용 포인트</p>
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
                            <TableHead>MID</TableHead>
                            <TableHead className="text-center">일 접수량</TableHead>
                            <TableHead className="text-center">구동일수</TableHead>
                            <TableHead className="text-center">진행률</TableHead>
                            <TableHead className="text-center">상태</TableHead>
                            <TableHead>접수일</TableHead>
                            <TableHead className="text-right">비용</TableHead>
                            <TableHead className="text-center">액션</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((submission) => {
                            const statusDisplay = statusConfig[submission.status] || { label: submission.status, variant: 'outline' as const };
                            const progress = submission.progress_percentage || 0;

                            return (
                              <TableRow key={submission.id}>
                                <TableCell>
                                  {submission.submission_number ? (
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono text-xs">{submission.submission_number}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0"
                                        onClick={() => copyToClipboard(submission.submission_number!)}
                                      >
                                        {copiedId === submission.submission_number ? (
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
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{submission.company_name}</span>
                                    <a
                                      href={submission.place_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:text-blue-600"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {submission.place_mid || '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  {submission.daily_count.toLocaleString()}타
                                </TableCell>
                                <TableCell className="text-center">
                                  {submission.total_days}일
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-emerald-500 rounded-full h-2 transition-all"
                                        style={{ width: `${Math.min(Math.round(progress), 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600">
                                      {Math.round(progress)}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={statusDisplay.variant} className="text-xs">
                                    {statusDisplay.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(submission.created_at)}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {submission.total_points.toLocaleString()}P
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Link href={`/admin/reward/${submission.id}`}>
                                      <Button variant="outline" size="sm" className="h-7 px-2">
                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                        상세
                                      </Button>
                                    </Link>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'in_progress')}>
                                          구동중으로 변경
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'completed')}>
                                          완료로 변경
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'cancelled')}>
                                          중단으로 변경
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
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
