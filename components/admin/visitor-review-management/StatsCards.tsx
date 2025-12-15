import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { VisitorReviewStats } from './types';

interface StatsCardsProps {
  stats: VisitorReviewStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>전체 캠페인</CardDescription>
          <CardTitle className="text-3xl">{stats.total}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            진행중 {stats.in_progress}개 · 완료 {stats.completed}개
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>진행중</CardDescription>
          <CardTitle className="text-3xl text-blue-600">{stats.in_progress}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">현재 진행 중인 캠페인</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>완료</CardDescription>
          <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">완료된 캠페인</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>총 비용</CardDescription>
          <CardTitle className="text-3xl">{stats.total_cost.toLocaleString()}P</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">누적 포인트</p>
        </CardContent>
      </Card>
    </div>
  );
}
