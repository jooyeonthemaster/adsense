import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAuth(['admin']);

    const body = await request.json();
    const {
      username,
      password,
      company_name,
      contact_person,
      phone,
      email,
      initial_points,
    } = body;

    // Validation
    if (!username || !password || !company_name) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if username already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('username', username)
      .single();

    if (existingClient) {
      return NextResponse.json(
        { error: '이미 존재하는 아이디입니다.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create client
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        username,
        password: hashedPassword,
        company_name,
        contact_person: contact_person || null,
        phone: phone || null,
        email: email || null,
        points: initial_points || 0,
        is_active: true,
        onboarding_completed: false, // 관리자가 생성한 계정도 온보딩 필수
        client_type: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json(
        { error: '거래처 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // If initial points > 0, create transaction record
    if (initial_points && initial_points > 0) {
      await supabase.from('point_transactions').insert({
        client_id: client.id,
        transaction_type: 'charge',
        amount: initial_points,
        balance_after: initial_points,
        description: '초기 포인트 지급',
      });
    }

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error('Error in POST /api/admin/clients:', error);
    return NextResponse.json(
      { error: '거래처 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireAuth(['admin']);

    const supabase = await createClient();
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error in GET /api/admin/clients:', error);
    return NextResponse.json(
      { error: '거래처 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
