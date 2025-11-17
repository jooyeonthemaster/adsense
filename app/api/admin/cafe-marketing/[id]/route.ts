import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const supabase = await createClient();

    // Get submission with client info
    const { data: submission, error } = await supabase
      .from('cafe_marketing_submissions')
      .select(`
        *,
        clients:client_id (
          id,
          username,
          company_name,
          email,
          phone,
          points
        )
      `)
      .eq('id', id)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        { error: '제출 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Fetch daily records
    const { data: dailyRecords } = await supabase
      .from('cafe_marketing_daily_records')
      .select('*')
      .eq('submission_id', id)
      .order('record_date', { ascending: false });

    // Calculate progress
    const completedCount = dailyRecords?.reduce((sum, r) => sum + r.completed_count, 0) || 0;
    const progressPercentage = submission.total_count > 0
      ? Math.round((completedCount / submission.total_count) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        completed_count: completedCount,
        progress_percentage: progressPercentage,
      },
      daily_records: dailyRecords || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/cafe-marketing/[id]:', error);
    return NextResponse.json(
      { error: '제출 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const body = await request.json();
    const { status, script_status, script_url, notes } = body;

    const supabase = await createClient();

    // Validate script_url requirement
    if (script_status === 'completed' && !script_url) {
      return NextResponse.json(
        { error: '원고 완료 상태로 변경하려면 Google Sheets 링크를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (script_status) updateData.script_status = script_status;
    if (script_url !== undefined) updateData.script_url = script_url;
    if (notes !== undefined) updateData.notes = notes;

    // Update submission
    const { error: updateError } = await supabase
      .from('cafe_marketing_submissions')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating cafe marketing submission:', updateError);
      return NextResponse.json(
        { error: '상태 변경 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '상태가 변경되었습니다.',
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/cafe-marketing/[id]:', error);
    return NextResponse.json(
      { error: '상태 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
