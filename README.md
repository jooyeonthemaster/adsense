# 애드센스 - 마케팅 상품 접수 시스템

B2B 마케팅 상품 접수 및 관리 플랫폼

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4 + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (@supabase/ssr)
- **Icons**: Lucide React

## 주요 기능

### 사용자(거래처) 기능
- 계정 기반 로그인 (관리자가 생성한 계정)
- 거래처별 맞춤 상품 가격 및 노출
- 4가지 마케팅 상품 접수
  - 플레이스 유입 접수
  - 영수증 리뷰 접수
  - 카카오맵 리뷰 접수
  - 블로그 배포 접수
- 포인트 시스템 (차감 방식)
- 접수 내역 조회 및 리포트 다운로드
- AS 신청 기능

### 관리자 기능
- 거래처 계정 관리 (생성, 수정, 삭제)
- 거래처별 상품 가격 설정
- 포인트 충전/환불/차감 관리
- 전체 접수 내역 조회 및 필터링
- 엑셀 리포트 생성 및 관리
- AS 요청 처리

## 시작하기

### 1. 의존성 설치

```bash
npm install --legacy-peer-deps
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 Supabase 정보를 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase 데이터베이스 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행
3. 데이터베이스 테이블 및 초기 데이터 생성 완료

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 데이터베이스 스키마

### 주요 테이블

- `clients` - 거래처 정보
- `admins` - 관리자 정보
- `product_categories` - 상품 카테고리
- `client_product_prices` - 거래처별 상품 가격
- `place_submissions` - 플레이스 유입 접수
- `receipt_review_submissions` - 영수증 리뷰 접수
- `kakaomap_review_submissions` - 카카오맵 리뷰 접수
- `blog_distribution_submissions` - 블로그 배포 접수
- `point_transactions` - 포인트 거래 내역
- `reports` - 리포트 파일
- `as_requests` - AS 신청

## 프로젝트 구조

```
├── app/                    # Next.js App Router 페이지
├── components/             # React 컴포넌트
│   └── ui/                # shadcn/ui 컴포넌트
├── lib/                   # 유틸리티 함수
├── types/                 # TypeScript 타입 정의
├── utils/                 # Supabase 클라이언트
│   └── supabase/
│       ├── client.ts     # 브라우저 클라이언트
│       ├── server.ts     # 서버 클라이언트
│       └── middleware.ts # 미들웨어 헬퍼
├── supabase/              # 데이터베이스 스키마
│   └── schema.sql        # SQL 스키마 파일
└── middleware.ts          # Next.js 미들웨어

```

## 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

### 프로덕션 서버 시작

```bash
npm start
```

## 기본 관리자 계정

데이터베이스 스키마 실행 후 기본 관리자 계정이 생성됩니다:

- **Username**: admin
- **Password**: admin123

**⚠️ 보안상 실제 배포 전에 반드시 비밀번호를 변경하세요!**

## 라이선스

Proprietary - 애드센스 내부 사용
