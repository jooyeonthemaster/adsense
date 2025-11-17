import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Save, Sparkles, CheckCircle } from 'lucide-react';
import { BloggerSchedule, ExperienceBlogger, ExperienceSubmission } from '@/types/experience-blogger';
import {
  autoAssignRandom,
  autoAssignDistributed,
  autoAssignEarliest,
  autoAssignEvenly,
  autoAssignSpecificTime,
} from '@/lib/schedule-auto-assign';
import { useToast } from '@/hooks/use-toast';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBloggers: ExperienceBlogger[];
  submission: ExperienceSubmission;
  onSave: (schedules: BloggerSchedule[]) => Promise<void>;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  selectedBloggers,
  submission,
  onSave,
}: ScheduleDialogProps) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<BloggerSchedule[]>([]);

  useEffect(() => {
    if (open) {
      setSchedules(
        selectedBloggers.map((b) => ({
          blogger_id: b.id,
          visit_date: b.visit_date || '',
          visit_time: b.visit_time || '',
          visit_count: b.visit_count || 1,
        }))
      );
    }
  }, [open, selectedBloggers]);

  const handleAutoAssign = (type: string) => {
    if (
      !submission?.available_days ||
      !submission.available_time_start ||
      !submission.available_time_end
    ) {
      toast({
        title: '자동 배정 불가',
        description: '방문가능 정보가 등록되지 않았습니다.',
        variant: 'destructive',
      });
      return;
    }

    let updated: BloggerSchedule[] = [];
    let successMessage = '';

    switch (type) {
      case 'random':
        updated = autoAssignRandom(
          schedules,
          submission.available_days,
          submission.available_time_start,
          submission.available_time_end
        );
        successMessage = '일정이 무작위로 배정되었습니다.';
        break;
      case 'distributed':
        updated = autoAssignDistributed(
          schedules,
          submission.available_days,
          submission.available_time_start,
          submission.available_time_end
        );
        successMessage = '일정이 고르게 분산되어 배정되었습니다.';
        break;
      case 'earliest':
        updated = autoAssignEarliest(
          schedules,
          submission.available_days,
          submission.available_time_start,
          submission.available_time_end
        );
        successMessage = '가장 빠른 일정으로 배정되었습니다.';
        break;
      case 'evenly':
        updated = autoAssignEvenly(
          schedules,
          submission.available_days,
          submission.available_time_start,
          submission.available_time_end
        );
        successMessage = '30일 기간에 균일하게 배정되었습니다.';
        break;
      case '14:00':
        updated = autoAssignSpecificTime(schedules, submission.available_days, '14:00');
        successMessage = '14시 시간대로 배정되었습니다.';
        break;
    }

    setSchedules(updated);
    toast({ title: '자동 배정 완료', description: successMessage });
  };

  const handleSave = async () => {
    const invalidSchedules = schedules.filter((s) => !s.visit_date || !s.visit_time);
    if (invalidSchedules.length > 0) {
      toast({
        title: '입력 오류',
        description: '모든 블로거의 날짜와 시간을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    await onSave(schedules);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-violet-600" />
            방문 일정 등록 (Step 3)
          </DialogTitle>
          <DialogDescription>
            선택된 {schedules.length}명의 블로거 방문 일정을 입력하세요
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {/* Client Preferred Schedule Info */}
          <Card className="bg-violet-50 border-violet-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-600" />
              클라이언트 방문가능 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {submission?.available_days && submission.available_days.length > 0 ? (
              <>
                {submission.provided_items && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">제공내역:</span>
                    <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                      {submission.provided_items}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">가능 요일:</span>
                  <div className="flex gap-1">
                    {submission.available_days.map((day) => (
                      <Badge key={day} variant="secondary" className="bg-violet-100 text-violet-700">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">가능 시간:</span>
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                    {submission.available_time_start} ~ {submission.available_time_end}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">⚠️ 방문가능 정보가 등록되지 않았습니다</p>
                <p className="text-xs text-gray-500">
                  이 접수는 방문가능 정보가 없는 기존 데이터입니다. 자동 배정 기능은 제한되며
                  수동으로 일정을 입력해주세요.
                </p>
              </div>
            )}
          </CardContent>
          </Card>

          {/* Auto-Assign Buttons */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-700">자동 배정</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAutoAssign('random')}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                🎲 랜덤 배정
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAutoAssign('distributed')}
                className="bg-green-50 hover:bg-green-100 border-green-200"
              >
                📊 분산 배정
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAutoAssign('earliest')}
                className="bg-orange-50 hover:bg-orange-100 border-orange-200"
              >
                ⚡ 빠르게 배정
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAutoAssign('evenly')}
                className="bg-purple-50 hover:bg-purple-100 border-purple-200"
              >
                📅 균일 배정
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAutoAssign('14:00')}
                className="bg-pink-50 hover:bg-pink-100 border-pink-200"
              >
                🕐 14시 고정
              </Button>
            </div>
            <p className="text-xs text-gray-500">💡 자동 배정 후 개별 수정도 가능합니다</p>
          </div>

          {/* Blogger Schedule List */}
          <div className="space-y-3">
            {schedules.map((schedule, index) => {
              const blogger = selectedBloggers.find((b) => b.id === schedule.blogger_id);
              return (
                <Card
                  key={schedule.blogger_id}
                  className="border-gray-200 hover:border-violet-300 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-base">{blogger?.name}</CardTitle>
                          <CardDescription className="text-xs">
                            블로그 지수: {blogger?.index_score}
                          </CardDescription>
                        </div>
                      </div>
                      {schedule.visit_date && schedule.visit_time && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          입력완료
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                          📅 방문 날짜
                        </label>
                        <Input
                          type="date"
                          value={schedule.visit_date}
                          onChange={(e) => {
                            const updated = [...schedules];
                            updated[index].visit_date = e.target.value;
                            setSchedules(updated);
                          }}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                          🕐 방문 시간
                        </label>
                        <Input
                          type="time"
                          value={schedule.visit_time}
                          onChange={(e) => {
                            const updated = [...schedules];
                            updated[index].visit_time = e.target.value;
                            setSchedules(updated);
                          }}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                          👥 방문 인원
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={schedule.visit_count || ''}
                          onChange={(e) => {
                            const updated = [...schedules];
                            updated[index].visit_count = parseInt(e.target.value) || 1;
                            setSchedules(updated);
                          }}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-white flex-shrink-0 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">
            <Save className="h-4 w-4 mr-2" />
            {schedules.length}명 일정 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

