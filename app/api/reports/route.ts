import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const body = await request.json();
    const { submission_id, submission_type, file_url, file_name } = body;

    // Validation
    if (!submission_id || !submission_type || !file_url || !file_name) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create report record
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        submission_id,
        submission_type,
        file_url,
        file_name,
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
      return NextResponse.json(
        { error: '리포트 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json(
      { error: '리포트 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'client']);
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submission_id');
    const submissionType = searchParams.get('submission_type');

    if (!submissionId || !submissionType) {
      return NextResponse.json(
        { error: '접수 ID와 타입을 제공해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get reports for this submission
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('submission_id', submissionId)
      .eq('submission_type', submissionType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json(
        { error: '리포트 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports: reports || [] });
  } catch (error) {
    console.error('Error in GET /api/reports:', error);
    return NextResponse.json(
      { error: '리포트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
