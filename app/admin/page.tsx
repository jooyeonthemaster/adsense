import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/service';
import { AdminDashboardContent } from './admin-dashboard-content';

async function getStats() {
  const supabase = createClient();

  const [clientsResult, submissionsResult, pointsResult, asRequestsResult, chargeRequestsResult, cancellationRequestsResult, taxInvoiceRequestsResult] = await Promise.all([
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
    supabase
      .from('cancellation_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('tax_invoice_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const totalClients = clientsResult.count || 0;
  const pendingSubmissions = submissionsResult.count || 0;
  const totalPoints =
    pointsResult.data?.reduce((sum, client) => sum + (client.points || 0), 0) || 0;
  const pendingAsRequests = asRequestsResult.count || 0;
  const pendingChargeRequests = chargeRequestsResult.count || 0;
  const pendingCancellationRequests = cancellationRequestsResult.count || 0;
  const pendingTaxInvoiceRequests = taxInvoiceRequestsResult.count || 0;

  return {
    totalClients,
    pendingSubmissions,
    totalPoints,
    pendingAsRequests,
    pendingChargeRequests,
    pendingCancellationRequests,
    pendingTaxInvoiceRequests,
  };
}

async function getRecentNotifications() {
  const supabase = createClient();

  // 최근 7일 기준 관리자 알림 조회
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_role', 'admin')
    .gte('created_at', sevenDaysAgoISO)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching admin notifications:', error);
    return [];
  }

  return notifications || [];
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

async function getRecentTaxInvoiceRequests() {
  const supabase = createClient();

  // 최근 30일 기준
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const { data: taxInvoiceRequests, error } = await supabase
    .from('tax_invoice_requests')
    .select(`
      *,
      clients (
        id,
        company_name,
        username,
        contact_person,
        phone,
        email,
        tax_email,
        business_license_url
      ),
      point_transactions (
        description,
        created_at
      )
    `)
    .gte('created_at', thirtyDaysAgoISO)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching tax invoice requests:', error);
    return [];
  }

  return taxInvoiceRequests || [];
}

export default async function AdminDashboard() {
  await requireAuth(['admin']);
  const [stats, recentNotifications, recentChargeRequests, recentTaxInvoiceRequests] = await Promise.all([
    getStats(),
    getRecentNotifications(),
    getRecentChargeRequests(),
    getRecentTaxInvoiceRequests(),
  ]);

  const cards = [
    {
      title: '총 거래처',
      value: stats.totalClients,
      icon: 'Users' as const,
      description: '활성 거래처 수',
      link: '/admin/clients',
    },
    {
      title: '대기 중인 접수',
      value: stats.pendingSubmissions,
      icon: 'FileText' as const,
      description: '처리 대기 중',
      link: '/admin/review-marketing?tab=visitor',
    },
    {
      title: 'AS 신청',
      value: stats.pendingAsRequests,
      icon: 'AlertCircle' as const,
      description: '처리 대기 중',
      link: '/admin/as-requests?tab=as',
    },
    {
      title: '중단 요청',
      value: stats.pendingCancellationRequests,
      icon: 'XCircle' as const,
      description: '환불 대기 중',
      link: '/admin/as-requests?tab=cancellation',
    },
    {
      title: '충전 요청',
      value: stats.pendingChargeRequests,
      icon: 'DollarSign' as const,
      description: '승인 대기 중',
      link: '/admin/charge-requests',
    },
    {
      title: '세금계산서 요청',
      value: stats.pendingTaxInvoiceRequests,
      icon: 'FileText' as const,
      description: '발행 대기 중',
      link: '/admin/tax-invoice-requests',
    },
  ];

  return <AdminDashboardContent stats={stats} cards={cards} recentNotifications={recentNotifications} recentChargeRequests={recentChargeRequests} recentTaxInvoiceRequests={recentTaxInvoiceRequests} />;
}
