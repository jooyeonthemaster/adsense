import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      password,
      company_name,
      contact_person,
      phone,
      email,
    } = body;

    // 필수 항목 검증
    if (!username || !password || !company_name || !contact_person || !phone) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 아이디 형식 검증 (영문, 숫자, 밑줄만 허용, 4-20자)
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: '아이디는 4-20자의 영문, 숫자, 밑줄(_)만 사용 가능합니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증 (최소 6자)
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증
    const phoneRegex = /^[0-9-]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증 (선택 항목)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: '올바른 이메일 형식을 입력해주세요.' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // 아이디 중복 검사
    const { data: existingUser } = await supabase
      .from('clients')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 아이디입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password);

    // 클라이언트 생성
    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        username,
        password: hashedPassword,
        company_name,
        contact_person,
        phone,
        email: email || null,
        auth_provider: 'local',
        points: 0,
        is_active: true,
        auto_distribution_approved: false,
        pending_charge_requests_count: 0,
        onboarding_completed: false, // 일반 회원가입도 온보딩 진행
        client_type: null,
      })
      .select('id, username, company_name')
      .single();

    if (insertError) {
      console.error('회원가입 에러:', insertError);
      return NextResponse.json(
        { error: '회원가입 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다. 로그인해주세요.',
      user: {
        id: client.id,
        username: client.username,
        company_name: client.company_name,
      },
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
