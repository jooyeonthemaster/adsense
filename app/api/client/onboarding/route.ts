import { NextResponse } from 'next/server';
import { requireAuth, createSession } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(['client']);
    const body = await request.json();

    const {
      contact_person,
      company_name,
      phone,
      email,
      tax_email,
      business_license_url,
      referrer_username,
    } = body;

    // 필수 필드 검증
    if (!contact_person?.trim()) {
      return NextResponse.json(
        { error: '담당자명을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!company_name?.trim()) {
      return NextResponse.json(
        { error: '회사명을 입력해주세요.' },
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

    if (!tax_email?.trim()) {
      return NextResponse.json(
        { error: '세금계산서 이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!business_license_url) {
      return NextResponse.json(
        { error: '사업자등록증을 업로드해주세요.' },
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

    if (!emailRegex.test(tax_email)) {
      return NextResponse.json(
        { error: '올바른 세금계산서 이메일 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Validate referrer if provided
    let referrer_id = null;
    if (referrer_username) {
      const { data: referrer, error: referrerError } = await supabase
        .from('clients')
        .select('id')
        .eq('username', referrer_username)
        .single();

      if (referrerError || !referrer) {
        return NextResponse.json(
          { error: '존재하지 않는 추천인 ID입니다.' },
          { status: 400 }
        );
      }
      referrer_id = referrer.id;
    }

    // 온보딩 데이터 저장
    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update({
        contact_person: contact_person.trim(),
        company_name: company_name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        tax_email: tax_email.trim(),
        business_license_url,
        referrer_id,
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

    // 세션 재생성 (업데이트된 onboarding_completed 값 반영)
    await createSession({
      id: updatedClient.id,
      username: updatedClient.username,
      name: updatedClient.company_name,
      type: 'client',
      company_name: updatedClient.company_name,
      points: updatedClient.points,
      onboarding_completed: true, // 업데이트된 값
      client_type: updatedClient.client_type || null,
    });

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
