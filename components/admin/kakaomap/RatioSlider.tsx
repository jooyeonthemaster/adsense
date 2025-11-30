'use client';

import { useState, useCallback, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RatioSliderConfig } from '@/types/review/ai-generation';

interface RatioSliderProps {
  title: string;
  icon?: string;
  items: RatioSliderConfig[];
  onChange: (items: RatioSliderConfig[]) => void;
  disabled?: boolean;
}

export function RatioSlider({
  title,
  icon,
  items,
  onChange,
  disabled = false,
}: RatioSliderProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalPercentage = useMemo(
    () => items.reduce((sum, item) => sum + item.percentage, 0),
    [items]
  );

  const isValid = useMemo(
    () => Math.abs(totalPercentage - 100) < 1,
    [totalPercentage]
  );

  // 슬라이더 또는 입력값 변경 시 다른 항목들 자동 조정
  const handlePercentageChange = useCallback(
    (index: number, newValue: number) => {
      if (disabled) return;

      const clampedValue = Math.max(0, Math.min(100, newValue));
      const currentItem = items[index];
      const diff = clampedValue - currentItem.percentage;

      if (diff === 0) return;

      const newItems = [...items];
      newItems[index] = { ...currentItem, percentage: clampedValue };

      // 다른 항목들의 합계
      const otherItems = newItems.filter((_, i) => i !== index);
      const otherTotal = otherItems.reduce((sum, item) => sum + item.percentage, 0);

      // 나머지 항목들 비율대로 조정
      if (otherTotal > 0 && diff !== 0) {
        const targetOtherTotal = 100 - clampedValue;
        const scale = targetOtherTotal / otherTotal;

        let runningTotal = clampedValue;
        newItems.forEach((item, i) => {
          if (i !== index) {
            if (i === newItems.length - 1 || (i === newItems.length - 2 && index === newItems.length - 1)) {
              // 마지막 항목은 나머지로 처리 (반올림 오차 방지)
              newItems[i] = { ...item, percentage: Math.max(0, 100 - runningTotal) };
            } else {
              const newPercentage = Math.round(item.percentage * scale);
              newItems[i] = { ...item, percentage: Math.max(0, newPercentage) };
              runningTotal += newPercentage;
            }
          }
        });
      } else if (otherTotal === 0 && clampedValue < 100) {
        // 다른 항목들이 모두 0일 때
        const remaining = 100 - clampedValue;
        const perItem = Math.floor(remaining / (items.length - 1));
        let distributed = 0;
        newItems.forEach((item, i) => {
          if (i !== index) {
            if (i === newItems.length - 1) {
              newItems[i] = { ...item, percentage: remaining - distributed };
            } else {
              newItems[i] = { ...item, percentage: perItem };
              distributed += perItem;
            }
          }
        });
      }

      onChange(newItems);
    },
    [items, onChange, disabled]
  );

  // 직접 입력 핸들러
  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        handlePercentageChange(index, numValue);
      }
    },
    [handlePercentageChange]
  );

  // 입력 blur 시 유효성 검사
  const handleInputBlur = useCallback(
    (index: number) => {
      setActiveIndex(null);
      // 전체 합이 100이 아니면 조정
      if (!isValid) {
        const diff = 100 - totalPercentage;
        const newItems = [...items];
        newItems[index] = {
          ...newItems[index],
          percentage: Math.max(0, newItems[index].percentage + diff),
        };
        onChange(newItems);
      }
    },
    [isValid, totalPercentage, items, onChange]
  );

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </Label>
        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full transition-colors',
            isValid
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          합계: {totalPercentage}%
        </span>
      </div>

      {/* 슬라이더 목록 */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="space-y-2">
            {/* 라벨과 입력 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="text-sm font-medium">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    ({item.description})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={item.percentage}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => handleInputBlur(index)}
                  disabled={disabled}
                  className={cn(
                    'w-16 h-8 text-center text-sm font-medium',
                    activeIndex === index && 'ring-2 ring-primary'
                  )}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            {/* 슬라이더 */}
            <div className="px-1">
              <Slider
                value={[item.percentage]}
                min={0}
                max={100}
                step={1}
                disabled={disabled}
                onValueChange={([val]: number[]) => handlePercentageChange(index, val)}
                className={cn(
                  'cursor-pointer',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                style={
                  {
                    '--slider-color': item.color || '#3b82f6',
                  } as React.CSSProperties
                }
              />
            </div>

            {/* 비율 바 시각화 */}
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color || '#3b82f6',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 전체 비율 시각화 바 */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex h-4 rounded-lg overflow-hidden">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="transition-all duration-300 flex items-center justify-center"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)`,
                minWidth: item.percentage > 0 ? '20px' : '0',
              }}
            >
              {item.percentage >= 10 && (
                <span className="text-[10px] font-bold text-white drop-shadow">
                  {item.percentage}%
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex mt-2 gap-3 flex-wrap">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">
                {item.label}: {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
