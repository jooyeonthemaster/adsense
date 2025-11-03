import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { SubmissionStatus } from '@/types/submission';
import { revalidatePath } from 'next/cache';

// Type-to-table mapping for database operations
const TABLE_MAP: Record<string, string> = {
  place: 'place_submissions',
  receipt: 'receipt_review_submissions',
  kakaomap: 'kakaomap_review_submissions',
  blog: 'blog_distribution_submissions',
};

/**
 * GET - 접수 상세 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'type 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const tableName = TABLE_MAP[type];
    if (!tableName) {
      return NextResponse.json(
        { error: '유효하지 않은 상품 타입입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch submission with client information
    const { data, error } = await supabase
      .from(tableName)
      .select('*, clients(id, username, company_name, contact_person, phone, email)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching submission detail:', error);
      return NextResponse.json(
        { error: '접수 정보 조회 중 오류가 발생했습니다.' },
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
    console.error('Error in GET /api/admin/submissions/[id]:', error);
    return NextResponse.json(
      { error: '접수 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - 접수 상태 업데이트
 */
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

    // Get current submission data before update
    const { data: currentSubmission, error: fetchError } = await supabase
      .from(tableName)
      .select('*, clients(points)')
      .eq('id', id)
      .single();

    if (fetchError || !currentSubmission) {
      return NextResponse.json(
        { error: '접수 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const previousStatus = currentSubmission.status;
    const clientId = currentSubmission.client_id;
    const totalPoints = currentSubmission.total_points;

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

    // Handle point refund when status changes to 'cancelled'
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      // Get current client points
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('points')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        console.error('Error fetching client for refund:', clientError);
        return NextResponse.json(
          { error: '포인트 환불 중 거래처 정보를 찾을 수 없습니다.' },
          { status: 500 }
        );
      }

      // Refund points
      const newBalance = client.points + totalPoints;
      const { error: updateError } = await supabase
        .from('clients')
        .update({ points: newBalance })
        .eq('id', clientId);

      if (updateError) {
        console.error('Error refunding points:', updateError);
        return NextResponse.json(
          { error: '포인트 환불 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // Create point transaction record for refund
      const referenceTypeMap: Record<string, string> = {
        place: 'place_submission',
        receipt: 'receipt_submission',
        kakaomap: 'kakaomap_submission',
        blog: 'blog_submission',
      };

      await supabase.from('point_transactions').insert({
        client_id: clientId,
        transaction_type: 'refund',
        amount: totalPoints,
        balance_after: newBalance,
        reference_type: referenceTypeMap[type],
        reference_id: id,
        description: `접수 취소 환불 (${currentSubmission.company_name})`,
      });

      // Revalidate all dashboard pages to show updated points
      revalidatePath('/dashboard', 'layout');
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
