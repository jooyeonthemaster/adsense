'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Activity, Database, Users, FileText, DollarSign, Package, Filter, AlertCircle } from 'lucide-react';

const iconMap = {
  Users,
  FileText,
  DollarSign,
  Package,
  AlertCircle,
};

type IconName = keyof typeof iconMap;

interface RecentSubmission {
  id: string;
  type: 'place' | 'receipt' | 'kakaomap' | 'blog' | 'dynamic';
  company_name: string;
  total_points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  client_name: string;
  category_name?: string;
}

interface AdminDashboardContentProps {
  stats: {
    totalClients: number;
    pendingSubmissions: number;
    totalPoints: number;
    pendingAsRequests: number;
  };
  cards: Array<{
    title: string;
    value: string | number;
    icon: IconName;
    description: string;
  }>;
  recentSubmissions: RecentSubmission[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const gradients = [
  'from-primary to-primary/80',
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
];

const TYPE_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
  dynamic: '동적 상품',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '대기중',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
};

const STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'outline',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
};

export function AdminDashboardContent({ stats, cards, recentSubmissions }: AdminDashboardContentProps) {
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // 필터 적용
  const filteredSubmissions = showOnlyPending
    ? recentSubmissions.filter((s) => s.status === 'pending')
    : recentSubmissions;
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-0">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1 sm:space-y-2"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
          <span className="text-gradient">관리자 대시보드</span>
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          애드센스 마케팅 플랫폼 관리 시스템
        </p>
      </motion.div>

      {/* 통계 카드 */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4"
      >
        {cards.map((card, index) => {
          const Icon = iconMap[card.icon];
          return (
            <motion.div key={card.title} variants={item}>
              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`rounded-lg bg-gradient-to-br ${gradients[index]} p-1.5 sm:p-2 lg:p-2.5 shadow-lg`}>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                    {card.value}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-0.5 sm:gap-1">
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 최근 접수 내역 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-primary/10">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 sm:p-3 shadow-lg shadow-primary/30">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg lg:text-xl">최근 접수 내역</CardTitle>
              </div>
              <Button
                variant={showOnlyPending ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyPending(!showOnlyPending)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{showOnlyPending ? '전체 보기' : '대기중만'}</span>
                <span className="sm:hidden">{showOnlyPending ? '전체' : '대기중'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {filteredSubmissions.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-center py-3 sm:py-4">
                {showOnlyPending ? '대기중인 접수 내역이 없습니다.' : '최근 접수 내역이 없습니다.'}
              </p>
            ) : (
              <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={`${submission.type}-${submission.id}`}
                    className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold truncate">
                          {submission.client_name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {submission.company_name}
                        </p>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-primary whitespace-nowrap">
                        {submission.total_points.toLocaleString()} P
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5">
                        {submission.type === 'dynamic' && submission.category_name
                          ? submission.category_name
                          : TYPE_LABELS[submission.type]}
                      </Badge>
                      <Badge variant={STATUS_VARIANTS[submission.status]} className="text-[10px] sm:text-xs px-2 py-0.5">
                        {STATUS_LABELS[submission.status]}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(submission.created_at).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
