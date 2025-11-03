import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { ClientDashboardContent } from './client-dashboard-content';

async function getClientStats(clientId: string) {
  const supabase = await createClient();

  const [placeResult, receiptResult, kakaomapResult, blogResult] =
    await Promise.all([
      supabase
        .from('place_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId),
      supabase
        .from('receipt_review_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId),
      supabase
        .from('kakaomap_review_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId),
      supabase
        .from('blog_distribution_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId),
    ]);

  const totalSubmissions =
    (placeResult.count || 0) +
    (receiptResult.count || 0) +
    (kakaomapResult.count || 0) +
    (blogResult.count || 0);

  return { totalSubmissions };
}

async function getClientProducts(clientId: string) {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('client_product_prices')
    .select('*, product_categories(*)')
    .eq('client_id', clientId)
    .eq('is_visible', true)
    .eq('product_categories.is_active', true);

  if (error || !products) {
    return [];
  }

  // All products now use dynamic routing
  return products
    .filter((p) => p.product_categories)
    .map((p) => {
      const category = p.product_categories as any;
      const slug = category.slug || '';
      return {
        title: category.name || '',
        description: category.description || '',
        href: `/dashboard/submit/${slug}`,
        iconName: (slug.includes('place') || slug.includes('blog') ? 'Package' : 'FileText') as 'Package' | 'FileText',
      };
    });
}

async function getRecentSubmissions(clientId: string) {
  const supabase = await createClient();

  const [placeResults, receiptResults, kakaomapResults, blogResults] =
    await Promise.all([
      supabase
        .from('place_submissions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('receipt_review_submissions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('kakaomap_review_submissions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('blog_distribution_submissions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

  const allSubmissions = [
    ...(placeResults.data || []).map((s) => ({ ...s, type: 'place' as const })),
    ...(receiptResults.data || []).map((s) => ({ ...s, type: 'receipt' as const })),
    ...(kakaomapResults.data || []).map((s) => ({ ...s, type: 'kakaomap' as const })),
    ...(blogResults.data || []).map((s) => ({ ...s, type: 'blog' as const })),
  ];

  // 최신순 정렬 후 최대 5개
  return allSubmissions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
}

export default async function ClientDashboard() {
  const user = await requireAuth(['client']);
  const [stats, products, recentSubmissions] = await Promise.all([
    getClientStats(user.id),
    getClientProducts(user.id),
    getRecentSubmissions(user.id),
  ]);

  return (
    <ClientDashboardContent
      user={{
        name: user.company_name || user.name,
        points: user.points || 0,
      }}
      stats={stats}
      products={products}
      recentSubmissions={recentSubmissions}
    />
  );
}
