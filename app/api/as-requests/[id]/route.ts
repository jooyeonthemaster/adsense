import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;

    const body = await request.json();
    const { status, admin_response } = body;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('as_requests')
      .update({
        status,
        admin_response,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating AS request:', error);
      return NextResponse.json(
        { error: 'AS 요청 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, asRequest: data });
  } catch (error) {
    console.error('Error in PATCH /api/as-requests/[id]:', error);
    return NextResponse.json(
      { error: 'AS 요청 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
