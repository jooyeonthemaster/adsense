# 카페 침투 마케팅 구현 계획서
**작성일**: 2025-01-18
**목적**: 블로그 배포와 동일한 패턴으로 카페 침투 마케팅 관리 시스템 구현

---

## 📋 1. 현재 구현 상황 분석

### ✅ 구현 완료된 부분
1. **상품 카테고리**
   - `product_categories` 테이블에 'cafe-marketing' 카테고리 등록됨
   - 관리자 페이지에서 가격 설정 가능
   - Migration: `20250117_update_product_categories.sql`

2. **클라이언트 제출 폼 UI**
   - 파일: `app/dashboard/cafe/page.tsx`
   - 기능: 업체명, 플레이스 링크, 종류, 지역/카페 선택, 발행 건수, 가이드, 사진유무
   - 상태: UI 완성, 백엔드 연결 안 됨 (Mock 데이터)

3. **클라이언트 상태 확인 페이지 UI**
   - 파일: `app/dashboard/cafe/status/page.tsx`
   - 기능: 제출 내역 조회, 상태 표시, 취소 요청, 통계 대시보드
   - 상태: UI 완성, 백엔드 연결 안 됨 (Mock 데이터)

### ❌ 구현 필요한 부분
1. **데이터베이스 테이블** - 없음
2. **TypeScript 타입 정의** - 없음
3. **클라이언트 제출 API** - 없음
4. **관리자 관리 페이지** - 없음
5. **관리자 API** - 없음

---

## 🗄️ 2. 데이터베이스 설계

### 2.1 메인 테이블: `cafe_marketing_submissions`

```sql
CREATE TABLE IF NOT EXISTS cafe_marketing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- 기본 정보
  company_name VARCHAR(200) NOT NULL,
  place_url TEXT,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('review', 'info')),

  -- 카페 선택 정보
  region VARCHAR(100) NOT NULL, -- 지역군 (예: 서울, 경기 등)
  cafe_list TEXT[] NOT NULL, -- 선택된 카페 이름 목록

  -- 발행 정보
  publish_count INTEGER NOT NULL CHECK (publish_count > 0),
  has_photo BOOLEAN NOT NULL DEFAULT false,

  -- 가이드 및 추가 정보
  guideline TEXT,
  photo_urls TEXT[], -- 첨부 사진 (선택)

  -- 원고 관리
  script_status VARCHAR(20) DEFAULT 'pending' CHECK (
    script_status IN ('pending', 'writing', 'completed')
  ),
  script_url TEXT, -- Google Sheets 링크

  -- 포인트 및 상태
  total_points INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'script_writing', 'script_completed', 'in_progress', 'completed', 'cancelled')
  ),

  -- 메타데이터
  notes TEXT, -- 관리자 메모
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_cafe_submissions_client ON cafe_marketing_submissions(client_id);
CREATE INDEX idx_cafe_submissions_status ON cafe_marketing_submissions(status);
CREATE INDEX idx_cafe_submissions_script_status ON cafe_marketing_submissions(script_status);
CREATE INDEX idx_cafe_submissions_created ON cafe_marketing_submissions(created_at);
```

### 2.2 일일 진행 기록 테이블: `cafe_marketing_daily_records`

```sql
CREATE TABLE IF NOT EXISTS cafe_marketing_daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES cafe_marketing_submissions(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, record_date)
);

-- 인덱스 생성
CREATE INDEX idx_cafe_daily_records_submission ON cafe_marketing_daily_records(submission_id);
CREATE INDEX idx_cafe_daily_records_date ON cafe_marketing_daily_records(record_date);
```

### 2.3 Migration 파일

**파일명**: `supabase/migrations/20250118_cafe_marketing_submissions.sql`

---

## 📐 3. TypeScript 타입 정의

### 3.1 `types/database.ts`에 추가할 타입

```typescript
export type CafeMarketingStatus =
  | 'pending'           // 확인중
  | 'approved'          // 접수완료
  | 'script_writing'    // 원고작성중
  | 'script_completed'  // 원고작업완료
  | 'in_progress'       // 구동중
  | 'completed'         // 완료
  | 'cancelled';        // 중단

export type CafeScriptStatus =
  | 'pending'    // 대기중
  | 'writing'    // 작성중
  | 'completed'; // 완료

export type CafeMarketingSubmission = {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string | null;
  content_type: ContentType; // 'review' | 'info'
  region: string;
  cafe_list: string[];
  publish_count: number;
  has_photo: boolean;
  guideline: string | null;
  photo_urls: string[] | null;
  script_status: CafeScriptStatus;
  script_url: string | null;
  total_points: number;
  status: CafeMarketingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CafeMarketingDailyRecord = {
  id: string;
  submission_id: string;
  record_date: string;
  completed_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
```

---

## 🛣️ 4. API 라우트 설계

### 4.1 클라이언트 제출 API

**경로**: `app/api/submissions/cafe/route.ts`

**기능**:
- `GET`: 현재 클라이언트의 카페 마케팅 제출 내역 조회
- `POST`: 새로운 카페 마케팅 제출

**POST 요청 검증**:
```typescript
- company_name: 필수
- content_type: 'review' | 'info'
- region: 필수
- cafe_list: 최소 1개 카페 선택
- publish_count: 최소 1건
- has_photo: boolean
- guideline: 선택
- photo_urls: 선택
```

**포인트 계산**:
```typescript
const pricePerUnit = await getProductPrice(user.id, 'cafe-marketing');
const calculatedPoints = pricePerUnit * publish_count;

// 사진 포함 시 1.3배
if (has_photo) {
  calculatedPoints *= 1.3;
}
```

**참고**: `app/api/submissions/blog/route.ts` 패턴 동일 적용

---

### 4.2 클라이언트 상세/취소 API

**경로**: `app/api/submissions/cafe/[id]/route.ts`

**기능**:
- `GET`: 특정 제출 상세 조회
- `PATCH`: 제출 취소 (환불 처리 포함)

**취소 로직**:
```typescript
// 1. 제출 상태 확인 (pending, approved만 취소 가능)
// 2. 환불 계산 (이미 진행된 수량 제외)
// 3. 포인트 환불
// 4. 상태를 'cancelled'로 변경
// 5. point_transactions 기록
```

---

### 4.3 관리자 목록 조회 API

**경로**: `app/api/admin/cafe-marketing/route.ts`

**기능**:
- `GET`: 모든 카페 마케팅 제출 내역 조회 (클라이언트 정보 포함)

**응답 데이터**:
```typescript
{
  submissions: [
    {
      ...submission,
      clients: { company_name, username, points },
      completed_count: number,
      progress_percentage: number
    }
  ]
}
```

**참고**: `app/api/admin/blog-distribution/route.ts` 패턴 동일 적용

---

### 4.4 관리자 상세 관리 API

**경로**: `app/api/admin/cafe-marketing/[id]/route.ts`

**기능**:
- `GET`: 제출 상세 조회
- `PATCH`: 상태/원고 URL 업데이트

**PATCH 요청 body**:
```typescript
{
  status?: CafeMarketingStatus,
  script_status?: CafeScriptStatus,
  script_url?: string,
  notes?: string
}
```

---

### 4.5 관리자 일일 기록 API

**경로**: `app/api/admin/cafe-marketing/[id]/daily-records/route.ts`

**기능**:
- `GET`: 특정 제출의 일일 기록 조회
- `POST`: 새로운 일일 기록 추가

**POST 요청 body**:
```typescript
{
  record_date: string, // YYYY-MM-DD
  completed_count: number,
  notes?: string
}
```

**참고**: 블로그 배포의 일일 기록 API 패턴 동일 적용

---

## 🎨 5. 관리자 페이지 설계

### 5.1 관리자 목록 페이지

**경로**: `app/admin/cafe-marketing/page.tsx`

**기능**:
- 모든 카페 마케팅 제출 내역 테이블 표시
- 필터링: 검색, 상태, 원고상태
- 뷰 모드: 리스트뷰 / 그룹뷰 (거래처별, 지역별)
- 통계 카드: 총 접수, 확인중, 구동중, 완료
- 각 행 클릭 시 상세 페이지 이동
- 액션 버튼: 상태 변경, 일일 기록 추가

**UI 컴포넌트**:
```typescript
- Card, Table, Badge, Button, Select, Input
- Dialog (상태 변경, 일일 기록)
- Search, Calendar 아이콘
```

**참고**: `app/admin/blog-distribution/page.tsx` UI 패턴 동일 적용

---

### 5.2 관리자 상세 페이지

**경로**: `app/admin/cafe-marketing/[id]/page.tsx`

**기능**:
- 제출 정보 상세 표시
  - 기본 정보: 업체명, 플레이스 링크, 종류
  - 카페 정보: 지역, 선택된 카페 목록
  - 발행 정보: 발행 건수, 사진 유무
  - 가이드라인 내용
  - 첨부 사진 표시
- 원고 관리 섹션
  - 원고 상태 변경 (pending → writing → completed)
  - Google Sheets 링크 입력/표시
- 상태 관리 섹션
  - 현재 상태 표시 및 변경
  - 상태 히스토리
- 일일 진행 기록
  - 캘린더 뷰
  - 일별 완료 건수 입력
  - 진행률 표시
- 관리자 메모

**상태 흐름**:
```
[확인중] pending
    ↓
[접수완료] approved
    ↓
[원고작성중] script_writing
    ↓
[원고작업완료] script_completed (Google Sheets 링크 필수)
    ↓
[구동중] in_progress
    ↓
[완료] completed
```

**참고**: K맵 리뷰 상세 페이지 원고 관리 패턴 참고

---

## 📝 6. 클라이언트 페이지 수정

### 6.1 제출 폼 수정

**파일**: `app/dashboard/cafe/page.tsx`

**수정 사항**:
1. Mock 데이터 제거
2. 실제 API 연결: `POST /api/submissions/cafe`
3. 포인트 부족 검증
4. 에러 처리 개선
5. 제출 성공 시 상태 페이지로 리다이렉트

**수정 코드 위치**:
```typescript
// 현재 mock 제출
const handleSubmit = async (e: React.FormEvent) => {
  // ... 기존 validation

  // 변경 필요: 실제 API 호출
  const response = await fetch('/api/submissions/cafe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  if (!response.ok) {
    const error = await response.json();
    alert(error.error);
    return;
  }

  alert('카페 침투 마케팅 접수가 완료되었습니다.');
  router.push('/dashboard/cafe/status');
};
```

---

### 6.2 상태 확인 페이지 수정

**파일**: `app/dashboard/cafe/status/page.tsx`

**수정 사항**:
1. Mock 데이터 제거
2. 실제 API 연결: `GET /api/submissions/cafe`
3. 상태 배지 표시 개선
4. 원고작업완료 시 Google Sheets 링크 표시
5. 취소 요청: `PATCH /api/submissions/cafe/[id]`

**상태 배지 설정**:
```typescript
const statusConfig = {
  pending: { label: '확인중', color: 'bg-gray-100 text-gray-800' },
  approved: { label: '접수완료', color: 'bg-blue-100 text-blue-800' },
  script_writing: { label: '원고작성중', color: 'bg-yellow-100 text-yellow-800' },
  script_completed: { label: '원고작업완료', color: 'bg-purple-100 text-purple-800' },
  in_progress: { label: '구동중', color: 'bg-sky-100 text-sky-800' },
  completed: { label: '완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '중단', color: 'bg-red-100 text-red-800' },
};
```

---

## 🚀 7. 구현 순서 (단계별)

### Phase 1: 데이터베이스 및 타입 (기초 작업)
1. ✅ Migration 파일 작성: `20250118_cafe_marketing_submissions.sql`
2. ✅ Supabase에서 Migration 실행
3. ✅ `types/database.ts`에 타입 추가

### Phase 2: API 구현 (백엔드)
4. ✅ `app/api/submissions/cafe/route.ts` (클라이언트 제출)
5. ✅ `app/api/submissions/cafe/[id]/route.ts` (클라이언트 상세/취소)
6. ✅ `app/api/admin/cafe-marketing/route.ts` (관리자 목록)
7. ✅ `app/api/admin/cafe-marketing/[id]/route.ts` (관리자 상세/상태 변경)
8. ✅ `app/api/admin/cafe-marketing/[id]/daily-records/route.ts` (일일 기록)

### Phase 3: 클라이언트 페이지 수정 (프론트엔드)
9. ✅ `app/dashboard/cafe/page.tsx` - API 연결
10. ✅ `app/dashboard/cafe/status/page.tsx` - API 연결

### Phase 4: 관리자 페이지 구현 (관리 기능)
11. ✅ `app/admin/cafe-marketing/page.tsx` - 목록 페이지
12. ✅ `app/admin/cafe-marketing/[id]/page.tsx` - 상세 관리 페이지

### Phase 5: 테스트 및 검증
13. ✅ 전체 플로우 테스트
14. ✅ 포인트 차감/환불 검증
15. ✅ 상태 변경 플로우 검증
16. ✅ 일일 기록 및 진행률 계산 검증

---

## 🔍 8. 블로그 배포와의 차이점

| 항목 | 블로그 배포 | 카페 마케팅 |
|------|-----------|-----------|
| **상태 단계** | 3단계 (확인중→구동중→완료) | 5단계 (확인중→접수완료→원고작성중→원고작업완료→구동중→완료) |
| **원고 관리** | 없음 | Google Sheets 링크 관리 |
| **선택 시스템** | 타입 선택 (영상/자동화/리뷰어) | 지역 → 카페 목록 선택 (중복 가능) |
| **일일 기록** | 일 배포 건수 기반 | 발행 건수 기반 |
| **최소 수량** | 최소 30건 (일 3건 × 10일) | 최소 수량 없음 |
| **배포 기간** | 구동일수 계산 필요 | 단순 발행 건수 |
| **사진 옵션** | 종류별 상이 | 사진 유무 (가격 1.3배) |

---

## ⚠️ 9. 주의사항 및 고려사항

### 9.1 데이터 무결성
- `cafe_list` 배열이 비어있지 않도록 검증
- `publish_count`는 항상 양수
- `script_url`은 `script_status='completed'`일 때만 필수

### 9.2 포인트 처리
- 제출 시 포인트 차감 + `point_transactions` 기록
- 취소 시 환불 + `point_transactions` 기록
- 트랜잭션 실패 시 롤백 처리

### 9.3 상태 전이 제한
- `pending` → `approved` → `script_writing` → `script_completed` → `in_progress` → `completed`
- 역방향 전이 제한 (단, `cancelled`는 언제든지 가능)

### 9.4 원고 완료 조건
- `script_status='completed'`로 변경 시 `script_url` 필수
- 클라이언트는 `script_completed` 상태일 때 링크 클릭 가능

### 9.5 진행률 계산
```typescript
const completedCount = dailyRecords.reduce((sum, r) => sum + r.completed_count, 0);
const progressPercentage = Math.round((completedCount / publish_count) * 100);
```

---

## 📚 10. 참고 파일 및 패턴

### 10.1 Database Schema
- `supabase/schema.sql` - `blog_distribution_submissions` 참고
- `supabase/migrations/20250117_daily_records_tables.sql` - 일일 기록 패턴

### 10.2 API Routes
- `app/api/admin/blog-distribution/route.ts` - 관리자 목록 조회 패턴
- `app/api/submissions/blog/route.ts` - 클라이언트 제출 패턴

### 10.3 Admin Pages
- `app/admin/blog-distribution/page.tsx` - 목록 페이지 UI 패턴
- `app/admin/blog-distribution/[id]/page.tsx` - 상세 페이지 패턴 (존재하지 않음, 신규 구현 필요)

### 10.4 Client Pages
- `app/dashboard/cafe/page.tsx` - 제출 폼 (API 연결만 필요)
- `app/dashboard/cafe/status/page.tsx` - 상태 페이지 (API 연결만 필요)

### 10.5 TypeScript Types
- `types/database.ts` - 기존 타입 참고

---

## ✅ 11. 체크리스트

### Database
- [ ] Migration 파일 작성
- [ ] Supabase에서 실행
- [ ] 테이블 생성 확인
- [ ] TypeScript 타입 추가

### API Routes
- [ ] 클라이언트 제출 API
- [ ] 클라이언트 상세/취소 API
- [ ] 관리자 목록 API
- [ ] 관리자 상세 API
- [ ] 관리자 일일 기록 API

### Client Pages
- [ ] 제출 폼 API 연결
- [ ] 상태 페이지 API 연결
- [ ] 취소 기능 구현

### Admin Pages
- [ ] 목록 페이지 구현
- [ ] 상세 페이지 구현
- [ ] 상태 변경 기능
- [ ] 원고 관리 기능
- [ ] 일일 기록 기능

### Testing
- [ ] 제출 플로우 테스트
- [ ] 포인트 차감 검증
- [ ] 상태 변경 검증
- [ ] 원고 URL 관리 검증
- [ ] 취소/환불 검증
- [ ] 일일 기록 및 진행률 검증

---

## 🎯 12. 최종 목표

**완료 조건**:
1. 클라이언트가 카페 침투 마케팅을 접수할 수 있다
2. 관리자가 접수 내역을 확인하고 관리할 수 있다
3. 관리자가 원고 상태 및 Google Sheets 링크를 관리할 수 있다
4. 관리자가 일일 진행 기록을 추가할 수 있다
5. 클라이언트가 진행 상황을 확인할 수 있다
6. 클라이언트가 원고작업완료 시 링크를 확인할 수 있다
7. 클라이언트가 취소 요청을 할 수 있다
8. 포인트 차감 및 환불이 정확하게 처리된다

**성공 지표**:
- 블로그 배포와 동일한 품질의 관리 시스템
- 직관적인 관리자 인터페이스
- 안정적인 포인트 처리
- 명확한 상태 흐름
