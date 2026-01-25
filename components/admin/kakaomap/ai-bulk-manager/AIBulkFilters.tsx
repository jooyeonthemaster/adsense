'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { SortBy } from './types';

interface AIBulkFiltersProps {
  clientList: string[];
  clientFilter: string;
  setClientFilter: (value: string) => void;
  sortBy: SortBy;
  setSortBy: (value: SortBy) => void;
  onRefresh: () => void;
}

export function AIBulkFilters({
  clientList,
  clientFilter,
  setClientFilter,
  sortBy,
  setSortBy,
  onRefresh,
}: AIBulkFiltersProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border">
      <div className="flex items-center gap-3">
        {/* 거래처 필터 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">거래처:</span>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {clientList.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 정렬 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">정렬:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remaining">남은 수량순</SelectItem>
              <SelectItem value="created">최신순</SelectItem>
              <SelectItem value="company">업체명순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 새로고침 */}
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-2" />
        새로고침
      </Button>
    </div>
  );
}
