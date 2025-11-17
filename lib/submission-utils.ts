import { UnifiedSubmission } from '@/types/submission';
import { productConfig } from '@/config/submission-products';

/**
 * 진행률 계산
 */
export const calculateProgress = (submission: UnifiedSubmission): number => {
  if (submission.status === 'completed') return 100;
  if (submission.status === 'pending' || !submission.current_day) return 0;

  if (submission.total_days && submission.current_day) {
    return (submission.current_day / submission.total_days) * 100;
  }

  return 0;
};

/**
 * 날짜 포맷팅
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 상품 정보 가져오기
 */
export const getProductInfo = (submission: UnifiedSubmission) => {
  // 서브타입이 있는 경우 복합 키로 찾기
  if (submission.product_type === 'blog' && submission.distribution_type) {
    const key = `blog-${submission.distribution_type}` as keyof typeof productConfig;
    if (productConfig[key]) {
      return productConfig[key];
    }
    return productConfig['blog-video'];
  }

  if (submission.product_type === 'experience' && submission.experience_type) {
    const key = `experience-${submission.experience_type.replace('blog-experience', 'blog')}` as keyof typeof productConfig;
    if (productConfig[key]) {
      return productConfig[key];
    }
    return productConfig['experience-blog'];
  }

  // 기본 타입으로 찾기
  const config = productConfig[submission.product_type as keyof typeof productConfig];
  if (config) {
    return config;
  }

  // fallback
  return productConfig.place;
};

/**
 * 체험단 마케팅의 현재 진행 단계 계산 (타입별 동적)
 */
export const getExperienceStep = (
  submission: UnifiedSubmission
): { step: number; label: string; totalSteps: number } => {
  // Import dynamically to avoid circular dependency
  const { getWorkflowSteps } = require('@/lib/experience-deadline-utils');
  const steps = getWorkflowSteps(submission.experience_type || 'blog-experience');
  const totalSteps = steps.length;

  // Check completion status in reverse order (most advanced first)
  if (submission.campaign_completed) {
    return { step: totalSteps, label: '캠페인 완료', totalSteps };
  }

  let currentStep = 1;
  const stepLabels: Record<string, string> = {
    register: '블로거 등록',
    selection: '블로거 선택',
    schedule: '일정 등록',
    client_confirm: '고객 확인',
    publish: '컨텐츠 발행',
    keyword_ranking: '키워드 순위',
    complete: '캠페인 완료',
  };

  for (let i = 0; i < steps.length; i++) {
    const stepType = steps[i];
    currentStep = i + 1;

    // Check if this step is completed
    let isCompleted = false;
    switch (stepType) {
      case 'register':
        isCompleted = submission.bloggers_registered || false;
        break;
      case 'selection':
        isCompleted = submission.bloggers_selected || false;
        break;
      case 'schedule':
        isCompleted = submission.schedule_confirmed || false;
        break;
      case 'client_confirm':
        isCompleted = submission.client_confirmed || false;
        break;
      case 'publish':
        isCompleted = submission.all_published || false;
        break;
      case 'keyword_ranking':
        isCompleted = submission.all_published || false; // 발행 후 키워드 순위 체크
        break;
      case 'complete':
        isCompleted = submission.campaign_completed || false;
        break;
    }

    // If this step is not completed, this is the current step
    if (!isCompleted) {
      return { step: currentStep, label: stepLabels[stepType], totalSteps };
    }
  }

  // If all steps are completed (shouldn't reach here due to campaign_completed check)
  return { step: totalSteps, label: '캠페인 완료', totalSteps };
};

/**
 * 상태 표시 정보 가져오기
 */
export const getStatusDisplay = (submission: UnifiedSubmission) => {
  // 체험단 마케팅의 경우 세부 단계 표시
  if (submission.product_type === 'experience') {
    const { step, label, totalSteps } = getExperienceStep(submission);

    if (submission.campaign_completed) {
      return { label: '완료', variant: 'secondary' as const };
    }

    return {
      label: `${step}/${totalSteps} ${label}`,
      variant: 'default' as const,
    };
  }

  // 카페 침투의 경우 스크립트 상태 확인
  if (submission.product_type === 'cafe' && submission.script_status) {
    if (submission.script_status === 'writing') {
      return { label: '원고작성중', variant: 'outline' as const };
    } else if (submission.script_status === 'completed') {
      return { label: '원고작업완료', variant: 'default' as const };
    }
  }

  const statusMap: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
    pending: { label: '확인중', variant: 'outline' as const },
    waiting_content: { label: '콘텐츠 대기', variant: 'outline' as const },
    review: { label: '검수중', variant: 'default' as const },
    in_progress: { label: '구동중', variant: 'default' as const },
    completed: { label: '완료', variant: 'secondary' as const },
    cancelled: { label: '중단됨', variant: 'destructive' as const },
  };

  return statusMap[submission.status] || { label: submission.status, variant: 'outline' as const };
};

/**
 * 중단 가능 여부 확인
 */
export const canCancel = (submission: UnifiedSubmission): boolean => {
  return ['pending', 'in_progress'].includes(submission.status);
};

/**
 * 상세 정보 표시
 */
export const getDetailInfo = (submission: UnifiedSubmission): string => {
  switch (submission.product_type) {
    case 'place':
      return `${submission.daily_count?.toLocaleString()}타 × ${submission.total_days}일`;
    case 'receipt':
    case 'kakaomap':
      return `${submission.daily_count}건/일 × ${Math.ceil((submission.total_count || 0) / (submission.daily_count || 1))}일`;
    case 'blog':
      return `${submission.daily_count}건/일 × ${submission.total_days}일 (${submission.distribution_type})`;
    case 'cafe':
      return `${submission.total_count}건 (${submission.cafe_list?.length || 0}개 카페)`;
    case 'experience':
      return `${submission.team_count}팀 (${submission.experience_type})`;
    default:
      return '-';
  }
};

/**
 * 예상 건수 계산 (AS 요청용)
 */
export const calculateExpectedCount = (submission: any): number => {
  if (submission.total_count) return submission.total_count;
  if (submission.daily_count && submission.total_days) {
    return submission.daily_count * submission.total_days;
  }
  return 0;
};

/**
 * 제출 라벨 포맷팅 (AS 요청용)
 */
export const formatSubmissionLabel = (submission: any): string => {
  const productInfo = getProductInfo(submission);
  const detailInfo = getDetailInfo(submission);
  return `${productInfo.label} - ${submission.company_name} (${detailInfo})`;
};
