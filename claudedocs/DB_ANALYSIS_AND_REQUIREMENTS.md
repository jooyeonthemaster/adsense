# 데이터베이스 완전 분석 및 고급 기능 요구사항 정의

**작성일**: 2025-11-01
**분석 범위**: 전체 DB 스키마, 테이블 관계, 데이터 흐름, 통계 요구사항
**목적**: 엑셀 리포트, 고급 필터링, 분석 대시보드, 실시간 알림 구현을 위한 설계

---

## 1. 데이터베이스 구조 완전 분석

### 1.1 테이블 목록 및 관계도

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA (11 Tables)                  │
└─────────────────────────────────────────────────────────────────┘

[1] clients (거래처)
    ├── id (UUID, PK)
    ├── username (VARCHAR(50), UNIQUE)
    ├── password (TEXT, bcrypt)
    ├── company_name (VARCHAR(200))
    ├── contact_person (VARCHAR(100))
    ├── phone (VARCHAR(20))
    ├── email (VARCHAR(100))
    ├── points (INTEGER) ⭐ 핵심 지표
    ├── is_active (BOOLEAN)
    ├── created_at (TIMESTAMP)
    └── updated_at (TIMESTAMP)

[2] admins (관리자)
    ├── id (UUID, PK)
    ├── username (VARCHAR(50), UNIQUE)
    ├── password (TEXT, bcrypt)
    ├── name (VARCHAR(100))
    ├── email (VARCHAR(100))
    ├── is_super_admin (BOOLEAN)
    ├── created_at (TIMESTAMP)
    └── updated_at (TIMESTAMP)

[3] product_categories (상품 카테고리)
    ├── id (UUID, PK)
    ├── name (VARCHAR(100))
    ├── slug (VARCHAR(100), UNIQUE)
    ├── description (TEXT)
    ├── is_active (BOOLEAN)
    └── created_at (TIMESTAMP)

[4] client_product_prices (거래처별 가격)
    ├── id (UUID, PK)
    ├── client_id (UUID, FK → clients.id) ⭐
    ├── category_id (UUID, FK → product_categories.id) ⭐
    ├── price_per_unit (INTEGER) ⭐ 가격 지표
    ├── is_visible (BOOLEAN)
    ├── created_at (TIMESTAMP)
    ├── updated_at (TIMESTAMP)
    └── UNIQUE(client_id, category_id)

[5] place_submissions (플레이스 유입 접수)
    ├── id (UUID, PK)
    ├── client_id (UUID, FK → clients.id) ⭐
    ├── company_name (VARCHAR(200))
    ├── place_url (TEXT)
    ├── daily_count (INTEGER, >= 100)
    ├── total_days (INTEGER, 3~7)
    ├── total_points (INTEGER) ⭐ 비용 지표
    ├── status (VARCHAR(20)) ⭐ 상태 지표
    ├── start_date (DATE)
    ├── notes (TEXT)
    ├── created_at (TIMESTAMP) ⭐
    └── updated_at (TIMESTAMP)

[6] receipt_review_submissions (영수증 리뷰 접수)
    ├── id (UUID, PK)
    ├── client_id (UUID, FK → clients.id) ⭐
    ├── company_name (VARCHAR(200))
    ├── place_url (TEXT)
    ├── daily_count (INTEGER)
    ├── total_count (INTEGER, >= 30)
    ├── has_photo (BOOLEAN) ⭐
    ├── has_script (BOOLEAN) ⭐
    ├── guide_text (TEXT)
    ├── business_license_url (TEXT)
    ├── sample_receipt_url (TEXT)
    ├── photo_urls (TEXT[])
    ├── total_points (INTEGER) ⭐
    ├── status (VARCHAR(20)) ⭐
    ├── start_date (DATE)
    ├── notes (TEXT)
    ├── created_at (TIMESTAMP) ⭐
    └── updated_at (TIMESTAMP)

[7] kakaomap_review_submissions (카카오맵 리뷰 접수)
    ├── id (UUID, PK)
    ├── client_id (UUID, FK → clients.id) ⭐
    ├── company_name (VARCHAR(200))
    ├── kakaomap_url (TEXT)
    ├── daily_count (INTEGER)
    ├── total_count (INTEGER, >= 10)
    ├── has_photo (BOOLEAN) ⭐
    ├── text_review_count (INTEGER) ⭐
    ├── photo_review_count (INTEGER) ⭐
    ├── photo_urls (TEXT[])
    ├── script_urls (TEXT[])
    ├── total_points (INTEGER) ⭐
    ├── status (VARCHAR(20)) ⭐
    ├── script_confirmed (BOOLEAN)
    ├── start_date (DATE)
    ├── notes (TEXT)
    ├── created_at (TIMESTAMP) ⭐
    └── updated_at (TIMESTAMP)

[8] blog_distribution_submissions (블로그 배포 접수)
    ├── id (UUID, PK)
    ├── client_id (UUID, FK → clients.id) ⭐
    ├── distribution_type (VARCHAR(50)) ⭐ reviewer/video/automation
    ├── content_type (VARCHAR(20)) ⭐ review/info
    ├── company_name (VARCHAR(200))
    ├── place_url (TEXT)
    ├── daily_count (INTEGER, <= 3)
    ├── total_count (INTEGER, <= 30)
    ├── keywords (TEXT[])
    ├── guide_text (TEXT)
    ├── photo_urls (TEXT[])
    ├── script_urls (TEXT[])
    ├── account_id (VARCHAR(100))
    ├── charge_count (INTEGER)
    ├── total_points (INTEGER) ⭐
    ├── status (VARCHAR(20)) ⭐
    ├── start_date (DATE)
    ├── notes (TEXT)
    ├── created_at (TIMESTAMP) ⭐
    └── updated_at (TIMESTAMP)

[9] point_transactions (포인트 거래 내역)
    ├── id (UUID, PK)
    ├── client_id (UUID, FK → clients.id) ⭐
    ├── transaction_type (VARCHAR(20)) ⭐ charge/deduct/refund
    ├── amount (INTEGER) ⭐ 거래 금액
    ├── balance_after (INTEGER) ⭐ 잔액
    ├── reference_type (VARCHAR(50)) ⭐ submission type
    ├── reference_id (UUID) ⭐ submission id
    ├── description (TEXT)
    ├── created_by (UUID, FK → admins.id)
    └── created_at (TIMESTAMP) ⭐

[10] reports (리포트 파일)
    ├── id (UUID, PK)
    ├── submission_type (VARCHAR(50))
    ├── submission_id (UUID)
    ├── file_url (TEXT)
    ├── file_name (VARCHAR(255))
    ├── uploaded_by (UUID, FK → admins.id)
    └── uploaded_at (TIMESTAMP)

[11] as_requests (AS 신청)
    ├── id (UUID, PK)
    ├── client_id (UUID, FK → clients.id) ⭐
    ├── submission_type (VARCHAR(50)) ⭐
    ├── submission_id (UUID) ⭐
    ├── missing_rate (DECIMAL(5,2), >= 20) ⭐ 부족률
    ├── description (TEXT)
    ├── status (VARCHAR(20)) ⭐ pending/in_progress/resolved/rejected
    ├── resolved_at (TIMESTAMP)
    ├── resolved_by (UUID, FK → admins.id)
    ├── resolution_notes (TEXT)
    ├── created_at (TIMESTAMP) ⭐
    └── updated_at (TIMESTAMP)
```

### 1.2 테이블 관계 맵핑 (ERD)

```
                        ┌─────────────┐
                        │   admins    │
                        └──────┬──────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
                    ▼                      ▼
            ┌──────────────┐      ┌──────────────┐
            │   reports    │      │as_requests   │
            │              │      │              │
            │uploaded_by FK│      │resolved_by FK│
            └──────────────┘      └──────┬───────┘
                                         │
                                         │ client_id FK
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 │
                ┌───────────────┐                         │
                │    clients    │◄────────────────────────┘
                └───────┬───────┘
                        │
        ┌───────────────┼───────────────────────────────┐
        │               │                               │
        ▼               ▼                               ▼
┌──────────────┐  ┌────────────────────┐   ┌──────────────────────┐
│client_product│  │point_transactions  │   │     SUBMISSIONS      │
│   _prices    │  │                    │   │                      │
│              │  │  client_id FK      │   │  • place_submissions │
│  client_id FK│  │  created_by FK     │   │  • receipt_review    │
│ category_id FK  │  reference_id      │   │  • kakaomap_review   │
└──────┬───────┘  │  reference_type    │   │  • blog_distribution │
       │          └────────────────────┘   │                      │
       │                                   │    client_id FK      │
       ▼                                   └──────────────────────┘
┌─────────────────┐
│product_categories│
└─────────────────┘
```

### 1.3 데이터 흐름 분석

#### 🔄 접수 프로세스 흐름
```
1. 거래처 로그인 (clients 테이블 조회)
   ↓
2. 상품 선택 (product_categories 조회)
   ↓
3. 가격 확인 (client_product_prices 조회)
   ↓
4. 접수 폼 작성 (상품별 필드)
   ↓
5. 포인트 계산 (total_points = daily_count × total_days × price_per_unit)
   ↓
6. 포인트 충분 여부 확인 (clients.points >= total_points)
   ↓
7. Submission 생성 (place/receipt/kakaomap/blog_submissions)
   ↓
8. 포인트 차감 Transaction (point_transactions INSERT, clients.points UPDATE)
   ↓
9. 접수 완료
```

#### 💰 포인트 거래 흐름
```
charge (충전):
  Admin → client_product_prices → clients.points += amount
  point_transactions INSERT (type: charge, created_by: admin_id)

deduct (차감):
  Submission → clients.points -= total_points
  point_transactions INSERT (type: deduct, reference_id: submission_id)

refund (환불):
  AS Request Resolved → clients.points += amount
  point_transactions INSERT (type: refund, reference_id: as_request_id)
```

#### 📊 상태 변경 흐름
```
Submission Status:
  pending → approved → completed
         ↘ cancelled

AS Request Status:
  pending → in_progress → resolved
         ↘ rejected
```

---

## 2. 통계 및 분석 요구사항 정의

### 2.1 전체 대시보드 통계 지표 (관리자용)

#### 📈 **메인 KPI (Key Performance Indicators)**

| 지표명 | 계산 방식 | 데이터 소스 | 실시간성 |
|-------|----------|-----------|---------|
| 총 거래처 수 | `COUNT(*)` | `clients WHERE is_active = true` | 실시간 |
| 활성 거래처 수 | `COUNT(*)` | `clients WHERE is_active = true AND points > 0` | 실시간 |
| 총 접수 건수 | `SUM(all submissions)` | 4개 submission 테이블 | 실시간 |
| 대기 중 접수 | `COUNT(*)` | `submissions WHERE status = 'pending'` | 실시간 |
| 진행 중 접수 | `COUNT(*)` | `submissions WHERE status = 'approved'` | 실시간 |
| 완료된 접수 | `COUNT(*)` | `submissions WHERE status = 'completed'` | 실시간 |
| 취소된 접수 | `COUNT(*)` | `submissions WHERE status = 'cancelled'` | 실시간 |
| 총 포인트 발행 | `SUM(points)` | `clients` | 실시간 |
| 총 포인트 사용 | `SUM(amount)` | `point_transactions WHERE type = 'deduct'` | 실시간 |
| 총 포인트 잔액 | `발행 - 사용` | 계산 값 | 실시간 |
| AS 대기 건수 | `COUNT(*)` | `as_requests WHERE status = 'pending'` | 실시간 |

#### 📊 **상품별 통계**

| 지표명 | 계산 방식 | 그룹핑 |
|-------|----------|--------|
| 상품별 접수 건수 | `COUNT(*) GROUP BY type` | place/receipt/kakaomap/blog |
| 상품별 총 포인트 | `SUM(total_points) GROUP BY type` | 상품 타입 |
| 상품별 평균 포인트 | `AVG(total_points) GROUP BY type` | 상품 타입 |
| 상품별 완료율 | `(completed / total) × 100` | 상품 타입 |

#### 📅 **기간별 통계**

| 지표명 | 계산 방식 | 시간 범위 |
|-------|----------|----------|
| 일별 접수 건수 | `COUNT(*) GROUP BY DATE(created_at)` | 최근 30일 |
| 주별 접수 건수 | `COUNT(*) GROUP BY WEEK(created_at)` | 최근 12주 |
| 월별 접수 건수 | `COUNT(*) GROUP BY MONTH(created_at)` | 최근 12개월 |
| 일별 포인트 사용량 | `SUM(total_points) GROUP BY DATE` | 최근 30일 |
| 월별 매출 추이 | `SUM(total_points) GROUP BY MONTH` | 최근 12개월 |

#### 🏆 **거래처 랭킹**

| 지표명 | 정렬 기준 | 제한 |
|-------|----------|------|
| 접수 건수 TOP 10 | `COUNT(*) DESC` | LIMIT 10 |
| 포인트 사용 TOP 10 | `SUM(total_points) DESC` | LIMIT 10 |
| 활성도 TOP 10 | `최근 30일 접수 건수 DESC` | LIMIT 10 |

### 2.2 거래처 대시보드 통계 지표

| 지표명 | 계산 방식 | 데이터 소스 |
|-------|----------|-----------|
| 내 포인트 잔액 | `clients.points` | clients (WHERE id = current_user) |
| 총 접수 건수 | `COUNT(*)` | 모든 submissions (WHERE client_id = current_user) |
| 완료된 접수 | `COUNT(*)` | submissions (status = 'completed') |
| 진행 중 접수 | `COUNT(*)` | submissions (status IN ('pending', 'approved')) |
| 총 사용 포인트 | `SUM(amount)` | point_transactions (type = 'deduct') |
| 상품별 이용 현황 | `COUNT(*) GROUP BY type` | 모든 submissions |
| 최근 거래 내역 | `LIMIT 10` | point_transactions (ORDER BY created_at DESC) |

### 2.3 상세 분석 지표

#### 💡 **인사이트 지표**

```sql
-- 1. 평균 처리 시간 (접수 → 완료)
SELECT
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_days
FROM submissions
WHERE status = 'completed'

-- 2. 상품별 전환율 (완료율)
SELECT
  type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  (SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::FLOAT / COUNT(*)) * 100 as completion_rate
FROM all_submissions
GROUP BY type

-- 3. 거래처별 ROI (Return on Points Invested)
SELECT
  client_id,
  SUM(total_points) as total_invested,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  (COUNT(CASE WHEN status = 'completed' THEN 1 END)::FLOAT / COUNT(*)) * 100 as success_rate
FROM all_submissions
GROUP BY client_id

-- 4. 시간대별 접수 패턴
SELECT
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as submission_count
FROM all_submissions
GROUP BY hour
ORDER BY hour

-- 5. AS 발생률
SELECT
  (COUNT(DISTINCT as_requests.submission_id)::FLOAT / COUNT(DISTINCT submissions.id)) * 100 as as_rate
FROM submissions
LEFT JOIN as_requests ON submissions.id = as_requests.submission_id

-- 6. 포인트 회전율 (Turnover Rate)
SELECT
  client_id,
  SUM(CASE WHEN transaction_type = 'charge' THEN amount ELSE 0 END) as total_charged,
  SUM(CASE WHEN transaction_type = 'deduct' THEN amount ELSE 0 END) as total_used,
  (SUM(CASE WHEN transaction_type = 'deduct' THEN amount ELSE 0 END)::FLOAT /
   NULLIF(SUM(CASE WHEN transaction_type = 'charge' THEN amount ELSE 0 END), 0)) * 100 as turnover_rate
FROM point_transactions
GROUP BY client_id
```

---

## 3. 고급 필터링 시스템 설계

### 3.1 필터 유형 및 조건

#### 🔍 **다차원 필터링 매트릭스**

| 필터 카테고리 | 필터 타입 | 적용 테이블 | UI 컴포넌트 |
|-------------|----------|-----------|-----------|
| **날짜 범위** | created_at BETWEEN | 모든 submissions | DateRangePicker |
| **상태** | status IN (...) | submissions | MultiSelect |
| **거래처** | client_id IN (...) | submissions | Autocomplete |
| **상품 타입** | type IN (...) | submissions | CheckboxGroup |
| **포인트 범위** | total_points BETWEEN | submissions | RangeSlider |
| **거래 유형** | transaction_type IN | point_transactions | Select |
| **AS 상태** | as_status IN | as_requests | Select |

#### 📋 **필터 조합 로직**

```typescript
interface FilterOptions {
  // 날짜 필터
  dateRange?: {
    start: Date;
    end: Date;
    field: 'created_at' | 'updated_at' | 'start_date';
  };

  // 상태 필터
  status?: ('pending' | 'approved' | 'completed' | 'cancelled')[];

  // 거래처 필터
  clientIds?: string[];

  // 상품 타입 필터
  submissionTypes?: ('place' | 'receipt' | 'kakaomap' | 'blog')[];

  // 포인트 범위 필터
  pointRange?: {
    min: number;
    max: number;
  };

  // 정렬
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };

  // 페이지네이션
  pagination?: {
    page: number;
    limit: number;
  };

  // 검색 (full-text search)
  search?: {
    query: string;
    fields: string[];
  };
}
```

### 3.2 필터 API 쿼리 빌더

```typescript
function buildFilterQuery(filters: FilterOptions) {
  let query = supabase.from('submissions').select('*');

  // 날짜 범위
  if (filters.dateRange) {
    query = query
      .gte(filters.dateRange.field, filters.dateRange.start.toISOString())
      .lte(filters.dateRange.field, filters.dateRange.end.toISOString());
  }

  // 상태
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  // 거래처
  if (filters.clientIds && filters.clientIds.length > 0) {
    query = query.in('client_id', filters.clientIds);
  }

  // 포인트 범위
  if (filters.pointRange) {
    query = query
      .gte('total_points', filters.pointRange.min)
      .lte('total_points', filters.pointRange.max);
  }

  // 정렬
  if (filters.orderBy) {
    query = query.order(filters.orderBy.field, {
      ascending: filters.orderBy.direction === 'asc'
    });
  }

  // 페이지네이션
  if (filters.pagination) {
    const { page, limit } = filters.pagination;
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);
  }

  return query;
}
```

---

## 4. 엑셀 리포트 스키마 설계

### 4.1 리포트 타입별 컬럼 정의

#### 📊 **전체 접수 내역 리포트**

| 컬럼명 | 데이터 타입 | 소스 | 설명 |
|-------|-----------|------|-----|
| 접수번호 | TEXT | id | UUID |
| 거래처명 | TEXT | clients.company_name | JOIN |
| 상품타입 | TEXT | type | place/receipt/kakaomap/blog |
| 회사명 | TEXT | company_name | 접수 업체명 |
| URL | TEXT | place_url / kakaomap_url | 대상 URL |
| 일일건수 | NUMBER | daily_count | |
| 총건수/일수 | NUMBER | total_count / total_days | |
| 총포인트 | NUMBER | total_points | |
| 상태 | TEXT | status | 대기/승인/완료/취소 |
| 시작일 | DATE | start_date | |
| 접수일 | DATETIME | created_at | |
| 수정일 | DATETIME | updated_at | |
| 비고 | TEXT | notes | |

#### 💰 **포인트 거래 내역 리포트**

| 컬럼명 | 데이터 타입 | 소스 | 설명 |
|-------|-----------|------|-----|
| 거래번호 | TEXT | id | UUID |
| 거래처명 | TEXT | clients.company_name | JOIN |
| 거래유형 | TEXT | transaction_type | 충전/차감/환불 |
| 거래금액 | NUMBER | amount | |
| 거래후잔액 | NUMBER | balance_after | |
| 관련타입 | TEXT | reference_type | submission type |
| 관련번호 | TEXT | reference_id | submission id |
| 설명 | TEXT | description | |
| 처리자 | TEXT | admins.name | JOIN (created_by) |
| 거래일시 | DATETIME | created_at | |

#### 🏢 **거래처 마스터 리포트**

| 컬럼명 | 데이터 타입 | 소스 | 계산/조회 |
|-------|-----------|------|---------|
| 거래처ID | TEXT | id | |
| 아이디 | TEXT | username | |
| 회사명 | TEXT | company_name | |
| 담당자 | TEXT | contact_person | |
| 연락처 | TEXT | phone | |
| 이메일 | TEXT | email | |
| 포인트잔액 | NUMBER | points | |
| 활성여부 | TEXT | is_active | Y/N |
| 총접수건수 | NUMBER | - | COUNT(submissions) |
| 완료건수 | NUMBER | - | COUNT WHERE status = 'completed' |
| 총사용포인트 | NUMBER | - | SUM(point_transactions.amount) |
| 가입일 | DATETIME | created_at | |

#### 🆘 **AS 신청 내역 리포트**

| 컬럼명 | 데이터 타입 | 소스 | 설명 |
|-------|-----------|------|-----|
| AS번호 | TEXT | id | |
| 거래처명 | TEXT | clients.company_name | JOIN |
| 접수타입 | TEXT | submission_type | |
| 접수번호 | TEXT | submission_id | |
| 부족률 | NUMBER | missing_rate | % |
| 상세내용 | TEXT | description | |
| 상태 | TEXT | status | 대기/진행/해결/거부 |
| 처리자 | TEXT | admins.name | JOIN |
| 해결일시 | DATETIME | resolved_at | |
| 해결내용 | TEXT | resolution_notes | |
| 신청일시 | DATETIME | created_at | |

### 4.2 엑셀 리포트 생성 로직

```typescript
import * as XLSX from 'xlsx';

interface ExcelReportOptions {
  reportType: 'submissions' | 'transactions' | 'clients' | 'as_requests';
  filters?: FilterOptions;
  includeCharts?: boolean;
  includeStatistics?: boolean;
}

async function generateExcelReport(options: ExcelReportOptions) {
  // 1. 데이터 조회
  const data = await fetchReportData(options.reportType, options.filters);

  // 2. 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 3. 메인 데이터 시트
  const mainSheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, mainSheet, '데이터');

  // 4. 통계 시트 (옵션)
  if (options.includeStatistics) {
    const stats = calculateStatistics(data);
    const statsSheet = XLSX.utils.json_to_sheet(stats);
    XLSX.utils.book_append_sheet(workbook, statsSheet, '통계');
  }

  // 5. 파일 생성
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return buffer;
}
```

---

## 5. 실시간 알림 시스템 설계

### 5.1 알림 이벤트 정의

| 이벤트 타입 | 트리거 | 대상 | 알림 내용 |
|-----------|-------|------|---------|
| `submission_created` | 새 접수 생성 | 관리자 | "새로운 접수가 등록되었습니다" |
| `submission_status_changed` | 상태 변경 | 거래처 | "접수 상태가 변경되었습니다" |
| `points_charged` | 포인트 충전 | 거래처 | "포인트가 충전되었습니다" |
| `points_low` | 포인트 부족 (< 1000) | 거래처 | "포인트 잔액이 부족합니다" |
| `as_request_created` | AS 신청 | 관리자 | "새로운 AS 신청이 접수되었습니다" |
| `as_request_resolved` | AS 처리 완료 | 거래처 | "AS 신청이 처리되었습니다" |

### 5.2 알림 시스템 아키텍처

```typescript
// Supabase Realtime을 활용한 실시간 알림
interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  recipient_id: string;
  recipient_role: 'admin' | 'client';
  created_at: string;
  read: boolean;
}

// 1. DB 트리거 생성 (PostgreSQL Function)
CREATE OR REPLACE FUNCTION notify_submission_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (type, title, message, data, recipient_role)
  VALUES (
    'submission_created',
    '새로운 접수',
    NEW.company_name || '의 접수가 등록되었습니다',
    json_build_object('submission_id', NEW.id, 'type', TG_TABLE_NAME),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submission_created_trigger
AFTER INSERT ON place_submissions
FOR EACH ROW EXECUTE FUNCTION notify_submission_created();

// 2. 클라이언트 구독
const supabase = createClient();

supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${userId}`
    },
    (payload) => {
      // 알림 표시
      showNotification(payload.new);
    }
  )
  .subscribe();
```

### 5.3 알림 테이블 스키마

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  recipient_id UUID, -- NULL이면 전체 관리자/거래처
  recipient_role VARCHAR(20) NOT NULL, -- admin or client
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

## 6. 분석 대시보드 차트 구성

### 6.1 차트 유형 및 데이터 소스

| 차트 ID | 차트 유형 | 제목 | 데이터 소스 | X축 | Y축 |
|--------|----------|------|-----------|-----|-----|
| chart_1 | Line Chart | 일별 접수 추이 | submissions | created_at (날짜) | COUNT(*) |
| chart_2 | Bar Chart | 상품별 접수 현황 | submissions | type | COUNT(*) |
| chart_3 | Pie Chart | 접수 상태 분포 | submissions | status | COUNT(*) |
| chart_4 | Area Chart | 월별 포인트 사용량 | point_transactions | created_at (월) | SUM(amount) |
| chart_5 | Bar Chart | 거래처별 이용 현황 (TOP 10) | submissions + clients | company_name | COUNT(*) |
| chart_6 | Line Chart | 포인트 충전/사용 추이 | point_transactions | created_at | SUM(amount) GROUP BY type |
| chart_7 | Donut Chart | 상품별 매출 비중 | submissions | type | SUM(total_points) |
| chart_8 | Heatmap | 시간대별 접수 패턴 | submissions | HOUR(created_at) | COUNT(*) |

### 6.2 대시보드 레이아웃

```
┌────────────────────────────────────────────────────────────┐
│                    분석 대시보드                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │총 접수  │  │대기 중  │  │완료    │  │포인트   │      │
│  │ 1,234건 │  │  45건   │  │ 890건  │  │ 5.2M P  │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
│  ┌──────────────────────┐  ┌─────────────────────────┐   │
│  │  📈 일별 접수 추이    │  │  📊 상품별 접수 현황    │   │
│  │  (Line Chart)       │  │  (Bar Chart)            │   │
│  │                      │  │                         │   │
│  └──────────────────────┘  └─────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌─────────────────────────┐   │
│  │  🥧 접수 상태 분포    │  │  💰 포인트 사용 추이    │   │
│  │  (Pie Chart)        │  │  (Area Chart)           │   │
│  │                      │  │                         │   │
│  └──────────────────────┘  └─────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  🏆 거래처별 이용 현황 TOP 10                        │  │
│  │  (Bar Chart - Horizontal)                           │  │
│  │                                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 7. 구현 우선순위 및 일정

### Phase 1: 고급 필터링 (2일)
- [ ] 필터 컴포넌트 구현 (DateRangePicker, MultiSelect 등)
- [ ] API 필터 로직 구현
- [ ] 필터 상태 관리 (URL params)

### Phase 2: 통계 계산 로직 (2일)
- [ ] 모든 통계 지표 계산 함수 구현
- [ ] API 엔드포인트 생성
- [ ] 캐싱 전략 적용

### Phase 3: 엑셀 리포트 (2일)
- [ ] xlsx 라이브러리 통합
- [ ] 리포트 생성 API
- [ ] 다운로드 기능 구현

### Phase 4: 분석 대시보드 (3일)
- [ ] 차트 라이브러리 선택 (Recharts/Chart.js)
- [ ] 모든 차트 컴포넌트 구현
- [ ] 대시보드 레이아웃 구성
- [ ] 데이터 자동 새로고침

### Phase 5: 실시간 알림 (2일)
- [ ] 알림 테이블 생성
- [ ] DB 트리거 구현
- [ ] Supabase Realtime 통합
- [ ] 알림 UI 컴포넌트

**총 예상 기간**: 11일
**품질 검증**: 2일
**전체**: 13일

---

## 8. 기술 스택 선정

### 8.1 차트 라이브러리
- **선택**: Recharts
- **이유**: React 친화적, TypeScript 지원, 커스터마이징 용이

### 8.2 엑셀 라이브러리
- **선택**: xlsx (SheetJS)
- **이유**: 이미 설치됨, 풍부한 기능, 활발한 커뮤니티

### 8.3 날짜 라이브러리
- **선택**: date-fns
- **이유**: 경량, Tree-shaking 지원, 간단한 API

### 8.4 상태 관리
- **선택**: React Hook (useState, useEffect)
- **이유**: 현재 구조와 일관성, 추가 라이브러리 불필요

---

## 9. 성능 최적화 전략

### 9.1 쿼리 최적화
- 인덱스 활용 (이미 생성됨)
- JOIN 최소화 (필요시에만)
- 페이지네이션 필수 적용

### 9.2 캐싱 전략
- 통계 데이터: 5분 캐싱 (Redis or In-Memory)
- 필터 결과: 1분 캐싱
- 리포트 데이터: 캐싱 없음 (실시간)

### 9.3 프론트엔드 최적화
- 차트 데이터 메모이제이션 (useMemo)
- 무한 스크롤 또는 가상 스크롤
- Lazy loading 적용

---

**작성 완료**: 2025-11-01
**다음 단계**: API 엔드포인트 설계 및 구현 시작
