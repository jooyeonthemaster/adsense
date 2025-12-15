import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { KakaomapStats } from './types';

interface StatsCardsProps {
  stats: KakaomapStats;
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
          <CardDescription>콘텐츠 업로드 필요</CardDescription>
          <CardTitle className="text-3xl text-orange-600">{stats.needs_upload}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            업로드가 필요한 캠페인
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>검수 대기</CardDescription>
          <CardTitle className="text-3xl text-blue-600">{stats.needs_review}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            클라이언트 검수 필요
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>읽지 않은 메시지</CardDescription>
          <CardTitle className="text-3xl text-purple-600">{stats.unread_messages}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            클라이언트 메시지 확인
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
