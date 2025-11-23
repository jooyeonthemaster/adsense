import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import { ExperienceFormData } from '@/types/experience/service-types';

interface VisitInfoSectionProps {
  formData: ExperienceFormData;
  onFormChange: (updates: Partial<ExperienceFormData>) => void;
  onToggleDay: (day: string) => void;
}

const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

export function VisitInfoSection({
  formData,
  onFormChange,
  onToggleDay,
}: VisitInfoSectionProps) {
  return (
    <>
      {/* 구분선 */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* 방문가능요일 */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">
          방문가능요일 <span className="text-rose-500">*</span>
        </Label>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onToggleDay(day)}
              className={`px-1.5 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${
                formData.availableDays.includes(day)
                  ? 'bg-sky-500 text-white border-sky-500 shadow-md scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-sky-400 hover:bg-sky-50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* 방문가능시간대 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="timeStart" className="text-xs font-medium text-gray-700">
            방문가능시간 (시작)
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="timeStart"
              type="time"
              value={formData.availableTimeStart}
              onChange={(e) => onFormChange({ availableTimeStart: e.target.value })}
              className="pl-10 border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timeEnd" className="text-xs font-medium text-gray-700">
            방문가능시간 (종료)
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="timeEnd"
              type="time"
              value={formData.availableTimeEnd}
              onChange={(e) => onFormChange({ availableTimeEnd: e.target.value })}
              className="pl-10 border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 h-9 text-sm"
            />
          </div>
        </div>
      </div>
    </>
  );
}

