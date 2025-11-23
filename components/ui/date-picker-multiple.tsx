"use client";

import * as React from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface DatePickerMultipleProps {
  value: Date[];
  onChange: (dates: Date[]) => void;
  placeholder?: string;
  className?: string;
}

export function DatePickerMultiple({
  value = [],
  onChange,
  placeholder = "날짜를 선택하세요",
  className,
}: DatePickerMultipleProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (dates: Date[] | undefined) => {
    if (dates) {
      onChange(dates);
    }
  };

  const removeDate = (dateToRemove: Date) => {
    onChange(value.filter((date) => date.getTime() !== dateToRemove.getTime()));
  };

  const clearAll = () => {
    onChange([]);
  };

  // Sort dates
  const sortedDates = [...value].sort((a, b) => a.getTime() - b.getTime());

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-8 border-gray-200 hover:border-sky-500 hover:bg-sky-50",
              !value.length && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
            {value.length > 0 ? (
              <span className="text-gray-900 text-xs truncate">
                {value.length}개 날짜 선택됨
              </span>
            ) : (
              <span className="text-gray-500 text-xs truncate">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900">
                희망 발행일 선택
              </p>
              {value.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-7 text-xs text-gray-500 hover:text-gray-900"
                >
                  전체 삭제
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              여러 날짜를 클릭하여 선택할 수 있습니다
            </p>
          </div>
          <Calendar
            mode="multiple"
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={1}
            className="rounded-md"
            classNames={{
              day_button: cn(
                "hover:bg-sky-100 focus:bg-sky-100",
                "data-[selected-single=true]:bg-sky-500 data-[selected-single=true]:hover:bg-sky-600",
                "data-[selected-single=true]:text-white"
              ),
              today: "bg-sky-50 text-sky-900 font-semibold",
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
          <div className="p-3 border-t border-gray-100">
            <Button
              onClick={() => setOpen(false)}
              className="w-full h-8 bg-sky-500 hover:bg-sky-600 text-white text-sm"
            >
              완료
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected dates display */}
      {sortedDates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sortedDates.map((date, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-2.5 py-1 bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-200 text-xs font-medium"
            >
              <CalendarIcon className="h-2.5 w-2.5 mr-1" />
              {format(date, "yyyy-MM-dd (E)", { locale: ko })}
              <button
                type="button"
                onClick={() => removeDate(date)}
                className="ml-1.5 hover:bg-sky-300 rounded-full p-0.5 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
