'use client';

import { useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RatioSliderConfig } from '@/types/review/ai-generation';

interface RatioSliderProps {
  title: string;
  icon?: string;
  items: RatioSliderConfig[];
  totalCount: number; // 전체 개수
  onChange: (items: RatioSliderConfig[]) => void;
  disabled?: boolean;
}

export function RatioSlider({
  title,
  icon,
  items,
  totalCount,
  onChange,
  disabled = false,
}: RatioSliderProps) {
  // 할당된 총 개수
  const assignedCount = useMemo(
    () => items.reduce((sum, item) => sum + item.count, 0),
    [items]
  );

  // 남은 개수
  const remainingCount = useMemo(
    () => Math.max(0, totalCount - assignedCount),
    [totalCount, assignedCount]
  );

  // 유효성 (할당된 개수 = 전체 개수)
  const isValid = useMemo(
    () => assignedCount === totalCount,
    [assignedCount, totalCount]
  );

  // 개수 변경 핸들러
  const handleCountChange = useCallback(
    (index: number, newCount: number) => {
      if (disabled) return;

      // 음수 방지
      const clampedCount = Math.max(0, newCount);

      const newItems = items.map((item, i) => {
        if (i === index) {
          const percentage = totalCount > 0 ? Math.round((clampedCount / totalCount) * 100) : 0;
          return { ...item, count: clampedCount, percentage };
        }
        return item;
      });

      onChange(newItems);
    },
    [items, onChange, disabled, totalCount]
  );

  // 입력값 변경 핸들러
  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        handleCountChange(index, numValue);
      } else if (value === '') {
        handleCountChange(index, 0);
      }
    },
    [handleCountChange]
  );

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </Label>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full transition-colors',
              isValid
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            )}
          >
            {assignedCount}/{totalCount}개 할당
          </span>
          {!isValid && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
              {remainingCount}개 남음
            </span>
          )}
        </div>
      </div>

      {/* 개수 입력 목록 */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;

          return (
            <div key={item.id} className="space-y-1.5">
              {/* 라벨과 입력 */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {item.color && (
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className="text-sm font-medium truncate">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground hidden sm:inline truncate">
                      ({item.description})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    value={item.count}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    disabled={disabled}
                    className="w-16 h-8 text-center text-sm font-medium"
                  />
                  <span className="text-sm text-muted-foreground w-8">개</span>
                  <span
                    className="text-xs font-medium w-12 text-right"
                    style={{ color: item.color || '#6b7280' }}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* 비율 바 시각화 */}
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color || '#3b82f6',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 전체 비율 시각화 바 */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex h-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {items.map((item, index) => {
            const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;

            return (
              <div
                key={item.id}
                className="transition-all duration-300 flex items-center justify-center"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)`,
                  minWidth: item.count > 0 ? '20px' : '0',
                }}
              >
                {percentage >= 10 && (
                  <span className="text-[10px] font-bold text-white drop-shadow">
                    {item.count}개
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex mt-2 gap-3 flex-wrap">
          {items.map((item) => {
            const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;

            return (
              <div key={item.id} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">
                  {item.label}: {item.count}개 ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 경고 메시지 */}
      {assignedCount > totalCount && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          ⚠️ 할당된 개수({assignedCount}개)가 전체 개수({totalCount}개)를 초과했습니다.
        </div>
      )}
    </div>
  );
}
