'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Users, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ExperienceBlogger } from './types';

interface ScheduleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bloggers: ExperienceBlogger[];
  loading: boolean;
  onConfirm: () => void;
  onRequestChange: () => void;
}

export function ScheduleConfirmDialog({
  open,
  onOpenChange,
  bloggers,
  loading,
  onConfirm,
  onRequestChange,
}: ScheduleConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>방문 일정 확인</DialogTitle>
          <DialogDescription>
            아래 일정으로 진행하시겠습니까? 일정 조율이 필요하시면 1:1 문의를 이용해주세요.
          </DialogDescription>
        </DialogHeader>

        {/* 총 인원 표시 */}
        <div className="flex items-center justify-between px-3 py-2 bg-violet-50 rounded-lg border border-violet-200">
          <span className="text-sm font-medium text-violet-700">총 {bloggers.length}명</span>
          <Badge variant="secondary" className="bg-violet-100 text-violet-700">
            <Calendar className="h-3 w-3 mr-1" />
            일정 배정 완료
          </Badge>
        </div>

        {/* 블로거 일정 목록 */}
        <div className="max-h-[400px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bloggers.map((blogger) => (
              <div
                key={blogger.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-300 transition-colors"
              >
                <p className="font-semibold text-sm mb-2 text-gray-900">{blogger.name}</p>
                {blogger.visit_date && blogger.visit_time ? (
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-violet-500" />
                      <span>{new Date(blogger.visit_date).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-violet-500" />
                      <span>{blogger.visit_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-violet-500" />
                      <span>{blogger.visit_count}명</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">일정이 아직 등록되지 않았습니다.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            취소
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={onRequestChange}>
            <MessageCircle className="h-4 w-4 mr-2" />
            조율 요청
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-violet-600 w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                확인 중...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                일정 확인
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
