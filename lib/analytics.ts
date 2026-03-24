import { createClient } from '@/utils/supabase/server';
import type {
  KPIMetrics,
  ProductStats,
  PeriodStats,
  ClientRanking,
  DashboardStats,
  InsightMetrics,
  HourlyPattern,
  ClientROI,
} from '@/types/analytics';

/**
 * 전체 KPI 메트릭 계산
 */
export async function calculateKPIMetrics(): Promise<KPIMetrics> {
  const supabase = await createClient();

  // 병렬 쿼리 실행
  const [
    clientsRes,
    activeClientsRes,
    placeRes,
    receiptRes,
    kakaomapRes,
    blogRes,
    pointsRes,
    asRes,
  ] = await Promise.all([
    // 총 거래처 수
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', true),

    // 활성 거래처 수 (포인트 > 0)
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('points', 0),

    // 플레이스 접수
    supabase.from('place_submissions').select('status, total_points'),

    // 영수증 접수
    supabase.from('receipt_review_submissions').select('status, total_points'),

    // 카카오맵 접수
    supabase.from('kakaomap_review_submissions').select('status, total_points'),

    // 블로그 접수
    supabase.from('blog_distribution_submissions').select('status, total_points'),

    // 포인트 발행 (총 충전)
    supabase.from('point_transactions').select('amount, transaction_type'),

    // AS 대기 건수
    supabase.from('as_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  // 모든 접수 통합
  const allSubmissions = [
    ...(placeRes.data || []),
    ...(receiptRes.data || []),
    ...(kakaomapRes.data || []),
    ...(blogRes.data || []),
  ];

  // 상태별 집계
  const pendingCount = allSubmissions.filter((s) => s.status === 'pending').length;
  const approvedCount = allSubmissions.filter((s) => s.status === 'approved').length;
  const completedCount = allSubmissions.filter((s) => s.status === 'completed').length;
  const cancelledCount = allSubmissions.filter((s) => s.status === 'cancelled').length;

  // 포인트 집계
  const pointsData = pointsRes.data || [];
  const totalPointsIssued = pointsData
    .filter((t) => t.transaction_type === 'charge')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPointsUsed = pointsData
    .filter((t) => t.transaction_type === 'deduct')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalClients: clientsRes.count || 0,
    activeClients: activeClientsRes.count || 0,
    totalSubmissions: allSubmissions.length,
    pendingSubmissions: pendingCount,
    approvedSubmissions: approvedCount,
    completedSubmissions: completedCount,
    cancelledSubmissions: cancelledCount,
    totalPointsIssued,
    totalPointsUsed,
    totalPointsBalance: totalPointsIssued - totalPointsUsed,
    pendingASRequests: asRes.count || 0,
  };
}

/**
 * 상품별 통계 계산
 */
export async function calculateProductStats(): Promise<ProductStats[]> {
  const supabase = await createClient();

  const [placeRes, receiptRes, kakaomapRes, blogRes] = await Promise.all([
    supabase.from('place_submissions').select('status, total_points'),
    supabase.from('receipt_review_submissions').select('status, total_points'),
    supabase.from('kakaomap_review_submissions').select('status, total_points'),
    supabase.from('blog_distribution_submissions').select('status, total_points'),
  ]);

  const calculateTypeStats = (
    type: 'place' | 'receipt' | 'kakaomap' | 'blog',
    data: { status: string; total_points: number | null }[]
  ): ProductStats => {
    const count = data.length;
    const totalPoints = data.reduce((sum, d) => sum + (d.total_points || 0), 0);
    const completedCount = data.filter((d) => d.status === 'completed').length;

    return {
      type,
      count,
      totalPoints,
      avgPoints: count > 0 ? Math.round(totalPoints / count) : 0,
      completionRate: count > 0 ? Math.round((completedCount / count) * 100) : 0,
    };
  };

  const stats: ProductStats[] = [
    calculateTypeStats('place', placeRes.data || []),
    calculateTypeStats('receipt', receiptRes.data || []),
    calculateTypeStats('kakaomap', kakaomapRes.data || []),
    calculateTypeStats('blog', blogRes.data || []),
  ];

  return stats;
}

/**
 * 기간별 통계 계산 (일별, 주별, 월별)
 */
export async function calculatePeriodStats(
  period: 'daily' | 'weekly' | 'monthly',
  limit: number = 30
): Promise<PeriodStats[]> {
  const supabase = await createClient();

  // 모든 접수 테이블에서 데이터 조회
  const [placeRes, receiptRes, kakaomapRes, blogRes] = await Promise.all([
    supabase
      .from('place_submissions')
      .select('created_at, total_points')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('receipt_review_submissions')
      .select('created_at, total_points')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('kakaomap_review_submissions')
      .select('created_at, total_points')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('blog_distribution_submissions')
      .select('created_at, total_points')
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);

  const allData = [
    ...(placeRes.data || []),
    ...(receiptRes.data || []),
    ...(kakaomapRes.data || []),
    ...(blogRes.data || []),
  ];

  const grouped = new Map<string, { count: number; points: number }>();

  allData.forEach((item) => {
    const date = new Date(item.created_at);
    let key: string;

    if (period === 'daily') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      // monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!grouped.has(key)) {
      grouped.set(key, { count: 0, points: 0 });
    }

    const stats = grouped.get(key)!;
    stats.count++;
    stats.points += item.total_points || 0;
  });

  // Map을 배열로 변환하고 정렬
  return Array.from(grouped.entries())
    .map(([date, stats]) => ({
      date,
      count: stats.count,
      points: stats.points,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}

/**
 * 거래처 랭킹 계산
 */
export async function calculateClientRankings(
  by: 'submissions' | 'points',
  limit: number = 10
): Promise<ClientRanking[]> {
  const supabase = await createClient();

  // 모든 접수 데이터 조회
  const [placeRes, receiptRes, kakaomapRes, blogRes] = await Promise.all([
    supabase
      .from('place_submissions')
      .select('client_id, total_points, created_at'),
    supabase
      .from('receipt_review_submissions')
      .select('client_id, total_points, created_at'),
    supabase
      .from('kakaomap_review_submissions')
      .select('client_id, total_points, created_at'),
    supabase
      .from('blog_distribution_submissions')
      .select('client_id, total_points, created_at'),
  ]);

  const allSubmissions = [
    ...(placeRes.data || []),
    ...(receiptRes.data || []),
    ...(kakaomapRes.data || []),
    ...(blogRes.data || []),
  ];

  const clientMap = new Map<
    string,
    {
      count: number;
      points: number;
      lastDate: string;
    }
  >();

  allSubmissions.forEach((sub) => {
    if (!clientMap.has(sub.client_id)) {
      clientMap.set(sub.client_id, {
        count: 0,
        points: 0,
        lastDate: sub.created_at,
      });
    }

    const stats = clientMap.get(sub.client_id)!;
    stats.count++;
    stats.points += sub.total_points || 0;
    if (new Date(sub.created_at) > new Date(stats.lastDate)) {
      stats.lastDate = sub.created_at;
    }
  });

  // 거래처 정보 조회
  const clientIds = Array.from(clientMap.keys());
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .in('id', clientIds);

  // 랭킹 생성
  const rankings: ClientRanking[] = [];
  clientMap.forEach((stats, clientId) => {
    const client = clients?.find((c) => c.id === clientId);
    if (client) {
      rankings.push({
        clientId,
        companyName: client.company_name,
        submissionCount: stats.count,
        totalPoints: stats.points,
        lastSubmissionDate: stats.lastDate,
      });
    }
  });

  // 정렬
  rankings.sort((a, b) => {
    if (by === 'submissions') {
      return b.submissionCount - a.submissionCount;
    } else {
      return b.totalPoints - a.totalPoints;
    }
  });

  return rankings.slice(0, limit);
}

/**
 * 전체 대시보드 통계 계산
 */
export async function calculateDashboardStats(): Promise<DashboardStats> {
  const [
    kpi,
    productStats,
    dailyStats,
    weeklyStats,
    monthlyStats,
    topBySubmissions,
    topByPoints,
  ] = await Promise.all([
    calculateKPIMetrics(),
    calculateProductStats(),
    calculatePeriodStats('daily', 30),
    calculatePeriodStats('weekly', 12),
    calculatePeriodStats('monthly', 12),
    calculateClientRankings('submissions', 10),
    calculateClientRankings('points', 10),
  ]);

  return {
    kpi,
    productStats,
    dailyStats,
    weeklyStats,
    monthlyStats,
    topClientsBySubmissions: topBySubmissions,
    topClientsByPoints: topByPoints,
  };
}

/**
 * 인사이트 지표 계산
 */
export async function calculateInsightMetrics(): Promise<InsightMetrics> {
  const supabase = await createClient();

  // 평균 처리 시간
  const [placeRes, receiptRes, kakaomapRes, blogRes] = await Promise.all([
    supabase
      .from('place_submissions')
      .select('created_at, updated_at, status')
      .eq('status', 'completed'),
    supabase
      .from('receipt_review_submissions')
      .select('created_at, updated_at, status')
      .eq('status', 'completed'),
    supabase
      .from('kakaomap_review_submissions')
      .select('created_at, updated_at, status')
      .eq('status', 'completed'),
    supabase
      .from('blog_distribution_submissions')
      .select('created_at, updated_at, status')
      .eq('status', 'completed'),
  ]);

  const allCompleted = [
    ...(placeRes.data || []),
    ...(receiptRes.data || []),
    ...(kakaomapRes.data || []),
    ...(blogRes.data || []),
  ];

  let totalDays = 0;
  allCompleted.forEach((sub) => {
    const created = new Date(sub.created_at);
    const updated = new Date(sub.updated_at);
    const diffDays = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    totalDays += diffDays;
  });

  const avgProcessingDays =
    allCompleted.length > 0 ? totalDays / allCompleted.length : 0;

  // 상품별 완료율
  const productStats = await calculateProductStats();
  const completionRateByType = productStats.map((ps) => ({
    type: ps.type,
    rate: ps.completionRate,
  }));

  // AS 발생률 (모든 접수 테이블 합산)
  const [placeCountRes, receiptCountRes, kakaomapCountRes, blogCountRes] = await Promise.all([
    supabase.from('place_submissions').select('*', { count: 'exact', head: true }),
    supabase.from('receipt_review_submissions').select('*', { count: 'exact', head: true }),
    supabase.from('kakaomap_review_submissions').select('*', { count: 'exact', head: true }),
    supabase.from('blog_distribution_submissions').select('*', { count: 'exact', head: true }),
  ]);
  const { data: asData } = await supabase.from('as_requests').select('submission_id');

  const totalSubmissions =
    (placeCountRes.count || 0) +
    (receiptCountRes.count || 0) +
    (kakaomapCountRes.count || 0) +
    (blogCountRes.count || 0);
  const uniqueASSubmissions = new Set(asData?.map((a) => a.submission_id) || []).size;
  const asRequestRate =
    totalSubmissions > 0 ? (uniqueASSubmissions / totalSubmissions) * 100 : 0;

  // 포인트 회전율
  const { data: pointsData } = await supabase
    .from('point_transactions')
    .select('transaction_type, amount');

  const charged = (pointsData || [])
    .filter((t) => t.transaction_type === 'charge')
    .reduce((sum, t) => sum + t.amount, 0);
  const used = (pointsData || [])
    .filter((t) => t.transaction_type === 'deduct')
    .reduce((sum, t) => sum + t.amount, 0);

  const pointTurnoverRate = charged > 0 ? (used / charged) * 100 : 0;

  return {
    avgProcessingDays: Math.round(avgProcessingDays * 10) / 10,
    completionRateByType,
    asRequestRate: Math.round(asRequestRate * 10) / 10,
    pointTurnoverRate: Math.round(pointTurnoverRate * 10) / 10,
  };
}

/**
 * 시간대별 접수 패턴
 */
export async function calculateHourlyPattern(): Promise<HourlyPattern[]> {
  const supabase = await createClient();

  const [placeRes, receiptRes, kakaomapRes, blogRes] = await Promise.all([
    supabase.from('place_submissions').select('created_at'),
    supabase.from('receipt_review_submissions').select('created_at'),
    supabase.from('kakaomap_review_submissions').select('created_at'),
    supabase.from('blog_distribution_submissions').select('created_at'),
  ]);

  const allData = [
    ...(placeRes.data || []),
    ...(receiptRes.data || []),
    ...(kakaomapRes.data || []),
    ...(blogRes.data || []),
  ];

  const hourMap = new Map<number, number>();
  for (let i = 0; i < 24; i++) {
    hourMap.set(i, 0);
  }

  allData.forEach((item) => {
    const hour = new Date(item.created_at).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  return Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);
}

/**
 * 거래처별 ROI 계산
 */
export async function calculateClientROI(limit: number = 10): Promise<ClientROI[]> {
  const supabase = await createClient();

  const [placeRes, receiptRes, kakaomapRes, blogRes] = await Promise.all([
    supabase.from('place_submissions').select('client_id, total_points, status'),
    supabase.from('receipt_review_submissions').select('client_id, total_points, status'),
    supabase.from('kakaomap_review_submissions').select('client_id, total_points, status'),
    supabase.from('blog_distribution_submissions').select('client_id, total_points, status'),
  ]);

  const allSubmissions = [
    ...(placeRes.data || []),
    ...(receiptRes.data || []),
    ...(kakaomapRes.data || []),
    ...(blogRes.data || []),
  ];

  const clientMap = new Map<
    string,
    {
      totalInvested: number;
      completedCount: number;
      totalCount: number;
    }
  >();

  allSubmissions.forEach((sub) => {
    if (!clientMap.has(sub.client_id)) {
      clientMap.set(sub.client_id, {
        totalInvested: 0,
        completedCount: 0,
        totalCount: 0,
      });
    }

    const stats = clientMap.get(sub.client_id)!;
    stats.totalInvested += sub.total_points || 0;
    stats.totalCount++;
    if (sub.status === 'completed') {
      stats.completedCount++;
    }
  });

  // 거래처 정보 조회
  const clientIds = Array.from(clientMap.keys());
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .in('id', clientIds);

  // ROI 생성
  const rois: ClientROI[] = [];
  clientMap.forEach((stats, clientId) => {
    const client = clients?.find((c) => c.id === clientId);
    if (client) {
      rois.push({
        clientId,
        companyName: client.company_name,
        totalInvested: stats.totalInvested,
        completedCount: stats.completedCount,
        successRate:
          stats.totalCount > 0
            ? Math.round((stats.completedCount / stats.totalCount) * 100)
            : 0,
      });
    }
  });

  // 성공률로 정렬
  rois.sort((a, b) => b.successRate - a.successRate);

  return rois.slice(0, limit);
}
