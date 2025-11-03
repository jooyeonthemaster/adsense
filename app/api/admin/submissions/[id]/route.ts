import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { SubmissionStatus } from '@/types/submission';

// Type-to-table mapping for database operations
const TABLE_MAP: Record<string, string> = {
  place: 'place_submissions',
  receipt: 'receipt_review_submissions',
  kakaomap: 'kakaomap_review_submissions',
  blog: 'blog_distribution_submissions',
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAuth(['admin']);
    const { id } = await params;

    const supabase = await createClient();
    const { status, type } = await request.json();

    // Validate required fields
    if (!status || !type) {
      return NextResponse.json(
        { error: 'status와 type은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses: SubmissionStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다.' },
        { status: 400 }
      );
    }

    // Validate type and get table name
    const tableName = TABLE_MAP[type];
    if (!tableName) {
      return NextResponse.json(
        { error: '유효하지 않은 상품 타입입니다.' },
        { status: 400 }
      );
    }

    // Update submission status in the appropriate table
    const { data, error } = await supabase
      .from(tableName)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating submission status:', error);
      return NextResponse.json(
        { error: '상태 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: '해당 접수 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: { ...data, type }
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/submissions/[id]:', error);
    return NextResponse.json(
      { error: '상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
