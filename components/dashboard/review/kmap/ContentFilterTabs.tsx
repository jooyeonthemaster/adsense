import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentFilter } from '@/types/review/kmap-content';

interface ContentFilterTabsProps {
  filter: ContentFilter;
  onFilterChange: (filter: ContentFilter) => void;
  counts: {
    total: number;
    pending: number;
    revisionRequested: number;
    approved: number;
    revised: number;
  };
}

export function ContentFilterTabs({
  filter,
  onFilterChange,
  counts,
}: ContentFilterTabsProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <Tabs value={filter} onValueChange={(value) => onFilterChange(value as ContentFilter)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            전체 ({counts.total})
          </TabsTrigger>
          <TabsTrigger value="pending">
            검수대기 ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="revision_requested">
            수정요청 ({counts.revisionRequested})
          </TabsTrigger>
          <TabsTrigger value="approved">
            승인완료 ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="revised">
            수정완료 ({counts.revised})
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}




