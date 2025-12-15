'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Stats } from './types';

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Card>
        <CardHeader className="pb-2 p-2.5 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs text-gray-500">총 접수</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 pt-0">
          <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 p-2.5 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs text-gray-500">확인중</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 pt-0">
          <p className="text-lg sm:text-xl font-bold text-gray-700">{stats.pending}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 p-2.5 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs text-sky-600">구동중</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 pt-0">
          <p className="text-lg sm:text-xl font-bold text-sky-600">{stats.in_progress}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 p-2.5 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs text-green-600">완료</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 pt-0">
          <p className="text-lg sm:text-xl font-bold text-green-600">{stats.completed}</p>
        </CardContent>
      </Card>
    </div>
  );
}
