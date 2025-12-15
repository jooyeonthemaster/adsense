'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TYPE_CONFIG } from './constants';
import type { SubmissionWithClient, BlogDistributionDailyRecord } from './types';

interface DailyRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: SubmissionWithClient | null;
  dailyRecords: BlogDistributionDailyRecord[];
  recordDate: string;
  completedCount: number;
  recordNotes: string;
  onRecordDateChange: (date: string) => void;
  onCompletedCountChange: (count: number) => void;
  onRecordNotesChange: (notes: string) => void;
  onSave: () => void;
}

export function DailyRecordDialog({
  open,
  onOpenChange,
  submission,
  dailyRecords,
  recordDate,
  completedCount,
  recordNotes,
  onRecordDateChange,
  onCompletedCountChange,
  onRecordNotesChange,
  onSave,
}: DailyRecordDialogProps) {
  const typeLabel = submission ? TYPE_CONFIG[submission.distribution_type].label : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>일일 진행 기록</DialogTitle>
          <DialogDescription>
            {submission?.company_name} - {typeLabel} 배포
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>날짜</Label>
              <Input
                type="date"
                value={recordDate}
                onChange={(e) => onRecordDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>완료 건수</Label>
              <Input
                type="number"
                min="0"
                value={completedCount}
                onChange={(e) => onCompletedCountChange(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>총 수량</Label>
              <Input value={`${submission?.total_count || 0}건`} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>메모</Label>
            <Input
              value={recordNotes}
              onChange={(e) => onRecordNotesChange(e.target.value)}
              placeholder="메모 (선택사항)"
            />
          </div>

          {/* 기존 기록 목록 */}
          {dailyRecords.length > 0 && (
            <div className="space-y-2">
              <Label>최근 기록</Label>
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                {dailyRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="p-2 text-sm flex justify-between">
                    <span>{new Date(record.record_date).toLocaleDateString('ko-KR')}</span>
                    <span className="font-medium">{record.completed_count}건</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
