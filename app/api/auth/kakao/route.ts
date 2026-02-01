import { NextRequest, NextResponse } from 'next/server';

/**
 * 카카오 OAuth 로그인 시작
 * Supabase Auth 대신 직접 Kakao REST API 사용
 */
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  // Kakao REST API Key
  const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;

  if (!KAKAO_CLIENT_ID) {
    console.error('KAKAO_CLIENT_ID 환경변수가 설정되지 않았습니다.');
    return NextResponse.redirect(`${origin}/login?error=kakao_config_error`);
  }

  // 콜백 URL
  const redirectUri = `${origin}/api/auth/callback`;

  // 디버깅용 로그
  console.log('=== 카카오 로그인 시작 ===');
  console.log('KAKAO_CLIENT_ID:', KAKAO_CLIENT_ID);
  console.log('KAKAO_CLIENT_ID 길이:', KAKAO_CLIENT_ID.length);
  console.log('Redirect URI:', redirectUri);
  console.log('Origin:', origin);

  // 카카오 인증 URL 생성 (account_email 제외!)
  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
  kakaoAuthUrl.searchParams.set('client_id', KAKAO_CLIENT_ID);
  kakaoAuthUrl.searchParams.set('redirect_uri', redirectUri);
  kakaoAuthUrl.searchParams.set('response_type', 'code');
  // scope에 account_email 제외 - 닉네임과 프로필 이미지만 요청
  kakaoAuthUrl.searchParams.set('scope', 'profile_nickname profile_image');

  console.log('카카오 인증 URL:', kakaoAuthUrl.toString());

  return NextResponse.redirect(kakaoAuthUrl.toString());
}
