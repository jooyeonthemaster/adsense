import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateAdmin,
  authenticateClient,
  createSession,
  UserType,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, userType } = body;

    if (!username || !password || !userType) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    let user = null;

    if (userType === 'admin') {
      // 관리자만 ID/PW 로그인 허용
      user = await authenticateAdmin(username, password);
    } else if (userType === 'client') {
      // 거래처 ID/PW 로그인 차단 - 카카오 로그인만 허용
      return NextResponse.json(
        { error: '거래처 로그인은 카카오 로그인만 가능합니다. 카카오로 시작하기를 이용해주세요.' },
        { status: 403 }
      );
    } else {
      return NextResponse.json(
        { error: '잘못된 사용자 유형입니다.' },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    await createSession(user);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        type: user.type,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
