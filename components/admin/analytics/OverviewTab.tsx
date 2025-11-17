import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { motion } from 'framer-motion';
import { KPICard } from './KPICard';

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

const COLORS = [
  'hsl(174, 72%, 56%)',
  'hsl(195, 70%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(142, 76%, 36%)',
];

interface OverviewTabProps {
  trends: any;
  stats: any;
  insights: any;
  getProductName: (type: string) => string;
}

export function OverviewTab({ trends, stats, insights, getProductName }: OverviewTabProps) {
  return (
    <div className="space-y-6">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              대기 중 접수
            </CardTitle>
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
                ? Math.round((stats.kpi.completedSubmissions / stats.kpi.totalSubmissions) * 100)
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
              <BarChart data={stats.topClientsBySubmissions?.slice(0, 10)} layout="vertical">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 처리 시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {insights.insights.avgProcessingDays}
            </div>
            <p className="text-xs text-muted-foreground mt-1">일</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AS 발생률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{insights.insights.asRequestRate}</div>
            <p className="text-xs text-muted-foreground mt-1">%</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              포인트 회전율
            </CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              활성 거래처
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{stats.kpi.activeClients}</div>
            <p className="text-xs text-muted-foreground mt-1">/ {stats.kpi.totalClients} 개</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

