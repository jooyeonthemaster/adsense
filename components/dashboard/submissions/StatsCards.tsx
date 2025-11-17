import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { AllSubmissionsStats } from '@/types/submission';

interface StatsCardsProps {
  stats: AllSubmissionsStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">총 접수</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-gray-400" />
        </div>
      </div>

      <div className="p-4 rounded-lg border border-sky-200 bg-sky-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-sky-600 mb-1">진행중</p>
            <p className="text-2xl font-bold text-sky-900">
              {stats.pending + stats.in_progress}
            </p>
          </div>
          <Calendar className="h-8 w-8 text-sky-400" />
        </div>
      </div>

      <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 mb-1">완료</p>
            <p className="text-2xl font-bold text-emerald-900">{stats.completed}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-emerald-400" />
        </div>
      </div>

      <div className="p-4 rounded-lg border border-purple-200 bg-purple-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-600 mb-1">총 비용</p>
            <p className="text-2xl font-bold text-purple-900">
              {stats.total_cost.toLocaleString()}P
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-purple-400" />
        </div>
      </div>
    </div>
  );
}

