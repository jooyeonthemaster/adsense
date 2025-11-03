import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { AnySubmission } from '@/types/submission';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    // Fetch all submission types for this client
    const [placeRes, receiptRes, kakaomapRes, blogRes, dynamicRes] = await Promise.all([
      supabase
        .from('place_submissions')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('receipt_review_submissions')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('kakaomap_review_submissions')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('blog_distribution_submissions')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('dynamic_submissions')
        .select('*, product_categories(name, slug)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const submissions: AnySubmission[] = [
      ...(placeRes.data || []).map(s => ({ ...s, type: 'place' as const })),
      ...(receiptRes.data || []).map(s => ({ ...s, type: 'receipt' as const })),
      ...(kakaomapRes.data || []).map(s => ({ ...s, type: 'kakaomap' as const })),
      ...(blogRes.data || []).map(s => ({ ...s, type: 'blog' as const })),
      ...(dynamicRes.data || []).map(s => ({ ...s, type: 'dynamic' as const })),
    ];

    // Sort by created_at descending
    submissions.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error in GET /api/submissions:', error);
    return NextResponse.json(
      { error: '접수 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
