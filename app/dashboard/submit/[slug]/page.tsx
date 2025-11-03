/**
 * ============================================================================
 * [UPDATED] 동적 상품 제출 페이지 - 동적 폼 로직 제거 (2025-11-02)
 * ============================================================================
 *
 * 변경 내용:
 * - product_categories 테이블 조회 제거
 * - DynamicFormRenderer 사용 안 함
 * - PRODUCT_CONFIG만 사용하여 4가지 고정 상품 라우팅
 *
 * 지원하는 slug:
 * - place-traffic, receipt-review, kakaomap-review, blog-distribution
 * - blog-reviewer, blog-video, blog-automation (블로그 하위 타입)
 *
 * 관련 문서: claudedocs/CUSTOM_PRODUCT_ANALYSIS.md
 * ============================================================================
 */

import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { PlaceSubmissionForm } from '../place/place-submission-form';
import { ReceiptSubmissionForm } from '../receipt/receipt-submission-form';
import { KakaomapSubmissionForm } from '../kakaomap/kakaomap-submission-form';
import { BlogSubmissionForm } from '../blog/blog-submission-form';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 4가지 고정 상품 + 블로그 하위 타입 설정
const PRODUCT_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    formComponent: any;
  }
> = {
  'place-traffic': {
    title: '플레이스 유입 접수',
    description: '네이버 플레이스 유입 서비스를 신청합니다',
    formComponent: PlaceSubmissionForm,
  },
  'receipt-review': {
    title: '영수증 리뷰 접수',
    description: '영수증 기반 리뷰 작성 서비스를 신청합니다',
    formComponent: ReceiptSubmissionForm,
  },
  'kakaomap-review': {
    title: '카카오맵 리뷰 접수',
    description: '카카오맵 리뷰 작성 서비스를 신청합니다',
    formComponent: KakaomapSubmissionForm,
  },
  'blog-distribution': {
    title: '블로그 배포 접수',
    description: '블로그 콘텐츠 배포 서비스를 신청합니다',
    formComponent: BlogSubmissionForm,
  },
  // 블로그 하위 타입 (동일 컴포넌트 사용)
  'blog-reviewer': {
    title: '블로그 배포 접수 (리뷰어형)',
    description: '블로그 콘텐츠 배포 서비스를 신청합니다',
    formComponent: BlogSubmissionForm,
  },
  'blog-video': {
    title: '블로그 배포 접수 (영상형)',
    description: '블로그 콘텐츠 배포 서비스를 신청합니다',
    formComponent: BlogSubmissionForm,
  },
  'blog-automation': {
    title: '블로그 배포 접수 (자동화형)',
    description: '블로그 콘텐츠 배포 서비스를 신청합니다',
    formComponent: BlogSubmissionForm,
  },
};

export default async function SubmissionPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await requireAuth(['client']);

  // Get fresh points from database instead of session
  const supabase = await createClient();
  const { data: client } = await supabase
    .from('clients')
    .select('points')
    .eq('id', user.id)
    .single();

  const currentPoints = client?.points || 0;

  // PRODUCT_CONFIG에 없는 slug는 404
  const config = PRODUCT_CONFIG[slug];
  if (!config) {
    notFound();
  }

  // 블로그 관련 slug 처리
  const isBlogSlug = ['blog-distribution', 'blog-reviewer', 'blog-video', 'blog-automation'].includes(slug);

  let pricePerUnit = null;
  let reviewerPrice = null;
  let videoPrice = null;
  let automationPrice = null;

  if (isBlogSlug) {
    // 블로그 하위 타입별 단가 조회
    reviewerPrice = await getProductPrice(user.id, 'blog-reviewer');
    videoPrice = await getProductPrice(user.id, 'blog-video');
    automationPrice = await getProductPrice(user.id, 'blog-automation');
    const distributionPrice = await getProductPrice(user.id, 'blog-distribution');

    // 하나라도 접근 가능하면 OK
    if (!reviewerPrice && !videoPrice && !automationPrice && !distributionPrice) {
      redirect('/dashboard');
    }

    // 우선순위: 하위 타입 > 배포 타입
    pricePerUnit = reviewerPrice || videoPrice || automationPrice || distributionPrice;

    // 배포 단가만 있으면 모든 하위 타입에 적용
    if (!reviewerPrice && !videoPrice && !automationPrice && distributionPrice) {
      reviewerPrice = distributionPrice;
      videoPrice = distributionPrice;
      automationPrice = distributionPrice;
    }
  } else {
    // 일반 상품 단가 조회
    pricePerUnit = await getProductPrice(user.id, slug);
    if (!pricePerUnit) {
      redirect('/dashboard');
    }
  }

  const FormComponent = config.formComponent;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{config.title}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{config.description}</p>
      </div>

      {isBlogSlug ? (
        <FormComponent
          clientId={user.id}
          reviewerPrice={reviewerPrice}
          videoPrice={videoPrice}
          automationPrice={automationPrice}
          currentPoints={currentPoints}
        />
      ) : (
        <FormComponent
          clientId={user.id}
          pricePerUnit={pricePerUnit}
          currentPoints={currentPoints}
        />
      )}
    </div>
  );
}
