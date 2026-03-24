import { createClient } from '@/utils/supabase/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export type UserType = 'admin' | 'client';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  type: UserType;
  company_name?: string;
  points?: number;
  is_super_admin?: boolean;
  onboarding_completed?: boolean;
  client_type?: 'advertiser' | 'agency' | null;
}

export interface SessionData {
  user: AuthUser;
  expiresAt: number;
}

const SESSION_COOKIE_NAME = 'adsense_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function authenticateAdmin(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const supabase = await createClient();

  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !admin) {
    return null;
  }

  const isValid = await verifyPassword(password, admin.password);

  if (!isValid) {
    return null;
  }
  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    type: 'admin',
    is_super_admin: admin.is_super_admin,
  };
}

export async function authenticateClient(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('username', username)
    .eq('is_active', true)
    .single();

  if (error || !client) {
    return null;
  }

  const isValid = await verifyPassword(password, client.password);
  if (!isValid) {
    return null;
  }

  return {
    id: client.id,
    username: client.username,
    name: client.company_name,
    type: 'client',
    company_name: client.company_name,
    points: client.points,
    onboarding_completed: client.onboarding_completed ?? true, // 기존 사용자 호환성
    client_type: client.client_type,
  };
}

export async function createSession(user: AuthUser): Promise<void> {
  const cookieStore = await cookies();
  const sessionData: SessionData = {
    user,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionData: SessionData = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      await destroySession();
      return null;
    }

    return sessionData;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(
  allowedTypes?: UserType[]
): Promise<AuthUser> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  if (allowedTypes && !allowedTypes.includes(session.user.type)) {
    throw new Error('Forbidden');
  }

  return session.user;
}

/**
 * 온보딩을 완료한 클라이언트만 허용하는 인증 함수
 * @throws Error('OnboardingRequired') - 온보딩 미완료 시
 */
export async function requireOnboardedClient(): Promise<AuthUser> {
  const user = await requireAuth(['client']);

  if (user.onboarding_completed === false) {
    throw new Error('OnboardingRequired');
  }

  return user;
}

/**
 * 온보딩 + 프로필 완성을 모두 확인하는 인증 함수
 * @throws Error('OnboardingRequired') - 온보딩 미완료 시
 * @throws Error('ProfileIncomplete') - 프로필 미완성 시
 */
export async function requireCompleteProfile(): Promise<AuthUser> {
  const user = await requireOnboardedClient();

  const { checkProfileCompleteness } = await import('./profile-utils');
  const profileCheck = await checkProfileCompleteness(user.id);

  if (!profileCheck.isComplete) {
    const error = new Error('ProfileIncomplete') as any;
    error.missingFields = profileCheck.missingFieldLabels;
    throw error;
  }

  return user;
}

export interface KakaoUserInfo {
  kakaoId: string;
  email: string | null;
  nickname: string;
}

/**
 * 카카오 ID로 클라이언트 조회
 */
export async function findClientByKakaoId(
  kakaoId: string
): Promise<AuthUser | null> {
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('kakao_id', kakaoId)
    .eq('is_active', true)
    .single();

  if (error || !client) {
    return null;
  }

  return {
    id: client.id,
    username: client.username,
    name: client.company_name,
    type: 'client',
    company_name: client.company_name,
    points: client.points,
    onboarding_completed: client.onboarding_completed ?? true,
    client_type: client.client_type,
  };
}

/**
 * 카카오 사용자로 새 클라이언트 생성
 */
export async function createKakaoClient(
  kakaoUser: KakaoUserInfo
): Promise<AuthUser> {
  const supabase = await createClient();

  // username 생성: kakao_ + 랜덤 8자리
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const username = `kakao_${randomSuffix}`;

  // company_name: 닉네임 또는 기본값
  const companyName = kakaoUser.nickname || '카카오 사용자';

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      username,
      password: null,
      company_name: companyName,
      email: kakaoUser.email,
      kakao_id: kakaoUser.kakaoId,
      auth_provider: 'kakao',
      points: 0,
      is_active: true,
      auto_distribution_approved: false,
      pending_charge_requests_count: 0,
      onboarding_completed: false, // 신규 카카오 사용자는 온보딩 필요
      client_type: null,
    })
    .select()
    .single();

  if (error || !client) {
    console.error('카카오 계정 생성 실패:', error);
    throw new Error('카카오 계정 생성에 실패했습니다.');
  }

  return {
    id: client.id,
    username: client.username,
    name: client.company_name,
    type: 'client',
    company_name: client.company_name,
    points: client.points,
    onboarding_completed: false,
    client_type: null,
  };
}

/**
 * 카카오 로그인 처리 (조회 또는 생성)
 */
export async function authenticateKakaoClient(
  kakaoUser: KakaoUserInfo
): Promise<AuthUser> {
  // 1. 기존 카카오 계정 조회
  const existingUser = await findClientByKakaoId(kakaoUser.kakaoId);
  if (existingUser) {
    return existingUser;
  }

  // 2. 신규 계정 생성
  return createKakaoClient(kakaoUser);
}
