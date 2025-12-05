import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(['client']);
    const body = await request.json();

    const {
      client_type,
      company_name,
      representative_name,
      contact_person,
      phone,
      email,
    } = body;

    // 필수 필드 검증
    if (!client_type || !['advertiser', 'agency'].includes(client_type)) {
      return NextResponse.json(
        { error: '올바른 클라이언트 유형을 선택해주세요.' },
        { status: 400 }
      );
    }

    if (!company_name?.trim()) {
      return NextResponse.json(
        { error: '회사명을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!representative_name?.trim()) {
      return NextResponse.json(
        { error: '대표자명을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: '연락처를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 온보딩 데이터 저장
    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update({
        client_type,
        company_name: company_name.trim(),
        representative_name: representative_name.trim(),
        contact_person: contact_person?.trim() || null,
        phone: phone.trim(),
        email: email.trim(),
        onboarding_completed: true,
        profile_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('온보딩 저장 에러:', error);
      return NextResponse.json(
        { error: '온보딩 정보 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '온보딩이 완료되었습니다.',
      client: updatedClient,
    });
  } catch (error) {
    console.error('온보딩 API 에러:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 온보딩 상태 확인
export async function GET() {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    const { data: client, error } = await supabase
      .from('clients')
      .select('onboarding_completed, client_type')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: '온보딩 상태 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      onboarding_completed: client?.onboarding_completed ?? false,
      client_type: client?.client_type ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
