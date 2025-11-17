'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ko } from 'date-fns/locale';
import { DayButton } from 'react-day-picker';

interface DailyRecord {
  date: string;
  actual_count: number;
  notes?: string;
}

interface DailyRecordCalendarProps {
  submissionId: string;
  records: DailyRecord[];
  totalCount: number;
  dailyCount: number;
  totalDays?: number;
  createdAt: string;
  onRecordSave: () => void;
  apiEndpoint: string;
  readOnly?: boolean;
}

export function DailyRecordCalendar({
  submissionId,
  records,
  totalCount,
  dailyCount,
  totalDays,
  createdAt,
  onRecordSave,
  apiEndpoint,
  readOnly = false,
}: DailyRecordCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actualCount, setActualCount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const recordsMap = new Map(
    records.map((r) => [r.date, r])
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || readOnly) return;

    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const existingRecord = recordsMap.get(dateStr);

    if (existingRecord) {
      setActualCount(String(existingRecord.actual_count));
      setNotes(existingRecord.notes || '');
    } else {
      setActualCount('');
      setNotes('');
    }

    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedDate || !actualCount) return;

    setSaving(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_date: dateStr,
          completed_count: parseInt(actualCount, 10),
          notes,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        onRecordSave();
      }
    } catch (error) {
      console.error('Error saving record:', error);
    } finally {
      setSaving(false);
    }
  };

  const modifiers = {
    recorded: (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return recordsMap.has(dateStr);
    },
    start: (date: Date) => {
      return date.toDateString() === startDate.toDateString();
    },
    end: (date: Date) => {
      return date.toDateString() === endDate.toDateString();
    },
  };

  const modifiersStyles = {
    recorded: {
      backgroundColor: '#3b82f6',
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

  const totalActualCount = records.reduce((sum, r) => sum + r.actual_count, 0);
  const remainingCount = totalCount - totalActualCount;
  const daysWithRecords = records.length;
  const progressPercentage = totalCount > 0 ? Math.round((totalActualCount / totalCount) * 100) : 0;

  // Calculate start and end dates
  const startDate = new Date(createdAt);
  const estimatedDays = totalDays || Math.ceil(totalCount / dailyCount);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + estimatedDays);

  // Custom DayButton to show count on each date
  const CustomDayButton = (props: React.ComponentProps<typeof DayButton>) => {
    const dateStr = props.day.date.toISOString().split('T')[0];
    const record = recordsMap.get(dateStr);

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!readOnly) {
        handleDateSelect(props.day.date);
      }
    };

    return (
      <DayButton {...props} onClick={handleClick} className={readOnly ? 'cursor-default' : ''}>
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-sm">{props.day.date.getDate()}</span>
          {record && (
            <span className="text-xs font-bold mt-0.5">{record.actual_count}건</span>
          )}
        </div>
      </DayButton>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 border rounded-lg bg-green-50">
          <p className="text-sm text-muted-foreground">시작일</p>
          <p className="text-lg font-bold text-green-700">{startDate.toLocaleDateString('ko-KR')}</p>
        </div>
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-sm text-muted-foreground">마감일</p>
          <p className="text-lg font-bold text-red-700">{endDate.toLocaleDateString('ko-KR')}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">총 접수 수량</p>
          <p className="text-2xl font-bold">{totalCount}건</p>
        </div>
        <div className="p-4 border rounded-lg bg-blue-50">
          <p className="text-sm text-muted-foreground">실제 유입</p>
          <p className="text-2xl font-bold text-blue-600">{totalActualCount}건</p>
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
          selected={selectedDate}
          onSelect={handleDateSelect}
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
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm">시작일</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm">마감일</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span className="text-sm">기록된 날짜</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border"></div>
          <span className="text-sm">미기록 날짜</span>
        </div>
      </div>

      {/* Recent Records */}
      {records.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">최근 기록</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {records.slice().reverse().slice(0, 10).map((record) => (
              <div key={record.date} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{new Date(record.date).toLocaleDateString('ko-KR')}</p>
                  {record.notes && (
                    <p className="text-sm text-muted-foreground">{record.notes}</p>
                  )}
                </div>
                <Badge variant="secondary">{record.actual_count}건</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>일별 유입 기록</DialogTitle>
            <DialogDescription>
              {selectedDate?.toLocaleDateString('ko-KR')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Work Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">작업 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">기록된 일수</p>
                    <p className="text-lg font-semibold">{daysWithRecords}일</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">진행률</p>
                    <p className="text-lg font-semibold text-blue-600">{progressPercentage}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">완료 수량</p>
                    <p className="text-lg font-semibold">{totalActualCount}건 / {totalCount}건</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">남은 수량</p>
                    <p className="text-lg font-semibold text-orange-600">{remainingCount}건</p>
                  </div>
                </div>
                <div className="pt-3 border-t grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">일 접수량 (목표)</p>
                    <p className="text-lg font-semibold text-green-600">{dailyCount}건/일</p>
                  </div>
                  {remainingCount > 0 && daysWithRecords > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">평균 일일 유입</p>
                      <p className="text-lg font-semibold">
                        {Math.round(totalActualCount / daysWithRecords)}건/일
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">실제 유입 건수</label>
                <Input
                  type="number"
                  min="0"
                  value={actualCount}
                  onChange={(e) => setActualCount(e.target.value)}
                  placeholder="유입 건수를 입력하세요"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">메모 (선택)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="추가 메모를 입력하세요"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={saving || !actualCount}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
