'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Activity, Database, Users, FileText, DollarSign, Package, Filter, AlertCircle, CreditCard, Check, X, XCircle } from 'lucide-react';
import Link from 'next/link';

const iconMap = {
  Users,
  FileText,
  DollarSign,
  Package,
  AlertCircle,
  XCircle,
};

type IconName = keyof typeof iconMap;

interface AdminNotification {
  id: string;
  recipient_id: string | null;
  recipient_role: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

interface ChargeRequest {
  id: string;
  client_id: string;
  amount: number;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  clients?: {
    company_name: string;
    username: string;
  };
}

interface TaxInvoiceRequest {
  id: string;
  client_id: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  reject_reason: string | null;
  created_at: string;
  clients?: {
    id: string;
    company_name: string;
    username: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    tax_email: string | null;
    business_license_url: string | null;
  };
  point_transactions?: {
    description: string | null;
    created_at: string;
  };
}

interface AdminDashboardContentProps {
  stats: {
    totalClients: number;
    pendingSubmissions: number;
    totalPoints: number;
    pendingAsRequests: number;
    pendingCancellationRequests?: number;
    pendingTaxInvoiceRequests?: number;
  };
  cards: Array<{
    title: string;
    value: string | number;
    icon: IconName;
    description: string;
    link?: string;
  }>;
  recentNotifications: AdminNotification[];
  recentChargeRequests: ChargeRequest[];
  recentTaxInvoiceRequests: TaxInvoiceRequest[];
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

// 알림 타입별 링크 생성
const getNotificationLink = (notification: AdminNotification): string => {
  const data = notification.data || {};
  const submissionId = data.submission_id;

  switch (notification.type) {
    case 'kakaomap_content_approved_by_client':
    case 'kakaomap_feedback_added':
    case 'kakaomap_content_uploaded':
      return submissionId ? `/admin/kakaomap/${submissionId}` : '/admin/review-marketing';
    default:
      return '/admin';
  }
};

const CHARGE_STATUS_LABELS: Record<string, string> = {
  pending: '확인중',
  approved: '승인됨',
  rejected: '거부됨',
};

const CHARGE_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'default',
  approved: 'secondary',
  rejected: 'destructive',
};

const TAX_INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: '대기중',
  completed: '발행완료',
  rejected: '거부됨',
};

const TAX_INVOICE_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'default',
  completed: 'secondary',
  rejected: 'destructive',
};

export function AdminDashboardContent({ stats, cards, recentNotifications, recentChargeRequests, recentTaxInvoiceRequests }: AdminDashboardContentProps) {
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // 필터 적용
  const filteredNotifications = showOnlyUnread
    ? recentNotifications.filter((n) => !n.read)
    : recentNotifications;
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
          마자무 마케팅 플랫폼 관리 시스템
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
          const cardContent = (
            <Card className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/10 ${card.link ? 'cursor-pointer' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg bg-gradient-to-br ${gradients[index % gradients.length]} p-1.5 sm:p-2 lg:p-2.5 shadow-lg`}>
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
          );

          return (
            <motion.div key={card.title} variants={item}>
              {card.link ? (
                <Link href={card.link}>{cardContent}</Link>
              ) : (
                cardContent
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* 관리자 알림 & 최근 충전 요청 (가로 배치) */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* 관리자 알림 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-primary/10 h-full">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 sm:p-3 shadow-lg shadow-primary/30">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg lg:text-xl">관리자 알림</CardTitle>
              </div>
              <Button
                variant={showOnlyUnread ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{showOnlyUnread ? '전체 보기' : '읽지 않음'}</span>
                <span className="sm:hidden">{showOnlyUnread ? '전체' : '미읽음'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {filteredNotifications.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-center py-3 sm:py-4">
                {showOnlyUnread ? '읽지 않은 알림이 없습니다.' : '최근 알림이 없습니다.'}
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    className="block"
                  >
                    <div className={`p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-colors space-y-2 cursor-pointer ${!notification.read ? 'border-primary/50 bg-primary/5' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge variant="default" className="text-[10px] sm:text-xs px-2 py-0.5 whitespace-nowrap">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* 최근 충전 요청 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-primary/10 h-full">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-2 sm:p-3 shadow-lg shadow-emerald-500/30">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg lg:text-xl">최근 충전 요청</CardTitle>
              </div>
              <Link href="/admin/charge-requests">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                >
                  <span>전체 보기</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {recentChargeRequests.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-center py-3 sm:py-4">
                최근 충전 요청이 없습니다.
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentChargeRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold truncate">
                          {request.clients?.company_name || '-'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          @{request.clients?.username || '-'}
                        </p>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-emerald-600 whitespace-nowrap">
                        {request.amount.toLocaleString()} P
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={CHARGE_STATUS_VARIANTS[request.status]} className="text-[10px] sm:text-xs px-2 py-0.5">
                        {CHARGE_STATUS_LABELS[request.status]}
                      </Badge>
                      {request.status === 'pending' && (
                        <Link href="/admin/charge-requests">
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            처리
                          </Button>
                        </Link>
                      )}
                    </div>
                    {request.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {request.description}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('ko-KR', {
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

      {/* 세금계산서 발행 요청 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-primary/10">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 p-2 sm:p-3 shadow-lg shadow-violet-500/30">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg lg:text-xl">세금계산서 발행 요청</CardTitle>
              </div>
              <Link href="/admin/tax-invoice-requests">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                >
                  <span>전체 보기</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {recentTaxInvoiceRequests.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-center py-3 sm:py-4">
                최근 세금계산서 발행 요청이 없습니다.
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentTaxInvoiceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold truncate">
                          {request.clients?.company_name || '-'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          @{request.clients?.username || '-'}
                        </p>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-violet-600 whitespace-nowrap">
                        {request.amount.toLocaleString()} 원
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={TAX_INVOICE_STATUS_VARIANTS[request.status]} className="text-[10px] sm:text-xs px-2 py-0.5">
                        {TAX_INVOICE_STATUS_LABELS[request.status]}
                      </Badge>
                      {request.status === 'pending' && (
                        <Link href="/admin/tax-invoice-requests">
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            처리
                          </Button>
                        </Link>
                      )}
                    </div>
                    {request.point_transactions?.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {request.point_transactions.description}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('ko-KR', {
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
