'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Calendar } from 'lucide-react';
import { ContentItem } from '@/types/review/kmap-content';
import { ContentCard } from './ContentCard';

interface ContentGridProps {
  items: ContentItem[];
}

// 날짜별로 아이템 그룹화
function groupItemsByDate(items: ContentItem[]): Record<string, ContentItem[]> {
  const groups: Record<string, ContentItem[]> = {};

  items.forEach((item) => {
    const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
  });

  return groups;
}

export function ContentGrid({ items }: ContentGridProps) {
  // 날짜별 그룹화 (최신 날짜 먼저)
  const groupedItems = useMemo(() => {
    const groups = groupItemsByDate(items);
    // 날짜 기준 내림차순 정렬
    const sortedDates = Object.keys(groups).sort((a, b) => {
      const dateA = new Date(groups[a][0].created_at);
      const dateB = new Date(groups[b][0].created_at);
      return dateB.getTime() - dateA.getTime();
    });
    return sortedDates.map((date) => ({ date, items: groups[date] }));
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center text-gray-500 shadow-sm">
        해당 상태의 콘텐츠가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedItems.map(({ date, items: dateItems }) => (
        <Collapsible key={date} defaultOpen={false}>
          {/* 날짜 헤더 (클릭하여 접기/펼치기) */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform [[data-state=closed]_&]:-rotate-90" />
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-sm">{date}</span>
              <Badge variant="secondary" className="ml-auto">
                {dateItems.length}개
              </Badge>
            </button>
          </CollapsibleTrigger>

          {/* 해당 날짜의 콘텐츠 그리드 */}
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dateItems.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}





