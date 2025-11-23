import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/service';
import { AdminDashboardContent } from './admin-dashboard-content';

async function getStats() {
  const supabase = createClient();

  const [clientsResult, submissionsResult, pointsResult, asRequestsResult, chargeRequestsResult] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase
      .from('place_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('clients').select('points'),
    supabase
      .from('as_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('point_charge_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const totalClients = clientsResult.count || 0;
  const pendingSubmissions = submissionsResult.count || 0;
  const totalPoints =
    pointsResult.data?.reduce((sum, client) => sum + (client.points || 0), 0) || 0;
  const pendingAsRequests = asRequestsResult.count || 0;
  const pendingChargeRequests = chargeRequestsResult.count || 0;

  return {
    totalClients,
    pendingSubmissions,
    totalPoints,
    pendingAsRequests,
    pendingChargeRequests,
  };
}

async function getRecentSubmissions() {
  const supabase = createClient();

  // 최근 1일(24시간) 기준
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const oneDayAgoISO = oneDayAgo.toISOString();

  const [placeResults, receiptResults, kakaomapResults, blogResults, dynamicResults] =
    await Promise.all([
      supabase
        .from('place_submissions')
        .select('*, clients(company_name)')
        .gte('created_at', oneDayAgoISO)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('receipt_review_submissions')
        .select('*, clients(company_name)')
        .gte('created_at', oneDayAgoISO)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('kakaomap_review_submissions')
        .select('*, clients(company_name)')
        .gte('created_at', oneDayAgoISO)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('blog_distribution_submissions')
        .select('*, clients(company_name)')
        .gte('created_at', oneDayAgoISO)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('dynamic_product_submissions')
        .select('*, clients(company_name), product_categories(name)')
        .gte('created_at', oneDayAgoISO)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  const allSubmissions = [
    ...(placeResults.data || []).map((s) => ({
      ...s,
      type: 'place' as const,
      client_name: s.clients?.company_name || '',
    })),
    ...(receiptResults.data || []).map((s) => ({
      ...s,
      type: 'receipt' as const,
      client_name: s.clients?.company_name || '',
    })),
    ...(kakaomapResults.data || []).map((s) => ({
      ...s,
      type: 'kakaomap' as const,
      client_name: s.clients?.company_name || '',
    })),
    ...(blogResults.data || []).map((s) => ({
      ...s,
      type: 'blog' as const,
      client_name: s.clients?.company_name || '',
    })),
    ...(dynamicResults.data || []).map((s) => ({
      ...s,
      type: 'dynamic' as const,
      client_name: s.clients?.company_name || '',
      category_name: s.product_categories?.name || '',
    })),
  ];

  // 최신순 정렬 후 최대 10개
  return allSubmissions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);
}

async function getRecentChargeRequests() {
  const supabase = createClient();

  // 최근 7일 기준
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const { data: chargeRequests, error } = await supabase
    .from('point_charge_requests')
    .select('*, clients(company_name, username)')
    .gte('created_at', sevenDaysAgoISO)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching charge requests:', error);
    return [];
  }

  return chargeRequests || [];
}

export default async function AdminDashboard() {
  await requireAuth(['admin']);
  const [stats, recentSubmissions, recentChargeRequests] = await Promise.all([
    getStats(),
    getRecentSubmissions(),
    getRecentChargeRequests(),
  ]);

  const cards = [
    {
      title: '총 거래처',
      value: stats.totalClients,
      icon: 'Users' as const,
      description: '활성 거래처 수',
    },
    {
      title: '대기 중인 접수',
      value: stats.pendingSubmissions,
      icon: 'FileText' as const,
      description: '처리 대기 중',
    },
    {
      title: 'AS 신청',
      value: stats.pendingAsRequests,
      icon: 'AlertCircle' as const,
      description: '처리 대기 중',
    },
    {
      title: '충전 요청',
      value: stats.pendingChargeRequests,
      icon: 'DollarSign' as const,
      description: '승인 대기 중',
    },
    {
      title: '총 포인트',
      value: stats.totalPoints.toLocaleString(),
      icon: 'DollarSign' as const,
      description: '전체 거래처 보유',
    },
  ];

  return <AdminDashboardContent stats={stats} cards={cards} recentSubmissions={recentSubmissions} recentChargeRequests={recentChargeRequests} />;
}
