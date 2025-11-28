import { NextRequest, NextResponse } from 'next/server';
import { authenticateKakaoClient, createSession } from '@/lib/auth';

/**
 * 카카오 OAuth 콜백 처리
 * 직접 Kakao REST API 사용
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // 에러 처리 (사용자가 로그인 취소한 경우 등)
  if (error) {
    console.error('카카오 OAuth 에러:', error);
    return NextResponse.redirect(`${origin}/login?error=kakao_cancelled`);
  }

  if (!code) {
    console.error('카카오 콜백: code 없음');
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
  const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;

  if (!KAKAO_CLIENT_ID || !KAKAO_CLIENT_SECRET) {
    console.error('카카오 환경변수 설정 필요');
    return NextResponse.redirect(`${origin}/login?error=kakao_config_error`);
  }

  try {
    // 1. 인가 코드로 토큰 교환
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        client_secret: KAKAO_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/callback`,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('토큰 교환 실패:', errorData);
      return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. 액세스 토큰으로 사용자 정보 가져오기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('사용자 정보 조회 실패:', errorData);
      return NextResponse.redirect(`${origin}/login?error=user_info_failed`);
    }

    const userData = await userResponse.json();

    // 3. 카카오 사용자 정보 추출
    const kakaoId = String(userData.id);
    const nickname = userData.kakao_account?.profile?.nickname ||
                     userData.properties?.nickname ||
                     '카카오 사용자';

    console.log('카카오 사용자 정보:', {
      kakaoId,
      nickname,
    });

    const kakaoUserInfo = {
      kakaoId,
      email: null, // 이메일 권한 없음
      nickname,
    };

    // 4. clients 테이블에서 조회 또는 신규 생성
    const clientUser = await authenticateKakaoClient(kakaoUserInfo);

    // 5. 커스텀 세션 생성 (기존 시스템과 통합)
    await createSession(clientUser);

    // 6. 대시보드로 리다이렉트
    return NextResponse.redirect(`${origin}/dashboard`);

  } catch (err) {
    console.error('카카오 콜백 처리 에러:', err);
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }
}
