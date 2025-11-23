'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, FileText, DollarSign, ArrowRight, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { ChargeRequestDialog } from './points/charge-request-dialog';

const iconMap = {
  Package,
  FileText,
};

type IconName = keyof typeof iconMap;

interface RecentSubmission {
  id: string;
  type: 'place' | 'receipt' | 'kakaomap' | 'blog';
  company_name: string;
  total_points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  daily_count?: number;
  total_days?: number;
  total_count?: number;
}

interface ClientDashboardContentProps {
  user: {
    name: string;
    points: number;
  };
  stats: {
    totalSubmissions: number;
  };
  products: Array<{
    title: string;
    description: string;
    href: string;
    iconName: IconName;
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

const TYPE_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
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

export function ClientDashboardContent({
  user,
  stats,
  products,
  recentSubmissions,
}: ClientDashboardContentProps) {
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);

  const statsCards = [
    {
      title: '보유 포인트',
      value: `${user.points.toLocaleString()} P`,
      description: '현재 사용 가능',
      icon: DollarSign,
      gradient: 'from-primary to-primary/80',
      hasButton: true,
    },
    {
      title: '총 접수',
      value: stats.totalSubmissions.toString(),
      description: '전체 접수 건수',
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      hasButton: false,
    },
    {
      title: '이용 상품',
      value: products.length.toString(),
      description: '사용 가능 상품',
      icon: Package,
      gradient: 'from-violet-500 to-purple-500',
      hasButton: false,
    },
  ];

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
          {user.name}님, <span className="text-gradient">환영합니다</span>
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          오늘도 좋은 하루 되세요
        </p>
      </motion.div>

      {/* 통계 카드 */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {statsCards.map((card, index) => (
          <motion.div key={card.title} variants={item}>
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg bg-gradient-to-br ${card.gradient} p-1.5 sm:p-2 lg:p-2.5 shadow-lg`}>
                  <card.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
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
                {card.hasButton && (
                  <Button 
                    onClick={() => setChargeDialogOpen(true)}
                    className="w-full mt-3 sm:mt-4 h-8 sm:h-9 text-xs sm:text-sm bg-gray-800 hover:bg-gray-700"
                  >
                    충전하기
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* 최근 활동 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-3 sm:space-y-4 lg:space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">최근 활동</h2>
          <div className="h-0.5 sm:h-1 flex-1 max-w-xs bg-gradient-to-r from-primary/50 via-primary/20 to-transparent rounded-full ml-3 sm:ml-6" />
        </div>

        <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-primary/10">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 sm:p-3 shadow-lg shadow-primary/30">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg lg:text-xl">최근 접수 내역</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {recentSubmissions.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                최근 접수 내역이 없습니다.
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentSubmissions.map((submission) => (
                  <div
                    key={`${submission.type}-${submission.id}`}
                    className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm sm:text-base font-semibold truncate flex-1">
                        {submission.company_name}
                      </p>
                      <p className="text-sm sm:text-base font-bold text-primary whitespace-nowrap">
                        {submission.total_points.toLocaleString()} P
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5">
                        {TYPE_LABELS[submission.type]}
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
                <Link href="/dashboard/submissions">
                  <Button variant="outline" className="w-full mt-1 sm:mt-2 text-xs sm:text-sm h-8 sm:h-9">
                    전체 보기
                    <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 이용 가능 상품 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="space-y-3 sm:space-y-4 lg:space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">이용 가능 상품</h2>
          <div className="h-0.5 sm:h-1 flex-1 max-w-xs bg-gradient-to-r from-primary/50 via-primary/20 to-transparent rounded-full ml-3 sm:ml-6" />
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2"
        >
          {products.map((product, index) => {
            const Icon = iconMap[product.iconName];
            return (
            <motion.div
              key={product.title}
              variants={item}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-primary/10 h-full">
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                    <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 sm:p-2.5 lg:p-3 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base lg:text-xl mb-1 sm:mb-1.5 lg:mb-2 group-hover:text-primary transition-colors">
                        {product.title}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <Link href={product.href}>
                    <Button className="w-full gradient-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 group/btn text-xs sm:text-sm h-8 sm:h-9 lg:h-10">
                      <span>접수하기</span>
                      <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          );
          })}
        </motion.div>

        {products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 sm:py-10 lg:py-12"
          >
            <Package className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-muted-foreground">
              사용 가능한 상품이 없습니다
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
              관리자에게 문의하세요
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* 충전 요청 다이얼로그 */}
      <ChargeRequestDialog
        open={chargeDialogOpen}
        onOpenChange={setChargeDialogOpen}
      />
    </div>
  );
}
