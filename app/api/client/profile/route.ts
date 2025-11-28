import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    const { data: client, error } = await supabase
      .from('clients')
      .select('id, username, company_name, points, pending_charge_requests_count')
      .eq('id', user.id)
      .single();

    if (error || !client) {
      return NextResponse.json(
        { error: '프로필 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error in GET /api/client/profile:', error);
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

