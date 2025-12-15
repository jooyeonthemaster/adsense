'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, CalendarIcon, X, List, Grid3x3 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { FilterState, ViewMode, GroupByMode } from './types';

interface FilterSectionProps {
  filters: FilterState;
  viewMode: ViewMode;
  groupBy: GroupByMode;
  onSearchChange: (query: string) => void;
  onTypeChange: (type: string) => void;
  onStatusChange: (status: string) => void;
  onCreatedDateChange: (date: Date | null) => void;
  onStartDateChange: (date: Date | null) => void;
  onResetFilters: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onGroupByChange: (mode: GroupByMode) => void;
}

export function FilterSection({
  filters,
  viewMode,
  groupBy,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onCreatedDateChange,
  onStartDateChange,
  onResetFilters,
  onViewModeChange,
  onGroupByChange,
}: FilterSectionProps) {
  const hasActiveFilters =
    filters.createdDateFilter ||
    filters.startDateFilter ||
    filters.typeFilter !== 'all' ||
    filters.statusFilter !== 'all' ||
    filters.searchQuery;

  return (
    <div className="flex flex-col gap-2">
      {/* 검색 및 기본 필터 */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="업체명 검색..."
            value={filters.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-xs sm:text-sm"
          />
        </div>
        <Select value={filters.typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-24 sm:w-28 h-8 text-xs sm:text-sm">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="video">영상</SelectItem>
            <SelectItem value="automation">자동화</SelectItem>
            <SelectItem value="reviewer">리뷰어</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-24 sm:w-28 h-8 text-xs sm:text-sm">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">확인중</SelectItem>
            <SelectItem value="in_progress">구동중</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="cancelled">중단</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 날짜 필터 */}
      <div className="flex flex-wrap gap-2">
        {/* 접수일 필터 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={filters.createdDateFilter ? 'default' : 'outline'}
              size="sm"
              className={`h-8 text-xs sm:text-sm ${
                filters.createdDateFilter ? 'bg-sky-500 hover:bg-sky-600 text-white' : ''
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
              {filters.createdDateFilter
                ? `접수일: ${format(filters.createdDateFilter, 'M/d', { locale: ko })}`
                : '접수일'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.createdDateFilter || undefined}
              onSelect={(date) => onCreatedDateChange(date || null)}
              locale={ko}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {filters.createdDateFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreatedDateChange(null)}
            className="h-8 px-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* 구동일 필터 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={filters.startDateFilter ? 'default' : 'outline'}
              size="sm"
              className={`h-8 text-xs sm:text-sm ${
                filters.startDateFilter ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
              {filters.startDateFilter
                ? `구동일: ${format(filters.startDateFilter, 'M/d', { locale: ko })}`
                : '구동일'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.startDateFilter || undefined}
              onSelect={(date) => onStartDateChange(date || null)}
              locale={ko}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {filters.startDateFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStartDateChange(null)}
            className="h-8 px-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* 필터 초기화 */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-8 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
          >
            전체 초기화
          </Button>
        )}
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
          <Select value={groupBy} onValueChange={(value: GroupByMode) => onGroupByChange(value)}>
            <SelectTrigger className="w-32 h-7 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">거래처별</SelectItem>
              <SelectItem value="type">타입별</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
