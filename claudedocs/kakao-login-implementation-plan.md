# 카카오 소셜 로그인 구현 계획서

## 📋 요구사항 정리

| 항목 | 결정 |
|------|------|
| 대상 | `client` (거래처) 전용 |
| 신규 가입 | 카카오로 자동 회원가입 허용 |
| 기존 계정 연동 | 별개 (완전 새로운 회원가입 방식) |
| 구현 방식 | Supabase Auth 사용 |
| 관리자 기능 | 기존과 동일하게 관리 가능 |

---

## 🏗️ 아키텍처 설계

### 인증 플로우 비교

```
[기존 로그인]
사용자 → username/password 입력 → /api/auth/login
→ clients 테이블 조회 → bcrypt 비교 → 커스텀 세션 생성

[카카오 로그인 (신규)]
사용자 → 카카오 버튼 클릭 → Supabase Auth (카카오 OAuth)
→ 콜백 처리 → clients 테이블 조회/생성 → 커스텀 세션 생성
```

### 하이브리드 인증 구조

```
                    ┌─────────────────────┐
                    │    로그인 페이지     │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌────────────────┐ ┌────────────┐ ┌────────────────┐
     │ 거래처 로그인   │ │ 관리자     │ │ 카카오 로그인  │
     │ (username/pw)  │ │ (username) │ │ (OAuth)        │
     └───────┬────────┘ └─────┬──────┘ └───────┬────────┘
             │                │                │
             ▼                ▼                ▼
     ┌────────────────┐ ┌──────────┐ ┌────────────────────┐
     │ /api/auth/login│ │ admins   │ │ Supabase Auth      │
     │ → clients 조회 │ │ 테이블   │ │ → auth.users 생성  │
     └───────┬────────┘ └──────────┘ └───────┬────────────┘
             │                               │
             │                               ▼
             │                    ┌────────────────────┐
             │                    │ /api/auth/callback │
             │                    │ → clients 조회/생성│
             │                    └───────┬────────────┘
             │                            │
             └────────────┬───────────────┘
                          ▼
              ┌─────────────────────┐
              │ 커스텀 세션 생성     │
              │ (adsense_session)   │
              └─────────────────────┘
```

---

## 📁 변경 파일 목록

### 1. 데이터베이스 변경

#### `supabase/migrations/YYYYMMDD_add_kakao_auth.sql`
```sql
-- clients 테이블에 카카오 관련 필드 추가
ALTER TABLE clients ADD COLUMN IF NOT EXISTS kakao_id VARCHAR(255) UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';
-- auth_provider: 'local' (기존), 'kakao' (카카오)

-- 카카오 가입자는 password가 없을 수 있음 (nullable 확인)
-- 기존: password TEXT NOT NULL → password TEXT (nullable로 변경)
ALTER TABLE clients ALTER COLUMN password DROP NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clients_kakao_id ON clients(kakao_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_provider ON clients(auth_provider);
```

### 2. 타입 정의 수정

#### `types/database.ts` 수정
```typescript
export type AuthProvider = 'local' | 'kakao';

export type Client = {
  id: string;
  username: string;
  password: string | null;  // nullable로 변경 (카카오 사용자)
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  points: number;
  is_active: boolean;
  auto_distribution_approved: boolean;
  pending_charge_requests_count: number;
  kakao_id: string | null;        // 추가
  auth_provider: AuthProvider;     // 추가
  created_at: string;
  updated_at: string;
};
```

### 3. 환경변수 추가

#### `.env.local` 수정
```env
# 기존 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 카카오 OAuth (Supabase Dashboard에서 설정)
# - Kakao REST API Key → Client ID
# - Kakao Client Secret → Client Secret
# - Redirect URL: https://xxx.supabase.co/auth/v1/callback
```

### 4. 인증 로직 수정

#### `lib/auth.ts` 수정 (약 50줄 추가)
```typescript
// 추가할 함수들

// 카카오 ID로 클라이언트 조회
export async function findClientByKakaoId(kakaoId: string): Promise<Client | null>

// 카카오 사용자로 새 클라이언트 생성
export async function createKakaoClient(kakaoUser: {
  kakaoId: string;
  email: string | null;
  nickname: string;
}): Promise<AuthUser>

// 카카오 로그인 처리 (조회 또는 생성)
export async function authenticateKakaoClient(kakaoUser: {
  kakaoId: string;
  email: string | null;
  nickname: string;
}): Promise<AuthUser>
```

### 5. 새 API 라우트

#### `app/api/auth/kakao/route.ts` (신규)
```typescript
// 카카오 로그인 시작 - Supabase Auth로 리다이렉트
export async function GET(request: NextRequest) {
  // signInWithOAuth 호출하여 카카오 로그인 페이지로 리다이렉트
}
```

#### `app/api/auth/callback/route.ts` (신규)
```typescript
// 카카오 OAuth 콜백 처리
export async function GET(request: NextRequest) {
  // 1. Supabase Auth 세션 교환
  // 2. 카카오 사용자 정보 추출
  // 3. clients 테이블에서 조회 또는 생성
  // 4. 커스텀 세션 생성 (기존 시스템과 통합)
  // 5. /dashboard로 리다이렉트
}
```

### 6. 로그인 UI 수정

#### `app/login/page.tsx` 수정 (약 30줄 추가)
```typescript
// 거래처 탭에 카카오 로그인 버튼 추가
<TabsContent value="client">
  {/* 기존 username/password 폼 */}

  {/* 구분선 */}
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-background px-2 text-muted-foreground">
        또는
      </span>
    </div>
  </div>

  {/* 카카오 로그인 버튼 */}
  <Button onClick={handleKakaoLogin} className="kakao-button">
    <KakaoIcon /> 카카오로 시작하기
  </Button>
</TabsContent>
```

### 7. 관리자 거래처 관리 수정

#### `app/admin/clients/` 관련 파일 수정
- 거래처 목록에 `auth_provider` 표시 (선택적)
- 카카오 가입자도 동일하게 수정/삭제 가능
- 포인트 관리, 상품 가격 설정 등 기존 기능 그대로 유지

---

## 🔄 구현 단계

### Phase 1: 데이터베이스 준비
1. [ ] clients 테이블에 `kakao_id`, `auth_provider` 컬럼 추가
2. [ ] password 컬럼 nullable로 변경
3. [ ] 인덱스 생성

### Phase 2: Supabase 설정
4. [ ] Kakao Developers에서 앱 생성 및 설정
   - REST API Key 획득
   - Client Secret 생성
   - Redirect URI 등록
   - 동의항목 설정 (이메일, 프로필)
5. [ ] Supabase Dashboard에서 Kakao Provider 활성화
   - Client ID, Client Secret 입력

### Phase 3: 백엔드 구현
6. [ ] `types/database.ts` 타입 수정
7. [ ] `lib/auth.ts` 카카오 인증 함수 추가
8. [ ] `/api/auth/kakao/route.ts` 생성
9. [ ] `/api/auth/callback/route.ts` 생성

### Phase 4: 프론트엔드 구현
10. [ ] 카카오 아이콘 컴포넌트 생성
11. [ ] 로그인 페이지에 카카오 버튼 추가
12. [ ] 카카오 로그인 핸들러 구현

### Phase 5: 테스트 및 검증
13. [ ] 카카오 신규 가입 테스트
14. [ ] 기존 로그인 영향 없음 확인
15. [ ] 관리자 대시보드에서 카카오 계정 관리 테스트
16. [ ] 세션 만료/갱신 테스트

---

## 📝 상세 구현 코드

### 1. DB 마이그레이션

```sql
-- supabase/migrations/20251128_add_kakao_auth.sql

-- 1. 카카오 관련 컬럼 추가
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS kakao_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';

-- 2. password nullable로 변경 (카카오 사용자는 비밀번호 없음)
ALTER TABLE clients ALTER COLUMN password DROP NOT NULL;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clients_kakao_id ON clients(kakao_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_provider ON clients(auth_provider);

-- 4. auth_provider 기본값 업데이트 (기존 데이터)
UPDATE clients SET auth_provider = 'local' WHERE auth_provider IS NULL;

-- 5. 제약조건: 카카오 사용자는 kakao_id 필수
ALTER TABLE clients ADD CONSTRAINT chk_auth_provider
CHECK (
  (auth_provider = 'local' AND password IS NOT NULL) OR
  (auth_provider = 'kakao' AND kakao_id IS NOT NULL)
);
```

### 2. 타입 정의

```typescript
// types/database.ts 수정

export type AuthProvider = 'local' | 'kakao';

export type Client = {
  id: string;
  username: string;
  password: string | null;  // nullable (카카오 사용자)
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  points: number;
  is_active: boolean;
  auto_distribution_approved: boolean;
  pending_charge_requests_count: number;
  kakao_id: string | null;
  auth_provider: AuthProvider;
  created_at: string;
  updated_at: string;
};
```

### 3. 인증 로직 (lib/auth.ts 추가)

```typescript
// 카카오 ID로 클라이언트 조회
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

  if (error || !client) return null;

  return {
    id: client.id,
    username: client.username,
    name: client.company_name,
    type: 'client',
    company_name: client.company_name,
    points: client.points,
  };
}

// 카카오 사용자 신규 생성
export async function createKakaoClient(kakaoUser: {
  kakaoId: string;
  email: string | null;
  nickname: string;
}): Promise<AuthUser> {
  const supabase = await createClient();

  // username 생성 (카카오_닉네임_랜덤)
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const username = `kakao_${randomSuffix}`;

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      username,
      password: null,
      company_name: kakaoUser.nickname || '카카오 사용자',
      email: kakaoUser.email,
      kakao_id: kakaoUser.kakaoId,
      auth_provider: 'kakao',
      points: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error || !client) {
    throw new Error('카카오 계정 생성 실패');
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

// 카카오 로그인 처리 (조회 또는 생성)
export async function authenticateKakaoClient(kakaoUser: {
  kakaoId: string;
  email: string | null;
  nickname: string;
}): Promise<AuthUser> {
  // 1. 기존 카카오 계정 조회
  const existingUser = await findClientByKakaoId(kakaoUser.kakaoId);
  if (existingUser) return existingUser;

  // 2. 신규 생성
  return createKakaoClient(kakaoUser);
}
```

### 4. 콜백 API 라우트

```typescript
// app/api/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { authenticateKakaoClient, createSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // 에러 처리
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=kakao_auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const supabase = await createClient();

    // 1. Supabase Auth 세션 교환
    const { data: authData, error: authError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // 2. 카카오 사용자 정보 추출
    const kakaoUser = {
      kakaoId: authData.user.user_metadata.provider_id || authData.user.id,
      email: authData.user.email || null,
      nickname: authData.user.user_metadata.name ||
                authData.user.user_metadata.full_name ||
                '카카오 사용자',
    };

    // 3. clients 테이블에서 조회 또는 생성
    const user = await authenticateKakaoClient(kakaoUser);

    // 4. 커스텀 세션 생성 (기존 시스템과 통합)
    await createSession(user);

    // 5. 대시보드로 리다이렉트
    return NextResponse.redirect(`${origin}/dashboard`);

  } catch (err) {
    console.error('Kakao callback error:', err);
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }
}
```

### 5. 카카오 로그인 시작 API

```typescript
// app/api/auth/kakao/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    });

    if (error || !data.url) {
      return NextResponse.redirect(`${origin}/login?error=oauth_init_failed`);
    }

    return NextResponse.redirect(data.url);

  } catch (err) {
    console.error('Kakao login error:', err);
    return NextResponse.redirect(`${origin}/login?error=kakao_failed`);
  }
}
```

### 6. 로그인 페이지 UI 수정

```typescript
// app/login/page.tsx 수정 - 거래처 탭 내부

// 카카오 로그인 핸들러 추가
const handleKakaoLogin = () => {
  setLoading(true);
  window.location.href = '/api/auth/kakao';
};

// JSX - 거래처 탭 내부, 기존 폼 아래에 추가
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-muted" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-card px-2 text-muted-foreground">
      또는
    </span>
  </div>
</div>

<Button
  type="button"
  onClick={handleKakaoLogin}
  disabled={loading}
  className="w-full h-11 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-medium transition-all duration-300"
>
  {loading ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.16 4.5 6.54-.2.72-.72 2.64-.84 3.06-.12.54.2.54.42.42.18-.06 2.82-1.92 3.96-2.7.6.06 1.26.12 1.92.12 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"
      />
    </svg>
  )}
  카카오로 시작하기
</Button>
```

---

## ⚠️ 주의사항

### 보안 고려
1. **CSRF 방지**: Supabase Auth가 자동 처리
2. **세션 관리**: 기존 커스텀 세션 시스템 그대로 유지
3. **Service Role Key**: 서버 사이드에서만 사용

### 데이터 정합성
1. **username 중복 방지**: 카카오 사용자는 `kakao_` 접두사 + 랜덤 문자열
2. **auth_provider 체크**: 로그인 시 provider에 맞는 인증 방식 사용
3. **기존 계정 영향 없음**: 새 필드는 nullable/default 값으로 추가

### 관리자 기능
1. 카카오 가입 계정도 기존 관리 기능 100% 호환
2. 비밀번호 초기화 기능은 카카오 계정에 적용 불가 (표시 조건 추가)
3. 계정 삭제, 포인트 관리, 가격 설정 등 모두 동일

---

## 🔧 Kakao Developers 설정 가이드

### 1. 앱 생성
1. https://developers.kakao.com 접속
2. 내 애플리케이션 → 애플리케이션 추가
3. 앱 아이콘, 앱 이름, 회사명 입력

### 2. 플랫폼 설정
1. 앱 설정 → 플랫폼 → Web 플랫폼 등록
2. 사이트 도메인: `https://your-domain.com`

### 3. Kakao 로그인 설정
1. 제품 설정 → 카카오 로그인 → 활성화 ON
2. Redirect URI: `https://your-supabase-ref.supabase.co/auth/v1/callback`

### 4. 동의항목 설정
1. 제품 설정 → 카카오 로그인 → 동의항목
2. 필수 동의: 닉네임
3. 선택 동의: 이메일 (권장)

### 5. 보안 설정
1. 제품 설정 → 카카오 로그인 → 보안
2. Client Secret 코드 생성
3. 활성화 상태: 사용함

### 6. Supabase 설정
1. Supabase Dashboard → Authentication → Providers
2. Kakao 활성화
3. Client ID: REST API 키
4. Client Secret: 생성한 Secret 코드

---

## 📊 예상 작업량

| 단계 | 예상 파일 수 | 예상 코드량 |
|------|-------------|------------|
| DB 마이그레이션 | 1 | ~30줄 |
| 타입 수정 | 1 | ~10줄 |
| lib/auth.ts 수정 | 1 | ~60줄 |
| API 라우트 생성 | 2 | ~80줄 |
| 로그인 UI 수정 | 1 | ~50줄 |
| **합계** | **6개 파일** | **~230줄** |

---

## ✅ 완료 기준

1. [ ] 로그인 페이지에 카카오 버튼 표시
2. [ ] 카카오 버튼 클릭 시 카카오 로그인 페이지로 이동
3. [ ] 카카오 로그인 성공 시 자동으로 계정 생성
4. [ ] 생성된 계정으로 /dashboard 접근 가능
5. [ ] 관리자 대시보드에서 카카오 계정 관리 가능
6. [ ] 기존 username/password 로그인 정상 동작
7. [ ] 세션 만료 후 재로그인 정상 동작
