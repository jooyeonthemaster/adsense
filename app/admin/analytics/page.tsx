'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsSkeleton, ProgressLoader } from '@/components/skeleton-loader';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, DollarSign, Users, Activity } from 'lucide-react';
import { KPICard } from '@/components/admin/analytics/KPICard';
import { StatCard } from '@/components/admin/analytics/StatCard';
import { OverviewTab } from '@/components/admin/analytics/OverviewTab';

interface DashboardData {
  trends: any;
  stats: any;
  insights: any;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trendsRes, statsRes, insightsRes] = await Promise.all([
        fetch('/api/analytics/trends'),
        fetch('/api/analytics/dashboard'),
        fetch('/api/analytics/insights'),
      ]);

      const trends = await trendsRes.json();
      const stats = await statsRes.json();
      const insights = await insightsRes.json();

      setData({
        trends: trends.trends || {},
        stats: stats.stats || {},
        insights: {
          insights: insights.insights || {
            avgProcessingDays: 0,
            asRequestRate: 0,
            pointTurnoverRate: 0,
          },
          hourlyPattern: insights.hourlyPattern || [],
          clientROI: insights.clientROI || [],
        },
      });
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setData({
        trends: {},
        stats: {
          kpi: {},
          productStats: [],
          dailyStats: [],
          weeklyStats: [],
          monthlyStats: [],
          topClientsBySubmissions: [],
          topClientsByPoints: [],
        },
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

  const getProductName = (type: string) => {
    switch (type) {
      case 'place':
      case 'place-traffic':
      case 'twoople-reward':
        return '투플';
      case 'eureka-reward':
        return '유레카';
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
        return type;
    }
  };

  if (loading) {
    return <ProgressLoader />;
  }

  if (!data) {
    return <AnalyticsSkeleton />;
  }

  const { trends, stats, insights } = data;

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
        <p className="text-lg text-muted-foreground">실시간 거래량 분석 및 통계 대시보드</p>
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
        <TabsContent value="overview">
          <OverviewTab
            trends={trends}
            stats={stats}
            insights={insights}
            getProductName={getProductName}
          />
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
                  <XAxis
                    dataKey="hour"
                    label={{ value: '시간', position: 'insideBottom', offset: -5 }}
                  />
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
              <Card
                key={product.type}
                className="border-primary/10 hover:shadow-lg transition-all duration-300"
              >
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
                    <XAxis dataKey="type" tickFormatter={(value) => getProductName(value)} />
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
                    <XAxis dataKey="type" tickFormatter={(value) => getProductName(value)} />
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
