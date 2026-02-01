import { NextRequest, NextResponse } from 'next/server';

// 일반 회원가입 비활성화 - 카카오 로그인만 허용
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: '일반 회원가입은 더 이상 지원되지 않습니다. 카카오 로그인을 이용해주세요.',
      redirectTo: '/login'
    },
    { status: 403 }
  );
}
