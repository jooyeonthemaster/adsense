import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { KAKAOMAP_STATUS_LABELS } from '@/config/kakaomap-status';
import type { GroupByType, ContentFilter } from './types';

interface FilterSectionProps {
  searchQuery: string;
  statusFilter: string;
  contentFilter: ContentFilter;
  groupBy: GroupByType;
  createdDateFilter?: Date;
  startDateFilter?: Date;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onContentFilterChange: (value: ContentFilter) => void;
  onGroupByChange: (value: GroupByType) => void;
  onCreatedDateFilterChange: (date?: Date) => void;
  onStartDateFilterChange: (date?: Date) => void;
}

export function FilterSection({
  searchQuery,
  statusFilter,
  contentFilter,
  groupBy,
  createdDateFilter,
  startDateFilter,
  onSearchChange,
  onStatusFilterChange,
  onContentFilterChange,
  onGroupByChange,
  onCreatedDateFilterChange,
  onStartDateFilterChange,
}: FilterSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="상품명 또는 거래처로 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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
          <SelectItem value="cancellation_requested">{KAKAOMAP_STATUS_LABELS.cancellation_requested.label}</SelectItem>
        </SelectContent>
      </Select>

      {/* Content Filter */}
      <Select value={contentFilter} onValueChange={onContentFilterChange}>
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
      <Select value={groupBy} onValueChange={onGroupByChange}>
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
                  onCreatedDateFilterChange(undefined);
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={createdDateFilter}
            onSelect={onCreatedDateFilterChange}
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
                  onStartDateFilterChange(undefined);
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDateFilter}
            onSelect={onStartDateFilterChange}
            locale={ko}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
