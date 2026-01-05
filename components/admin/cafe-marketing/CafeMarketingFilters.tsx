import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, List, Grid3x3 } from 'lucide-react';

interface FiltersProps {
  searchQuery: string;
  statusFilter: string;
  scriptStatusFilter: string;
  viewMode: 'list' | 'group';
  groupBy: 'client' | 'region';
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onScriptStatusFilterChange: (value: string) => void;
  onViewModeChange: (mode: 'list' | 'group') => void;
  onGroupByChange: (groupBy: 'client' | 'region') => void;
}

export function CafeMarketingFilters({
  searchQuery,
  statusFilter,
  scriptStatusFilter,
  viewMode,
  groupBy,
  onSearchChange,
  onStatusFilterChange,
  onScriptStatusFilterChange,
  onViewModeChange,
  onGroupByChange,
}: FiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="업체명, 거래처, 지역 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-xs sm:text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-28 sm:w-32 h-8 text-xs sm:text-sm">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">확인중</SelectItem>
            <SelectItem value="approved">접수완료</SelectItem>
            <SelectItem value="script_writing">원고작성중</SelectItem>
            <SelectItem value="script_completed">원고완료</SelectItem>
            <SelectItem value="in_progress">구동중</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="cancelled">중단</SelectItem>
            <SelectItem value="cancellation_requested">중단요청</SelectItem>
          </SelectContent>
        </Select>
        <Select value={scriptStatusFilter} onValueChange={onScriptStatusFilterChange}>
          <SelectTrigger className="w-24 sm:w-28 h-8 text-xs sm:text-sm">
            <SelectValue placeholder="원고" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
            <SelectItem value="writing">작성중</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
              <SelectItem value="region">지역별</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

