import { createClient } from '@/utils/supabase/server';

/**
 * 증감률 계산 결과
 */
export interface TrendMetrics {
  current: number;
  previous: number;
  change: number; // 변화량
  changePercent: number; // 변화율 (%)
  trend: 'up' | 'down' | 'stable'; // 추세
}

/**
 * 실시간 거래량 지표
 */
export interface RealtimeMetrics {
  // 오늘
  today: {
    submissions: number;
    pointsUsed: number;
    newClients: number;
    revenue: number; // 총 포인트 사용액
  };
  // 어제
  yesterday: {
    submissions: number;
    pointsUsed: number;
    newClients: number;
    revenue: number;
  };
  // 증감
  trends: {
    submissions: TrendMetrics;
    pointsUsed: TrendMetrics;
    newClients: TrendMetrics;
    revenue: TrendMetrics;
  };
}

/**
 * 주간 비교 지표
 */
export interface WeeklyComparison {
  thisWeek: {
    submissions: number;
    pointsUsed: number;
    avgPerDay: number;
    topProduct: string;
  };
  lastWeek: {
    submissions: number;
    pointsUsed: number;
    avgPerDay: number;
    topProduct: string;
  };
  trends: {
    submissions: TrendMetrics;
    pointsUsed: TrendMetrics;
    avgPerDay: TrendMetrics;
  };
}

/**
 * 월간 비교 지표
 */
export interface MonthlyComparison {
  thisMonth: {
    submissions: number;
    pointsUsed: number;
    newClients: number;
    completionRate: number;
  };
  lastMonth: {
    submissions: number;
    pointsUsed: number;
    newClients: number;
    completionRate: number;
  };
  trends: {
    submissions: TrendMetrics;
    pointsUsed: TrendMetrics;
    newClients: TrendMetrics;
    completionRate: TrendMetrics;
  };
}

/**
 * 증감률 계산 헬퍼
 */
function calculateTrend(current: number, previous: number): TrendMetrics {
  const change = current - previous;
  const changePercent = previous > 0 ? ((change / previous) * 100) : 0;

  let trend: 'up' | 'down' | 'stable';
  if (Math.abs(changePercent) < 1) {
    trend = 'stable';
  } else if (changePercent > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }

  return {
    current,
    previous,
    change,
    changePercent: Math.round(changePercent * 10) / 10,
    trend,
  };
}

/**
 * 날짜 범위의 접수 건수 계산
 */
async function getSubmissionsInRange(startDate: Date, endDate: Date): Promise<number> {
  const supabase = await createClient();

  const startStr = startDate.toISOString();
  const endStr = endDate.toISOString();

  const [placeRes, receiptRes, kakaomapRes, blogRes, customRes] = await Promise.all([
    supabase
      .from('place_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startStr)
      .lte('created_at', endStr),
    supabase
      .from('receipt_review_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startStr)
      .lte('created_at', endStr),
    supabase
      .from('kakaomap_review_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startStr)
      .lte('created_at', endStr),
    supabase
      .from('blog_distribution_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startStr)
      .lte('created_at', endStr),
    supabase
      .from('dynamic_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startStr)
      .lte('created_at', endStr),
  ]);

  return (
    (placeRes.count || 0) +
    (receiptRes.count || 0) +
    (kakaomapRes.count || 0) +
    (blogRes.count || 0) +
    (customRes.count || 0)
  );
}

/**
 * 날짜 범위에서 가장 접수가 많은 상품 이름 반환
 */
async function getTopProductInRange(startDate: Date, endDate: Date): Promise<string> {
  const supabase = await createClient();

  const startStr = startDate.toISOString();
  const endStr = endDate.toISOString();

  const [placeRes, receiptRes, kakaomapRes, blogRes] = await Promise.all([
    supabase
      .from('place_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startStr)
      .lte('created_at', endStr),
    supabase
      .from('receipt_review_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startStr)
      .lte('created_at', endStr),
    supabase
      .from('kakaomap_review_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startStr)
      .lte('created_at', endStr),
    supabase
      .from('blog_distribution_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startStr)
      .lte('created_at', endStr),
  ]);

  const products = [
    { name: '플레이스 유입', count: placeRes.count || 0 },
    { name: '영수증 리뷰', count: receiptRes.count || 0 },
    { name: '카카오맵 리뷰', count: kakaomapRes.count || 0 },
    { name: '블로그 배포', count: blogRes.count || 0 },
  ];

  const top = products.reduce((max, p) => (p.count > max.count ? p : max), products[0]);
  return top.count > 0 ? top.name : '없음';
}

/**
 * 날짜 범위의 포인트 사용량 계산
 */
async function getPointsUsedInRange(startDate: Date, endDate: Date): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('point_transactions')
    .select('amount')
    .eq('transaction_type', 'deduct')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // deduct는 음수로 저장되므로 절대값으로 변환
  return (data || []).reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * 날짜 범위의 신규 거래처 수 계산
 */
async function getNewClientsInRange(startDate: Date, endDate: Date): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  return count || 0;
}

/**
 * 실시간 거래량 지표 계산
 */
export async function calculateRealtimeMetrics(): Promise<RealtimeMetrics> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayEnd);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

  // 병렬 쿼리
  const [
    todaySubmissions,
    todayPoints,
    todayNewClients,
    yesterdaySubmissions,
    yesterdayPoints,
    yesterdayNewClients,
  ] = await Promise.all([
    getSubmissionsInRange(todayStart, todayEnd),
    getPointsUsedInRange(todayStart, todayEnd),
    getNewClientsInRange(todayStart, todayEnd),
    getSubmissionsInRange(yesterdayStart, yesterdayEnd),
    getPointsUsedInRange(yesterdayStart, yesterdayEnd),
    getNewClientsInRange(yesterdayStart, yesterdayEnd),
  ]);

  return {
    today: {
      submissions: todaySubmissions,
      pointsUsed: todayPoints,
      newClients: todayNewClients,
      revenue: todayPoints, // 매출 = 사용 포인트
    },
    yesterday: {
      submissions: yesterdaySubmissions,
      pointsUsed: yesterdayPoints,
      newClients: yesterdayNewClients,
      revenue: yesterdayPoints,
    },
    trends: {
      submissions: calculateTrend(todaySubmissions, yesterdaySubmissions),
      pointsUsed: calculateTrend(todayPoints, yesterdayPoints),
      newClients: calculateTrend(todayNewClients, yesterdayNewClients),
      revenue: calculateTrend(todayPoints, yesterdayPoints),
    },
  };
}

/**
 * 주간 비교 지표 계산
 */
export async function calculateWeeklyComparison(): Promise<WeeklyComparison> {
  const now = new Date();

  // 이번 주 (월요일 시작)
  const thisWeekStart = new Date(now);
  const day = thisWeekStart.getDay();
  const diff = thisWeekStart.getDate() - day + (day === 0 ? -6 : 1);
  thisWeekStart.setDate(diff);
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(now);

  // 지난 주
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1);

  const [
    thisWeekSubmissions, thisWeekPoints, thisWeekTopProduct,
    lastWeekSubmissions, lastWeekPoints, lastWeekTopProduct,
  ] = await Promise.all([
    getSubmissionsInRange(thisWeekStart, thisWeekEnd),
    getPointsUsedInRange(thisWeekStart, thisWeekEnd),
    getTopProductInRange(thisWeekStart, thisWeekEnd),
    getSubmissionsInRange(lastWeekStart, lastWeekEnd),
    getPointsUsedInRange(lastWeekStart, lastWeekEnd),
    getTopProductInRange(lastWeekStart, lastWeekEnd),
  ]);

  const thisWeekDays = Math.ceil(
    (thisWeekEnd.getTime() - thisWeekStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const lastWeekDays = 7;

  const thisWeekAvg = thisWeekDays > 0 ? thisWeekSubmissions / thisWeekDays : 0;
  const lastWeekAvg = lastWeekSubmissions / lastWeekDays;

  return {
    thisWeek: {
      submissions: thisWeekSubmissions,
      pointsUsed: thisWeekPoints,
      avgPerDay: Math.round(thisWeekAvg * 10) / 10,
      topProduct: thisWeekTopProduct,
    },
    lastWeek: {
      submissions: lastWeekSubmissions,
      pointsUsed: lastWeekPoints,
      avgPerDay: Math.round(lastWeekAvg * 10) / 10,
      topProduct: lastWeekTopProduct,
    },
    trends: {
      submissions: calculateTrend(thisWeekSubmissions, lastWeekSubmissions),
      pointsUsed: calculateTrend(thisWeekPoints, lastWeekPoints),
      avgPerDay: calculateTrend(thisWeekAvg, lastWeekAvg),
    },
  };
}

/**
 * 월간 비교 지표 계산
 */
export async function calculateMonthlyComparison(): Promise<MonthlyComparison> {
  const now = new Date();

  // 이번 달
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now);

  // 지난 달
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    thisMonthSubmissions,
    thisMonthPoints,
    thisMonthClients,
    thisMonthCompletionRate,
    lastMonthSubmissions,
    lastMonthPoints,
    lastMonthClients,
    lastMonthCompletionRate,
  ] = await Promise.all([
    getSubmissionsInRange(thisMonthStart, thisMonthEnd),
    getPointsUsedInRange(thisMonthStart, thisMonthEnd),
    getNewClientsInRange(thisMonthStart, thisMonthEnd),
    getCompletionRateInRange(thisMonthStart, thisMonthEnd),
    getSubmissionsInRange(lastMonthStart, lastMonthEnd),
    getPointsUsedInRange(lastMonthStart, lastMonthEnd),
    getNewClientsInRange(lastMonthStart, lastMonthEnd),
    getCompletionRateInRange(lastMonthStart, lastMonthEnd),
  ]);

  return {
    thisMonth: {
      submissions: thisMonthSubmissions,
      pointsUsed: thisMonthPoints,
      newClients: thisMonthClients,
      completionRate: thisMonthCompletionRate,
    },
    lastMonth: {
      submissions: lastMonthSubmissions,
      pointsUsed: lastMonthPoints,
      newClients: lastMonthClients,
      completionRate: lastMonthCompletionRate,
    },
    trends: {
      submissions: calculateTrend(thisMonthSubmissions, lastMonthSubmissions),
      pointsUsed: calculateTrend(thisMonthPoints, lastMonthPoints),
      newClients: calculateTrend(thisMonthClients, lastMonthClients),
      completionRate: calculateTrend(thisMonthCompletionRate, lastMonthCompletionRate),
    },
  };
}

/**
 * 날짜 범위의 완료율 계산 (completed / total * 100)
 */
async function getCompletionRateInRange(startDate: Date, endDate: Date): Promise<number> {
  const supabase = await createClient();

  const startStr = startDate.toISOString();
  const endStr = endDate.toISOString();

  const tables = [
    'place_submissions',
    'receipt_review_submissions',
    'kakaomap_review_submissions',
    'blog_distribution_submissions',
  ] as const;

  const results = await Promise.all(
    tables.flatMap((table) => [
      supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startStr)
        .lte('created_at', endStr),
      supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .eq('status', 'completed'),
    ])
  );

  let totalCount = 0;
  let completedCount = 0;
  for (let i = 0; i < results.length; i += 2) {
    totalCount += results[i].count || 0;
    completedCount += results[i + 1].count || 0;
  }

  return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
}

/**
 * 전체 트렌드 분석 데이터
 */
export interface ComprehensiveTrends {
  realtime: RealtimeMetrics;
  weekly: WeeklyComparison;
  monthly: MonthlyComparison;
}

/**
 * 전체 트렌드 분석 계산
 */
export async function calculateComprehensiveTrends(): Promise<ComprehensiveTrends> {
  const [realtime, weekly, monthly] = await Promise.all([
    calculateRealtimeMetrics(),
    calculateWeeklyComparison(),
    calculateMonthlyComparison(),
  ]);

  return {
    realtime,
    weekly,
    monthly,
  };
}
