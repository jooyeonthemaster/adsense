'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, Filter, ExternalLink, TrendingUp, Loader2 } from 'lucide-react';
import type { ExperienceBlogger, BloggerSortBy, BloggerFilter } from './types';

interface BloggerSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bloggers: ExperienceBlogger[];
  selectedBloggerIds: string[];
  sortBy: BloggerSortBy;
  filter: BloggerFilter;
  loading: boolean;
  onSortChange: (sort: BloggerSortBy) => void;
  onFilterChange: (filter: BloggerFilter) => void;
  onToggleSelection: (bloggerId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectTopN: (n: number) => void;
  onConfirm: () => void;
}

export function BloggerSelectionDialog({
  open,
  onOpenChange,
  bloggers,
  selectedBloggerIds,
  sortBy,
  filter,
  loading,
  onSortChange,
  onFilterChange,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onSelectTopN,
  onConfirm,
}: BloggerSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>블로거 선택</DialogTitle>
          <DialogDescription>
            원하시는 블로거를 선택해주세요. 선택된 블로거만 체험단에 참여합니다.
          </DialogDescription>
        </DialogHeader>

        {/* Filter and Sort Controls */}
        <div className="space-y-3 pb-3 border-b">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">정렬 기준</label>
              <Select value={sortBy} onValueChange={(value) => onSortChange(value as BloggerSortBy)}>
                <SelectTrigger className="h-9">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="index-high">블로그 지수 높은 순</SelectItem>
                  <SelectItem value="index-low">블로그 지수 낮은 순</SelectItem>
                  <SelectItem value="name">이름순 (가나다)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">필터</label>
              <Select value={filter} onValueChange={(value) => onFilterChange(value as BloggerFilter)}>
                <SelectTrigger className="h-9">
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 블로거</SelectItem>
                  <SelectItem value="700+">700 이상</SelectItem>
                  <SelectItem value="800+">800 이상</SelectItem>
                  <SelectItem value="900+">900 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onSelectAll} className="h-8 text-xs">
              전체 선택
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onDeselectAll} className="h-8 text-xs">
              선택 해제
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onSelectTopN(3)} className="h-8 text-xs">
              상위 3명
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onSelectTopN(5)} className="h-8 text-xs">
              상위 5명
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {bloggers.map((blogger) => (
            <div
              key={blogger.id}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
            >
              <Checkbox
                id={blogger.id}
                checked={selectedBloggerIds.includes(blogger.id)}
                onCheckedChange={() => onToggleSelection(blogger.id)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <label htmlFor={blogger.id} className="font-medium cursor-pointer">
                    {blogger.name}
                  </label>
                  <a
                    href={blogger.blog_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-500"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    블로그 지수: {blogger.index_score}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-violet-600">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                선택 중...
              </>
            ) : (
              `${selectedBloggerIds.length}명 선택 완료`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
