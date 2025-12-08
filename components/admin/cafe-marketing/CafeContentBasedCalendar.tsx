'use client';

import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ko } from 'date-fns/locale';
import { DayButton } from 'react-day-picker';

interface ContentItem {
  id: string;
  published_date: string | null;
  post_title: string | null;
}

interface CafeContentBasedCalendarProps {
  contentItems: ContentItem[];
  totalCount: number;
  startDateStr?: string | null;
  endDateStr?: string | null;
}

// 로컬 날짜 문자열 변환 (타임존 문제 방지)
const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function CafeContentBasedCalendar({
  contentItems,
  totalCount,
  startDateStr,
  endDateStr,
}: CafeContentBasedCalendarProps) {
  // 콘텐츠 아이템을 published_date로 그룹핑
  const groupedByDate = new Map<string, number>();

  contentItems.forEach((item) => {
    if (item.published_date) {
      const dateStr = item.published_date.split('T')[0];
      const currentCount = groupedByDate.get(dateStr) || 0;
      groupedByDate.set(dateStr, currentCount + 1);
    }
  });

  // 실제 업로드된 콘텐츠 총 수
  const totalUploadedCount = contentItems.length;
  // published_date가 있는 콘텐츠만
  const totalWithDateCount = Array.from(groupedByDate.values()).reduce((sum, count) => sum + count, 0);
  const daysWithRecords = groupedByDate.size;
  const progressPercentage = totalCount > 0 ? Math.round((totalUploadedCount / totalCount) * 100) : 0;

  // 시작일/종료일
  const startDate = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
  const endDate = endDateStr ? new Date(endDateStr + 'T00:00:00') : null;

  const modifiers = {
    hasContent: (date: Date) => {
      const dateStr = getLocalDateStr(date);
      return groupedByDate.has(dateStr);
    },
    start: (date: Date) => {
      return startDate ? date.toDateString() === startDate.toDateString() : false;
    },
    end: (date: Date) => {
      return endDate ? date.toDateString() === endDate.toDateString() : false;
    },
  };

  const modifiersStyles = {
    hasContent: {
      backgroundColor: '#10b981', // emerald-500
      color: 'white',
      fontWeight: 'bold',
    },
    start: {
      backgroundColor: '#10b981',
      color: 'white',
      fontWeight: 'bold',
    },
    end: {
      backgroundColor: '#ef4444',
      color: 'white',
      fontWeight: 'bold',
    },
  };

  // Custom DayButton to show count on each date
  const CustomDayButton = (props: React.ComponentProps<typeof DayButton>) => {
    const dateStr = getLocalDateStr(props.day.date);
    const count = groupedByDate.get(dateStr);

    return (
      <DayButton {...props} className="cursor-default">
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-sm">{props.day.date.getDate()}</span>
          {count && (
            <span className="text-xs font-bold mt-0.5 text-white">
              {count}건
            </span>
          )}
        </div>
      </DayButton>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {startDate && (
          <div className="p-4 border rounded-lg bg-green-50">
            <p className="text-sm text-muted-foreground">시작일</p>
            <p className="text-lg font-bold text-green-700">{startDate.toLocaleDateString('ko-KR')}</p>
          </div>
        )}
        {endDate && (
          <div className="p-4 border rounded-lg bg-red-50">
            <p className="text-sm text-muted-foreground">마감일</p>
            <p className="text-lg font-bold text-red-700">{endDate.toLocaleDateString('ko-KR')}</p>
          </div>
        )}
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">총 접수 수량</p>
          <p className="text-2xl font-bold">{totalCount}건</p>
        </div>
        <div className="p-4 border rounded-lg bg-emerald-50">
          <p className="text-sm text-muted-foreground">업로드된 콘텐츠</p>
          <p className="text-2xl font-bold text-emerald-600">{totalUploadedCount}건</p>
          <p className="text-xs text-muted-foreground">{daysWithRecords}일에 분포</p>
        </div>
        <div className="p-4 border rounded-lg bg-purple-50">
          <p className="text-sm text-muted-foreground">진행률</p>
          <p className="text-2xl font-bold text-purple-600">{progressPercentage}%</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="w-full">
        <Calendar
          mode="single"
          locale={ko}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          components={{
            DayButton: CustomDayButton,
          }}
          className="rounded-md border w-full [--cell-size:4rem]"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center flex-wrap">
        {startDate && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm">시작일</span>
          </div>
        )}
        {endDate && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm">마감일</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <span className="text-sm">콘텐츠 발행일</span>
        </div>
      </div>

      {/* Daily Records List */}
      {groupedByDate.size > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">발행일별 콘텐츠 수</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Array.from(groupedByDate.entries())
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .slice(0, 10)
              .map(([date, count]) => (
                <div key={date} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(date + 'T00:00:00').toLocaleDateString('ko-KR')}</p>
                    <p className="text-xs text-muted-foreground">발행된 콘텐츠</p>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    {count}건
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      {groupedByDate.size === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>업로드된 콘텐츠가 없습니다.</p>
          <p className="text-sm mt-1">콘텐츠 관리 탭에서 엑셀을 업로드하면 발행일 기준으로 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}
