import { StatusStats } from '@/types/review/kmap-status';

interface StatusStatsProps {
  stats: StatusStats;
}

export function StatusStatsCards({ stats }: StatusStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="p-2.5 sm:p-3 rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">총 접수</p>
            <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-3 rounded-lg border border-amber-200 bg-amber-50 shadow-sm">
        <div className="flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-amber-600 mb-0.5">진행중</p>
            <p className="text-lg sm:text-xl font-bold text-amber-900">{stats.in_progress}</p>
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-3 rounded-lg border border-green-200 bg-green-50 shadow-sm">
        <div className="flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-green-600 mb-0.5">완료</p>
            <p className="text-lg sm:text-xl font-bold text-green-900">{stats.completed}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

