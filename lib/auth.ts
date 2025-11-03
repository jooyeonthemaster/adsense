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
  console.log('🔍 [AUTH DEBUG] Starting authentication for username:', username);
  console.log('🔍 [AUTH DEBUG] Input password:', password);

  const supabase = await createClient();

  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .single();

  console.log('🔍 [AUTH DEBUG] Database query error:', error);
  console.log('🔍 [AUTH DEBUG] Database query result:', admin);

  if (error || !admin) {
    console.log('❌ [AUTH DEBUG] Admin not found or query error');
    return null;
  }

  console.log('🔍 [AUTH DEBUG] Password hash from database:', admin.password);

  const isValid = await verifyPassword(password, admin.password);
  console.log('🔍 [AUTH DEBUG] Password verification result:', isValid);

  if (!isValid) {
    console.log('❌ [AUTH DEBUG] Password verification failed');
    return null;
  }

  console.log('✅ [AUTH DEBUG] Authentication successful');
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
