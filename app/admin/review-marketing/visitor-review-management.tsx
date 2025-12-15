'use client';

import Link from 'next/link';
import { useVisitorReviewManagement } from '@/hooks/admin/useVisitorReviewManagement';
import { StatsCards, statusConfig } from '@/components/admin/visitor-review-management';
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
import { Search, ExternalLink, Image as ImageIcon, FileText, Loader2, Building2, ChevronDown, CalendarIcon, X, Copy, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function VisitorReviewManagement() {
  const {
    loading,
    searchQuery,
    statusFilter,
    groupBy,
    expandedGroups,
    copiedId,
    createdDateFilter,
    startDateFilter,
    filteredSubmissions,
    groupedData,
    stats,
    setSearchQuery,
    setStatusFilter,
    setGroupBy,
    setCreatedDateFilter,
    setStartDateFilter,
    copyToClipboard,
    toggleGroup,
    getProgressPercentage,
    getProgressBarWidth,
    getDeadline,
    handleStatusChange,
  } = useVisitorReviewManagement();

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
      {/* Stats */}
      <StatsCards stats={stats} />

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
                <SelectItem value="pending">확인중</SelectItem>
                <SelectItem value="approved">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">중단됨</SelectItem>
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
                            <TableHead>업체명</TableHead>
                            <TableHead className="text-center">수량</TableHead>
                            <TableHead className="text-center">옵션</TableHead>
                            <TableHead className="text-center">상태</TableHead>
                            <TableHead className="text-center">진행률</TableHead>
                            <TableHead className="text-center">마감일</TableHead>
                            <TableHead className="text-right">비용</TableHead>
                            <TableHead className="text-center">등록일</TableHead>
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
                              <TableCell className="font-medium">{sub.company_name}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-medium">{sub.total_count}건</span>
                                  <span className="text-xs text-muted-foreground">
                                    {sub.daily_count}건/일
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {sub.has_photo && (
                                    <Badge variant="outline" className="text-xs">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      사진
                                    </Badge>
                                  )}
                                  {sub.has_script && (
                                    <Badge variant="outline" className="text-xs">
                                      <FileText className="h-3 w-3 mr-1" />
                                      원고
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Badge
                                      variant={statusConfig[sub.status]?.variant || 'outline'}
                                      className="cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      {statusConfig[sub.status]?.label || sub.status}
                                    </Badge>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'pending')}>
                                      확인중
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'in_progress')}>
                                      구동중
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'completed')}>
                                      완료
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'cancelled')}>
                                      중단됨
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-16 bg-muted rounded-full h-2">
                                    <div
                                      className="bg-blue-600 rounded-full h-2 transition-all"
                                      style={{ width: `${getProgressBarWidth(sub)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-blue-600">
                                    {getProgressPercentage(sub)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {getDeadline(sub)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {sub.total_points.toLocaleString()}P
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button asChild size="sm" variant="outline">
                                  <Link href={`/admin/review-marketing/visitor/${sub.id}`}>
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
                    <TableHead>업체명</TableHead>
                    <TableHead className="text-center">수량</TableHead>
                    <TableHead className="text-center">옵션</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="text-center">진행률</TableHead>
                    <TableHead className="text-center">마감일</TableHead>
                    <TableHead className="text-right">비용</TableHead>
                    <TableHead className="text-center">등록일</TableHead>
                    <TableHead className="text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        {searchQuery || statusFilter !== 'all'
                          ? '검색 결과가 없습니다.'
                          : '네이버 영수증 접수 내역이 없습니다.'}
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
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium">{sub.clients?.company_name || '-'}</div>
                            {sub.clients?.contact_person && (
                              <div className="text-xs text-muted-foreground">
                                {sub.clients.contact_person}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{sub.company_name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">{sub.total_count}건</span>
                            <span className="text-xs text-muted-foreground">
                              {sub.daily_count}건/일
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {sub.has_photo && (
                              <Badge variant="outline" className="text-xs">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                사진
                              </Badge>
                            )}
                            {sub.has_script && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                원고
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Badge
                                variant={statusConfig[sub.status]?.variant || 'outline'}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                {statusConfig[sub.status]?.label || sub.status}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'pending')}>
                                확인중
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'in_progress')}>
                                구동중
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'completed')}>
                                완료
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'cancelled')}>
                                중단됨
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="bg-blue-600 rounded-full h-2 transition-all"
                                style={{ width: `${getProgressBarWidth(sub)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-blue-600">
                              {getProgressPercentage(sub)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {getDeadline(sub)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {sub.total_points.toLocaleString()}P
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/review-marketing/visitor/${sub.id}`}>
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
