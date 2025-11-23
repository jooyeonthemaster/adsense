import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { List, Grid3x3 } from 'lucide-react';

interface SubmissionsFiltersProps {
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  dateFilter: string;
  sortBy: string;
  viewMode: 'list' | 'group';
  groupBy: 'client' | 'type';
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onDateFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onViewModeChange: (mode: 'list' | 'group') => void;
  onGroupByChange: (groupBy: 'client' | 'type') => void;
}

export function SubmissionsFilters({
  searchQuery,
  typeFilter,
  statusFilter,
  dateFilter,
  sortBy,
  viewMode,
  groupBy,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onDateFilterChange,
  onSortByChange,
  onViewModeChange,
  onGroupByChange,
}: SubmissionsFiltersProps) {
  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="text-base sm:text-lg">검색 및 필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 sm:p-4 lg:p-6 pt-0">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="space-y-1">
            <Label htmlFor="search" className="text-[10px] sm:text-xs">거래처명, 업체명...</Label>
            <Input
              id="search"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 text-xs sm:text-sm"
            />
          </div>

          {/* Type filter */}
          <div className="space-y-1">
            <Label htmlFor="type-filter" className="text-[10px] sm:text-xs">상품 유형</Label>
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger id="type-filter" className="h-8 text-xs sm:text-sm">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="place">플레이스 유입</SelectItem>
                <SelectItem value="receipt">영수증 리뷰</SelectItem>
                <SelectItem value="kakaomap">카카오맵 리뷰</SelectItem>
                <SelectItem value="blog">블로그 배포</SelectItem>
                <SelectItem value="cafe">카페 침투</SelectItem>
                <SelectItem value="experience">체험단 마케팅</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <Label htmlFor="status-filter" className="text-[10px] sm:text-xs">상태</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger id="status-filter" className="h-8 text-xs sm:text-sm">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date filter */}
          <div className="space-y-1">
            <Label htmlFor="date-filter" className="text-[10px] sm:text-xs">기간</Label>
            <Select value={dateFilter} onValueChange={onDateFilterChange}>
              <SelectTrigger id="date-filter" className="h-8 text-xs sm:text-sm">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="week">최근 7일</SelectItem>
                <SelectItem value="month">최근 30일</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="space-y-1">
            <Label htmlFor="sort" className="text-[10px] sm:text-xs">정렬</Label>
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger id="sort" className="h-8 text-xs sm:text-sm">
                <SelectValue placeholder="최신순" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">최신순</SelectItem>
                <SelectItem value="date-asc">오래된순</SelectItem>
                <SelectItem value="points-desc">포인트 높은순</SelectItem>
                <SelectItem value="points-asc">포인트 낮은순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-7 px-2 sm:px-3 text-xs"
            >
              <List className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
              리스트
            </Button>
            <Button
              variant={viewMode === 'group' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('group')}
              className="h-7 px-2 sm:px-3 text-xs"
            >
              <Grid3x3 className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
              그룹
            </Button>
          </div>

          {viewMode === 'group' && (
            <Select value={groupBy} onValueChange={onGroupByChange}>
              <SelectTrigger className="w-32 h-7 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">거래처별</SelectItem>
                <SelectItem value="type">상품유형별</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

