import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export interface ContentItem {
  id: string;
  submission_id: string;
  upload_order: number;
  image_url: string | null;
  script_text: string | null;
  review_status: 'pending' | 'approved' | 'revision_requested';
  has_been_revised: boolean;
  review_registered_date: string | null;
  receipt_date: string | null;
  review_link: string | null;
  review_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const supabase = await createClient();

    // 해당 submission의 모든 콘텐츠 아이템 조회
    const { data: contentItems, error } = await supabase
      .from('receipt_content_items')
      .select('*')
      .eq('submission_id', id)
      .order('upload_order', { ascending: true });

    if (error) {
      console.error('Error fetching content items:', error);
      return NextResponse.json({
        contentItems: [],
        error: error.message
      }, { status: 200 });
    }

    // submission 정보도 함께 조회 (업체명 등)
    const { data: submission } = await supabase
      .from('receipt_review_submissions')
      .select('submission_number, company_name')
      .eq('id', id)
      .single();

    return NextResponse.json({
      contentItems: contentItems || [],
      submission: submission || null,
      total: contentItems?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      contentItems: [],
      error: 'Internal server error'
    }, { status: 200 });
  }
}
