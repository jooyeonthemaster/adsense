import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { AnySubmission } from '@/types/submission';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    // Fetch all submission types with client information
    // [DISABLED 2025-11-02] 4가지 고정 상품만 사용 - dynamic_submissions 제외
    const [placeRes, receiptRes, kakaomapRes, blogRes] = await Promise.all([
      supabase
        .from('place_submissions')
        .select('*, clients(company_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('receipt_review_submissions')
        .select('*, clients(company_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('kakaomap_review_submissions')
        .select('*, clients(company_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('blog_distribution_submissions')
        .select('*, clients(company_name)')
        .order('created_at', { ascending: false }),
      // supabase
      //   .from('dynamic_submissions')
      //   .select('*, clients(company_name), product_categories(name, slug)')
      //   .order('created_at', { ascending: false }),
    ]);

    const submissions: any[] = [
      ...(placeRes.data || []).map(s => ({ ...s, type: 'place' as const })),
      ...(receiptRes.data || []).map(s => ({ ...s, type: 'receipt' as const })),
      ...(kakaomapRes.data || []).map(s => ({ ...s, type: 'kakaomap' as const })),
      ...(blogRes.data || []).map(s => ({ ...s, type: 'blog' as const })),
      // ...(dynamicRes.data || []).map(s => ({ ...s, type: 'dynamic' as const })), // [DISABLED 2025-11-02]
    ];

    // Sort by created_at descending
    submissions.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error in GET /api/admin/submissions:', error);
    return NextResponse.json(
      { error: '접수 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
