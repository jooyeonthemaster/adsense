# 커스텀 상품 기능 분석 및 비활성화 계획

**작성일**: 2025-11-02
**목적**: 커스텀 상품 추가 기능을 비활성화하고 4가지 고정 상품만 유지

---

## 📋 요약

### 클라이언트 요구사항 (4가지 고정 상품만)
1. **플레이스 유입 접수** (place_submissions)
2. **영수증 리뷰** (receipt_review_submissions)
3. **카카오맵 리뷰** (kakaomap_review_submissions)
4. **블로그 배포** (blog_distribution_submissions)

### 제거 대상 (커스텀 상품 관련)
- 관리자가 상품을 추가/수정/삭제하는 기능
- 동적 폼 렌더링 시스템
- product_categories 테이블 의존성
- dynamic_submissions 테이블

---

## 🗄️ 데이터베이스 구조 분석

### 관련 테이블

#### 1. `product_categories` (상품 정의 테이블)
```sql
컬럼:
- id: string (PK)
- name: string (상품명)
- slug: string (URL 경로용 코드, 예: 'place-traffic')
- description: string | null
- is_active: boolean
- form_schema: JSON | null (동적 폼 스키마)
- submission_table: string (제출 테이블 이름, 예: 'dynamic_submissions')
- created_at: timestamp
```

**현재 용도**:
- 관리자가 새 상품을 추가할 수 있는 동적 시스템
- `form_schema`를 통해 커스텀 폼 필드 정의
- `/dashboard/submit/[slug]` 라우팅에 사용

**문제점**:
- 고정 4가지 상품에는 불필요한 복잡성
- 각 상품은 이미 전용 테이블과 폼 컴포넌트가 있음

#### 2. `client_product_prices` (클라이언트별 단가 테이블)
```sql
컬럼:
- id: string (PK)
- client_id: string (FK → clients.id)
- category_id: string (FK → product_categories.id)
- price_per_unit: number
- is_visible: boolean
- created_at, updated_at: timestamp
```

**현재 용도**:
- 클라이언트별로 상품 접근 권한 및 단가 설정
- `/dashboard/submit` 페이지에서 보여줄 상품 목록 결정

**유지 필요성**:
- ✅ **유지 필요** - 클라이언트별 단가는 필수 기능
- 단, `category_id`가 `product_categories`를 참조하는 구조를 개선해야 함

#### 3. `dynamic_submissions` (동적 폼 제출 테이블)
```sql
컬럼:
- id: string (PK)
- client_id: string (FK → clients.id)
- category_id: string (FK → product_categories.id)
- form_data: JSON (동적 폼 데이터)
- total_points: number
- status: SubmissionStatus
- created_at, updated_at: timestamp
```

**현재 용도**:
- `product_categories`에서 정의한 커스텀 상품의 제출 데이터 저장
- 폼 스키마와 데이터가 JSON으로 저장됨

**문제점**:
- ❌ **제거 대상** - 커스텀 상품 기능을 사용하지 않으므로 불필요

#### 4. `custom_product_submissions` (존재하지 않음)
- Supabase에 테이블 리스트에서 확인되었으나 코드에서는 사용 안 함
- ❌ **완전 미사용 테이블** - 삭제 권장

---

## 📂 코드 파일 분석

### 관리자 상품 관리 (제거 대상)

#### 1. `app/admin/products/` 디렉토리 전체
```
app/admin/products/
├── page.tsx                      # 상품 관리 메인 페이지
├── products-management.tsx       # 상품 목록 테이블
├── create-product-dialog.tsx     # 상품 생성 다이얼로그
├── edit-product-dialog.tsx       # 상품 수정 다이얼로그
└── delete-product-dialog.tsx     # 상품 삭제 다이얼로그
```

**기능**:
- 관리자가 `product_categories` 테이블에 새 상품 추가/수정/삭제
- 폼 스키마 빌더로 커스텀 폼 필드 정의
- 상품 활성화/비활성화 관리

**제거 이유**:
- 클라이언트는 커스텀 상품 추가 기능을 원하지 않음
- 4가지 고정 상품만 사용

#### 2. `app/api/admin/products/route.ts`
```typescript
GET    /api/admin/products      # 상품 목록 조회
POST   /api/admin/products      # 상품 생성
PATCH  /api/admin/products      # 상품 수정
DELETE /api/admin/products?id=  # 상품 삭제
```

**제거 이유**:
- 관리자 상품 관리 UI가 제거되므로 API도 불필요

#### 3. `app/api/product-categories/route.ts`
```typescript
GET /api/product-categories  # 활성 상품 목록 조회 (클라이언트용)
```

**용도**:
- `/dashboard/submit` 페이지에서 사용 가능한 상품 목록 표시
- `product_categories` 테이블에서 조회

**제거 이유**:
- 고정 상품만 사용하므로 DB 조회 대신 하드코딩 가능

---

### 동적 제출 시스템 (제거 대상)

#### 4. `app/dashboard/submit/[slug]/page.tsx`
```typescript
// 동적 라우팅: /dashboard/submit/place-traffic, /dashboard/submit/custom-product 등
```

**현재 로직**:
1. URL slug로 `product_categories` 테이블 조회
2. `form_schema`가 있으면 `DynamicFormRenderer` 사용
3. 없으면 하드코딩된 `PRODUCT_CONFIG`에서 매칭되는 폼 컴포넌트 렌더링

**문제점**:
- 고정 4가지 상품 + 동적 커스텀 상품을 모두 지원하려다 보니 복잡함
- `PRODUCT_CONFIG` 객체와 `product_categories` 테이블이 중복 관리됨

**개선 방향**:
- 동적 slug 라우팅 제거
- 각 상품별 고정 경로 사용: `/dashboard/submit/place`, `/dashboard/submit/receipt` 등

#### 5. `components/dynamic-form-renderer.tsx` (439줄)
```typescript
// 동적 폼 스키마 기반 폼 렌더링
// 필드 타입: text, number, email, url, textarea, select, checkbox, date
// 포인트 계산식 평가 (Function constructor 사용)
```

**제거 이유**:
- 각 고정 상품은 이미 전용 폼 컴포넌트가 있음
  - `PlaceSubmissionForm`
  - `ReceiptSubmissionForm`
  - `KakaomapSubmissionForm`
  - `BlogSubmissionForm`

#### 6. `app/api/submissions/dynamic/route.ts`
```typescript
POST /api/submissions/dynamic
- dynamic_submissions 테이블에 저장
- 포인트 차감 및 트랜잭션 기록
```

**제거 이유**:
- `dynamic_submissions` 테이블 자체를 사용하지 않음

---

### 클라이언트 대시보드 (부분 수정 필요)

#### 7. `app/dashboard/submit/page.tsx`
```typescript
// 현재: product_categories + client_product_prices JOIN 쿼리
const { data: products } = await supabase
  .from('client_product_prices')
  .select('*, product_categories(*)')
  .eq('client_id', clientId)
  .eq('is_visible', true)
```

**문제점**:
- `product_categories` 테이블 의존

**개선 방향**:
- 고정 상품 목록을 하드코딩
- 단, 클라이언트별 단가는 여전히 `client_product_prices`에서 조회 필요

---

### 분석/통계 시스템 (부분 수정 필요)

#### 8. `lib/analytics.ts` (607줄)
```typescript
// dynamic_submissions 관련 쿼리 6곳 발견
- Line 50, 109: 상품별 접수 통계
- Line 209: 상세 카테고리 정보
- Line 295, 426: 시계열 데이터
- Line 501, 539: 일반 통계
```

**수정 방향**:
- `dynamic_submissions` 쿼리 전부 제거
- 4가지 고정 테이블만 집계

#### 9. `lib/trend-analytics.ts`
```typescript
// dynamic_submissions 사용 여부 확인 필요
```

#### 10. `app/admin/submissions/admin-submissions-table.tsx`
```typescript
// 제출물 목록 테이블 - dynamic_submissions 포함 여부 확인
```

#### 11. `app/dashboard/submissions/submissions-table.tsx`
```typescript
// 클라이언트 제출 목록 - dynamic_submissions 포함 여부 확인
```

---

## 🛠️ 제거/수정 작업 계획

### Phase 1: 관리자 상품 관리 비활성화
- [ ] `app/admin/products/` 디렉토리 전체 주석 처리
- [ ] `app/api/admin/products/route.ts` 주석 처리
- [ ] 관리자 내비게이션에서 "상품 관리" 메뉴 제거

### Phase 2: 동적 제출 시스템 비활성화
- [ ] `app/api/submissions/dynamic/route.ts` 주석 처리
- [ ] `app/api/product-categories/route.ts` 주석 처리
- [ ] `components/dynamic-form-renderer.tsx` 주석 처리

### Phase 3: 클라이언트 대시보드 수정
- [ ] `app/dashboard/submit/[slug]/page.tsx` → 동적 라우팅 제거
- [ ] 각 상품별 고정 경로로 변경:
  - `/dashboard/submit/place` (기존 컴포넌트 재사용)
  - `/dashboard/submit/receipt`
  - `/dashboard/submit/kakaomap`
  - `/dashboard/submit/blog`
- [ ] `app/dashboard/submit/page.tsx` 수정:
  - `product_categories` 쿼리 제거
  - 고정 상품 목록 하드코딩
  - 단가는 `client_product_prices`에서 조회 (category_slug 기반)

### Phase 4: 분석/통계 시스템 정리
- [ ] `lib/analytics.ts` - `dynamic_submissions` 쿼리 6곳 제거
- [ ] `lib/trend-analytics.ts` - 확인 후 수정
- [ ] 제출물 테이블 컴포넌트들 - `dynamic_submissions` 제거

### Phase 5: 클라이언트 단가 시스템 개선
**현재 구조**:
```
client_product_prices.category_id → product_categories.id
```

**개선 방향** (2가지 옵션):

**Option A: 테이블 구조 유지, 고정 데이터 사용**
- `product_categories` 테이블에 4가지 고정 상품만 남기고 모두 삭제
- 관리자 UI만 제거하고 테이블 자체는 유지
- 장점: 최소한의 코드 수정
- 단점: 불필요한 테이블 유지

**Option B: 테이블 구조 단순화**
```sql
-- client_product_prices 테이블 수정
ALTER TABLE client_product_prices
ADD COLUMN product_type VARCHAR(50);  -- 'place', 'receipt', 'kakaomap', 'blog'

-- category_id 컬럼은 deprecate (나중에 삭제)
```
- 장점: 더 단순한 구조
- 단점: 데이터 마이그레이션 필요

**권장**: Option A (최소 변경)

---

## 📊 영향 범위 분석

### 직접 영향 (수정 필수)
1. ✅ 관리자 상품 관리 UI (완전 제거)
2. ✅ 동적 제출 API (완전 제거)
3. ✅ 동적 폼 렌더러 (완전 제거)
4. ⚠️ 클라이언트 상품 목록 조회 (수정)
5. ⚠️ 분석/통계 쿼리 (dynamic_submissions 제거)

### 간접 영향 (확인 필요)
1. ❓ 클라이언트 단가 설정 UI (`app/admin/clients/[id]/pricing/`)
   - `product_categories` 참조하는지 확인
2. ❓ 리포트 다운로드 기능
   - 상품 타입 구분 로직 확인

### 영향 없음 (유지)
1. ✅ 4가지 고정 상품 제출 폼
2. ✅ 포인트 시스템
3. ✅ AS 요청 시스템
4. ✅ 관리자 제출물 승인/거부

---

## 🔍 추가 확인 사항

### 데이터베이스 제약조건
```sql
-- 확인 필요: client_product_prices의 외래키
-- ON DELETE CASCADE 설정 여부 확인
-- product_categories 삭제 시 client_product_prices도 삭제되는지?
```

### 기존 데이터 처리
- `dynamic_submissions` 테이블에 기존 데이터가 있는가?
  - 있으면: 마이그레이션 또는 아카이빙 필요
  - 없으면: 바로 삭제 가능

---

## 📝 작업 체크리스트

### 코드 주석 처리 (삭제 안 함!)
- [ ] `app/admin/products/**/*` 전체 주석
- [ ] `app/api/admin/products/route.ts` 주석
- [ ] `app/api/submissions/dynamic/route.ts` 주석
- [ ] `app/api/product-categories/route.ts` 주석
- [ ] `components/dynamic-form-renderer.tsx` 주석
- [ ] `types/form-schema.ts` 주석 (동적 폼 스키마 타입 정의)

### 코드 수정
- [ ] `app/dashboard/submit/page.tsx` - 하드코딩된 상품 목록
- [ ] `app/dashboard/submit/[slug]/page.tsx` - 동적 라우팅 제거 or 4개만 허용
- [ ] `lib/analytics.ts` - dynamic_submissions 쿼리 6곳 제거
- [ ] `lib/trend-analytics.ts` - 확인 후 수정
- [ ] 제출물 테이블 컴포넌트들 - dynamic_submissions 제거

### 네비게이션 수정
- [ ] 관리자 네비게이션에서 "상품 관리" 메뉴 제거

### 테스트
- [ ] 클라이언트 로그인 → 상품 목록 확인
- [ ] 각 상품 제출 폼 작동 확인
- [ ] 관리자 분석 대시보드 확인 (에러 없는지)
- [ ] 제출물 목록 조회 정상 작동 확인

### 문서 작업
- [ ] CHANGELOG.md에 상세 기록
- [ ] README 업데이트 (4가지 상품만 명시)

---

## 💡 개선 권장사항

### 장기 계획
1. **`product_categories` 테이블 제거**
   - 4가지 고정 상품만 사용하므로 테이블 자체가 불필요
   - `client_product_prices` 테이블을 단순화

2. **클라이언트 단가 설정 간소화**
   - Enum 타입으로 상품 구분: `'place' | 'receipt' | 'kakaomap' | 'blog'`
   - 더 명확하고 타입 안전

3. **코드 정리**
   - 주석 처리된 코드는 1개월 후 완전 삭제
   - Git 히스토리에 남아있으므로 필요시 복구 가능

---

## 🚨 주의사항

### 절대 하지 말아야 할 것
1. ❌ **즉시 삭제하지 말 것** - 모든 코드는 주석 처리만
2. ❌ **DB 테이블 삭제하지 말 것** - 우선 비활성화만
3. ❌ **기존 제출 데이터 손실 주의** - dynamic_submissions에 데이터 있는지 확인

### 안전한 작업 순서
1. ✅ Git 브랜치 생성: `feature/remove-custom-products`
2. ✅ 코드 주석 처리 (삭제 X)
3. ✅ 테스트 후 커밋
4. ✅ CHANGELOG 기록
5. ✅ 1주일 운영 후 문제 없으면 주석 코드 삭제
6. ✅ DB 테이블은 1개월 후 삭제 검토

---

## 📌 결론

커스텀 상품 기능은 개발 과정에서 추가되었으나, 클라이언트의 실제 요구사항은 **4가지 고정 상품만 사용**하는 것입니다.

**비활성화 효과**:
- ✅ 코드 복잡도 감소
- ✅ 유지보수 부담 감소
- ✅ 버그 발생 가능성 감소
- ✅ 명확한 비즈니스 로직

**작업 원칙**:
- 주석 처리만 하고 삭제하지 않음
- 충분한 테스트 후 단계적 제거
- 모든 변경사항 CHANGELOG에 기록
