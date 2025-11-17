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
    const [placeRes, receiptRes, kakaomapRes, blogRes, cafeRes] = await Promise.all([
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
      supabase
        .from('cafe_marketing_submissions')
        .select('*, clients(company_name)')
        .order('created_at', { ascending: false }),
      // supabase
      //   .from('dynamic_submissions')
      //   .select('*, clients(company_name), product_categories(name, slug)')
      //   .order('created_at', { ascending: false }),
    ]);

    // Debug logging
    console.log('[통합 접수 API] 데이터 개수:', {
      place: placeRes.data?.length || 0,
      receipt: receiptRes.data?.length || 0,
      kakaomap: kakaomapRes.data?.length || 0,
      blog: blogRes.data?.length || 0,
      cafe: cafeRes.data?.length || 0,
    });

    if (cafeRes.data && cafeRes.data.length > 0) {
      console.log('[통합 접수 API] cafe 첫 번째 데이터 샘플:', cafeRes.data[0]);
    }

    // Map cafe status to standard SubmissionStatus format
    // Cafe has extended status: 'approved', 'script_writing', 'script_completed'
    // Map them to standard status for unified view
    const mapCafeStatus = (status: string): string => {
      switch (status) {
        case 'approved':
        case 'script_writing':
        case 'script_completed':
          return 'in_progress';
        default:
          return status; // 'pending', 'in_progress', 'completed', 'cancelled'
      }
    };

    const submissions: any[] = [
      ...(placeRes.data || []).map(s => ({ ...s, type: 'place' as const })),
      ...(receiptRes.data || []).map(s => ({ ...s, type: 'receipt' as const })),
      ...(kakaomapRes.data || []).map(s => ({ ...s, type: 'kakaomap' as const })),
      ...(blogRes.data || []).map(s => ({ ...s, type: 'blog' as const })),
      ...(cafeRes.data || []).map(s => ({
        ...s,
        type: 'cafe' as const,
        original_status: s.status, // 원본 status 보존
        status: mapCafeStatus(s.status) // 표준 status로 매핑
      })),
      // ...(dynamicRes.data || []).map(s => ({ ...s, type: 'dynamic' as const })), // [DISABLED 2025-11-02]
    ];

    console.log('[통합 접수 API] 총 submissions 개수:', submissions.length);
    const cafeSubs = submissions.filter(s => s.type === 'cafe');
    console.log('[통합 접수 API] cafe 타입 submissions:', cafeSubs.length);
    if (cafeSubs.length > 0) {
      console.log('[통합 접수 API] cafe 샘플 (매핑 후):', cafeSubs[0]);
    }

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
