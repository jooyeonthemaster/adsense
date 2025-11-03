'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsSkeleton, ProgressLoader } from '@/components/skeleton-loader';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  ShoppingCart,
  DollarSign,
  Activity,
  Calendar,
  Clock,
} from 'lucide-react';

interface DashboardData {
  trends: any;
  stats: any;
  insights: any;
}

// [DISABLED] ProductCategory interface - 커스텀 상품 비활성화로 불필요 (2025-11-02)
// interface ProductCategory {
//   id: string;
//   name: string;
//   slug: string;
// }

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

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  // [DISABLED] categories state - 4가지 고정 상품만 사용, 커스텀 상품 비활성화 (2025-11-02)
  // const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // [UPDATED] product-categories API 호출 제거 - 4가지 고정 상품만 사용 (2025-11-02)
      const [trendsRes, statsRes, insightsRes] = await Promise.all([
        fetch('/api/analytics/trends'),
        fetch('/api/analytics/dashboard'),
        fetch('/api/analytics/insights'),
        // fetch('/api/product-categories'), // DISABLED
      ]);

      const trends = await trendsRes.json();
      const stats = await statsRes.json();
      const insights = await insightsRes.json();
      // const categoriesData = await categoriesRes.json(); // DISABLED

      console.log('📊 Dashboard Data Loaded:', {
        productStats: stats.stats?.productStats,
        // categories: categoriesData.categories, // DISABLED
      });

      setData({
        trends: trends.trends || {},
        stats: stats.stats || {},
        insights: {
          insights: insights.insights || { avgProcessingDays: 0, asRequestRate: 0, pointTurnoverRate: 0 },
          hourlyPattern: insights.hourlyPattern || [],
          clientROI: insights.clientROI || [],
        },
      });
      // setCategories(categoriesData.categories || []); // DISABLED
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      // 에러 발생 시에도 기본값 설정
      setData({
        trends: {},
        stats: { kpi: {}, productStats: [], dailyStats: [], weeklyStats: [], monthlyStats: [], topClientsBySubmissions: [], topClientsByPoints: [] },
        insights: {
          insights: { avgProcessingDays: 0, asRequestRate: 0, pointTurnoverRate: 0 },
          hourlyPattern: [],
          clientROI: [],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ProgressLoader />;
  }

  if (!data) {
    return <AnalyticsSkeleton />;
  }

  const { trends, stats, insights } = data;

  const getProductName = (type: string) => {
    switch (type) {
      case 'place':
      case 'place-traffic':
        return '플레이스 유입';
      case 'receipt':
      case 'receipt-review':
        return '영수증 리뷰';
      case 'kakaomap':
      case 'kakaomap-review':
        return '카카오맵 리뷰';
      case 'blog':
      case 'blog-distribution':
        return '블로그 배포';
      default:
        // [UPDATED] 커스텀 상품 비활성화로 categories 참조 제거 (2025-11-02)
        // 4가지 고정 상품만 사용하므로 default case에서 type 그대로 반환
        return type;
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-gradient">데이터 애널리틱스</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          실시간 거래량 분석 및 통계 대시보드
        </p>
      </motion.div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-auto">
            <TabsTrigger value="overview">전체 개요</TabsTrigger>
            <TabsTrigger value="daily">일간 분석</TabsTrigger>
            <TabsTrigger value="weekly">주간 분석</TabsTrigger>
            <TabsTrigger value="monthly">월간 분석</TabsTrigger>
            <TabsTrigger value="products">상품 분석</TabsTrigger>
          </TabsList>
        </div>

        {/* 전체 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 실시간 KPI 카드 */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={item}>
              <KPICard
                title="오늘 접수"
                value={trends.realtime.today.submissions}
                previousValue={trends.realtime.yesterday.submissions}
                trend={trends.realtime.trends.submissions}
                iconName="ShoppingCart"
                unit="건"
                gradientIndex={0}
              />
            </motion.div>
            <motion.div variants={item}>
              <KPICard
                title="오늘 매출"
                value={trends.realtime.today.revenue}
                previousValue={trends.realtime.yesterday.revenue}
                trend={trends.realtime.trends.revenue}
                iconName="DollarSign"
                unit="P"
                gradientIndex={1}
              />
            </motion.div>
            <motion.div variants={item}>
              <KPICard
                title="신규 거래처"
                value={trends.realtime.today.newClients}
                previousValue={trends.realtime.yesterday.newClients}
                trend={trends.realtime.trends.newClients}
                iconName="Users"
                unit="개"
                gradientIndex={2}
              />
            </motion.div>
            <motion.div variants={item}>
              <KPICard
                title="총 거래처"
                value={stats.kpi.totalClients}
                previousValue={stats.kpi.totalClients}
                trend={{ trend: 'stable', changePercent: 0 }}
                iconName="Users"
                unit="개"
                gradientIndex={3}
              />
            </motion.div>
          </motion.div>

          {/* 주요 지표 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">대기 중 접수</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{stats.kpi.pendingSubmissions}</div>
                <p className="text-xs text-muted-foreground mt-1">처리 필요</p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">완료율</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {stats.kpi.totalSubmissions > 0
                    ? Math.round(
                        (stats.kpi.completedSubmissions / stats.kpi.totalSubmissions) * 100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.kpi.completedSubmissions} / {stats.kpi.totalSubmissions} 건
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">AS 신청</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{stats.kpi.pendingASRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">대기 중</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* 일간 추이 차트 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl">최근 30일 접수 추이</CardTitle>
                <CardDescription>일별 접수 건수 및 포인트 사용량</CardDescription>
              </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    name="접수 건수"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="points"
                    stroke="#82ca9d"
                    name="포인트 사용"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          </motion.div>

          {/* 상품별 분포 & TOP 10 거래처 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl">상품별 접수 현황</CardTitle>
                <CardDescription>상품 타입별 분포</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.productStats.map((stat: any) => ({
                        ...stat,
                        name: getProductName(stat.type),
                      }))}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {stats.productStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl">TOP 10 거래처</CardTitle>
                <CardDescription>접수 건수 기준</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats.topClientsBySubmissions?.slice(0, 10)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="companyName" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="submissionCount" fill="#8884d8" name="접수 건수" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* 인사이트 지표 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">평균 처리 시간</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{insights.insights.avgProcessingDays}</div>
                <p className="text-xs text-muted-foreground mt-1">일</p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">AS 발생률</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{insights.insights.asRequestRate}</div>
                <p className="text-xs text-muted-foreground mt-1">%</p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">포인트 회전율</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {insights.insights.pointTurnoverRate}
                </div>
                <p className="text-xs text-muted-foreground mt-1">%</p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">활성 거래처</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{stats.kpi.activeClients}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  / {stats.kpi.totalClients} 개
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* 일간 분석 탭 */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="오늘 접수"
              value={trends.realtime.today.submissions}
              subtitle={`어제: ${trends.realtime.yesterday.submissions}건`}
              trend={trends.realtime.trends.submissions}
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatCard
              title="오늘 매출"
              value={`${trends.realtime.today.revenue.toLocaleString()}P`}
              subtitle={`어제: ${trends.realtime.yesterday.revenue.toLocaleString()}P`}
              trend={trends.realtime.trends.revenue}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatCard
              title="신규 거래처"
              value={trends.realtime.today.newClients}
              subtitle={`어제: ${trends.realtime.yesterday.newClients}개`}
              trend={trends.realtime.trends.newClients}
              icon={<Users className="h-4 w-4" />}
            />
          </div>

          <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl">최근 30일 일간 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={stats.dailyStats}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    name="접수 건수"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 시간대별 패턴 */}
          <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl">시간대별 접수 패턴</CardTitle>
              <CardDescription>0시부터 23시까지 시간대별 접수 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insights.hourlyPattern}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" label={{ value: '시간', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: '접수 건수', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="접수 건수" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 주간 분석 탭 */}
        <TabsContent value="weekly" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="이번 주 접수"
              value={trends.weekly.thisWeek.submissions}
              subtitle={`지난 주: ${trends.weekly.lastWeek.submissions}건`}
              trend={trends.weekly.trends.submissions}
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatCard
              title="이번 주 매출"
              value={`${trends.weekly.thisWeek.pointsUsed.toLocaleString()}P`}
              subtitle={`지난 주: ${trends.weekly.lastWeek.pointsUsed.toLocaleString()}P`}
              trend={trends.weekly.trends.pointsUsed}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatCard
              title="일평균 접수"
              value={trends.weekly.thisWeek.avgPerDay.toFixed(1)}
              subtitle={`지난 주: ${trends.weekly.lastWeek.avgPerDay.toFixed(1)}건`}
              trend={trends.weekly.trends.avgPerDay}
              icon={<Activity className="h-4 w-4" />}
            />
          </div>

          <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl">주간 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    width={80}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toString();
                    }}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === '포인트 사용') {
                        return [value.toLocaleString() + 'P', name];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="접수 건수" />
                  <Bar dataKey="points" fill="#82ca9d" name="포인트 사용" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 월간 분석 탭 */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="이번 달 접수"
              value={trends.monthly.thisMonth.submissions}
              subtitle={`지난 달: ${trends.monthly.lastMonth.submissions}건`}
              trend={trends.monthly.trends.submissions}
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatCard
              title="이번 달 매출"
              value={`${trends.monthly.thisMonth.pointsUsed.toLocaleString()}P`}
              subtitle={`지난 달: ${trends.monthly.lastMonth.pointsUsed.toLocaleString()}P`}
              trend={trends.monthly.trends.pointsUsed}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatCard
              title="신규 거래처"
              value={trends.monthly.thisMonth.newClients}
              subtitle={`지난 달: ${trends.monthly.lastMonth.newClients}개`}
              trend={trends.monthly.trends.newClients}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="완료율"
              value={`${trends.monthly.thisMonth.completionRate}%`}
              subtitle={`지난 달: ${trends.monthly.lastMonth.completionRate}%`}
              trend={trends.monthly.trends.completionRate}
              icon={<Activity className="h-4 w-4" />}
            />
          </div>

          <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl">최근 12개월 월간 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={stats.monthlyStats}>
                  <defs>
                    <linearGradient id="colorMonthCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMonthPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorMonthCount)"
                    name="접수 건수"
                  />
                  <Area
                    type="monotone"
                    dataKey="points"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorMonthPoints)"
                    name="포인트 사용"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상품 분석 탭 */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.productStats.map((product: any) => (
              <Card key={product.type} className="border-primary/10 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {getProductName(product.type)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{product.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    완료율: {product.completionRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    평균: {product.avgPoints.toLocaleString()}P
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl">상품별 접수 건수</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.productStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="type"
                      tickFormatter={(value) => getProductName(value)}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: string, props: any) => [value, '접수 건수']}
                      labelFormatter={(label) => getProductName(label)}
                    />
                    <Bar dataKey="count" fill="#8884d8" name="접수 건수" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl">상품별 포인트 사용</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.productStats} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="type"
                      tickFormatter={(value) => getProductName(value)}
                    />
                    <YAxis
                      width={80}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value.toString();
                      }}
                    />
                    <Tooltip
                      formatter={(value: any) => [value.toLocaleString() + 'P', '포인트 사용']}
                      labelFormatter={(label) => getProductName(label)}
                    />
                    <Bar dataKey="totalPoints" fill="#82ca9d" name="포인트 사용" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl">상품별 완료율 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.productStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="completionRate" fill="#ffc658" name="완료율 (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Icon map for KPI cards
const iconMap = {
  ShoppingCart,
  DollarSign,
  Users,
  Activity,
  Calendar,
  Clock,
};

// KPI 카드 컴포넌트 (증감률 포함)
function KPICard({ title, value, previousValue, trend, iconName, unit, gradientIndex }: any) {
  const Icon = iconMap[iconName as keyof typeof iconMap] || Activity;

  const getTrendIcon = () => {
    if (trend.trend === 'up') return <TrendingUp className="h-3 w-3" />;
    if (trend.trend === 'down') return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend.trend === 'up') return 'text-emerald-600';
    if (trend.trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-lg bg-gradient-to-br ${gradients[gradientIndex % gradients.length]} p-2.5 shadow-lg`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className="text-sm font-normal ml-1">{unit}</span>
        </div>
        <div className={`flex items-center text-xs ${getTrendColor()} mt-1`}>
          {getTrendIcon()}
          <span className="ml-1 flex items-center gap-1">
            {trend.changePercent > 0 ? '+' : ''}
            {trend.changePercent}%
            <span className="text-muted-foreground">vs 어제</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// 통계 카드 컴포넌트
function StatCard({ title, value, subtitle, trend, icon }: any) {
  const getTrendColor = () => {
    if (trend.trend === 'up') return 'text-emerald-600';
    if (trend.trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        <p className={`text-xs ${getTrendColor()} mt-1 font-medium`}>
          {trend.changePercent > 0 ? '+' : ''}
          {trend.changePercent}%
        </p>
      </CardContent>
    </Card>
  );
}

const COLORS = [
  'hsl(174, 72%, 56%)', // primary teal
  'hsl(195, 70%, 50%)', // cyan
  'hsl(262, 83%, 58%)', // violet
  'hsl(142, 76%, 36%)', // emerald
];
