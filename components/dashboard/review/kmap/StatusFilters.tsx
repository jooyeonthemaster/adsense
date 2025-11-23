import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { KAKAOMAP_STATUS_LABELS } from '@/config/kakaomap-status';

interface StatusFiltersProps {
  searchQuery: string;
  statusFilter: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
}

export function StatusFilters({
  searchQuery,
  statusFilter,
  sortBy,
  onSearchChange,
  onStatusFilterChange,
  onSortByChange,
}: StatusFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <Input
          placeholder="업체명 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-xs sm:text-sm"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-40 h-8 text-xs sm:text-sm">
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="pending">{KAKAOMAP_STATUS_LABELS.pending.label}</SelectItem>
          <SelectItem value="waiting_content">{KAKAOMAP_STATUS_LABELS.waiting_content.label}</SelectItem>
          <SelectItem value="review">{KAKAOMAP_STATUS_LABELS.review.label}</SelectItem>
          <SelectItem value="revision_requested">{KAKAOMAP_STATUS_LABELS.revision_requested.label}</SelectItem>
          <SelectItem value="in_progress">{KAKAOMAP_STATUS_LABELS.in_progress.label}</SelectItem>
          <SelectItem value="completed">{KAKAOMAP_STATUS_LABELS.completed.label}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-full sm:w-28 h-8 text-xs sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">접수일순</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

