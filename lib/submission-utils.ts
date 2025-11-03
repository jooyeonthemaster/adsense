import { AnySubmission } from '@/types/submission';

/**
 * Submission 타입별로 예정 수량(expected_count)을 계산합니다.
 *
 * - place: daily_count × total_days
 * - receipt: total_count
 * - kakaomap: total_count
 * - blog: total_count
 * - dynamic: form_data에서 추출 (복잡)
 */
export function calculateExpectedCount(submission: AnySubmission): number {
  switch (submission.type) {
    case 'place':
      return submission.daily_count * submission.total_days;

    case 'receipt':
    case 'kakaomap':
    case 'blog':
      return submission.total_count;

    case 'dynamic':
      // Dynamic submission은 form_data에서 수량 정보 추출
      // form_data 구조에 따라 로직 조정 필요
      const formData = submission.form_data as Record<string, any>;

      // 일반적인 패턴: total_count, daily_count, quantity 등
      if (formData.total_count) return Number(formData.total_count);
      if (formData.daily_count && formData.total_days) {
        return Number(formData.daily_count) * Number(formData.total_days);
      }
      if (formData.quantity) return Number(formData.quantity);

      // 기본값
      return 0;

    default:
      return 0;
  }
}

/**
 * Submission을 드롭다운에 표시할 레이블로 포맷팅합니다.
 *
 * 예시:
 * - "플레이스 유입 - 테스트 업체 - 300타 (일 100타 × 3일) - 2025.11.03"
 * - "영수증 리뷰 - 테스트 업체 - 50개 - 2025.11.03"
 */
export function formatSubmissionLabel(submission: AnySubmission): string {
  const TYPE_LABELS: Record<string, string> = {
    place: '플레이스 유입',
    receipt: '영수증 리뷰',
    kakaomap: '카카오맵 리뷰',
    blog: '블로그 배포',
    dynamic: '기타',
  };

  const typeLabel = TYPE_LABELS[submission.type] || submission.type;
  const date = new Date(submission.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const expectedCount = calculateExpectedCount(submission);

  // 플레이스 유입: 상세 정보 포함 (일일 수량 × 일수)
  if (submission.type === 'place') {
    return `${typeLabel} - ${submission.company_name} - ${expectedCount.toLocaleString()}타 (일 ${submission.daily_count.toLocaleString()}타 × ${submission.total_days}일) - ${date}`;
  }

  // 블로그 배포: 상세 정보 포함 (일일 수량 × 일수)
  if (submission.type === 'blog') {
    return `${typeLabel} - ${submission.company_name} - ${expectedCount.toLocaleString()}개 (일 ${submission.daily_count.toLocaleString()}개 × ${submission.total_days}일) - ${date}`;
  }

  // 영수증/카카오맵: 총 수량만 표시
  return `${typeLabel} - ${submission.company_name} - ${expectedCount.toLocaleString()}개 - ${date}`;
}

/**
 * Submission의 상세 설명을 생성합니다.
 * AS 신청 폼에서 자동으로 채워질 때 사용됩니다.
 */
export function getSubmissionDetails(submission: AnySubmission): string {
  switch (submission.type) {
    case 'place':
      return `일 ${submission.daily_count.toLocaleString()}타 × ${submission.total_days}일 (총 ${calculateExpectedCount(submission).toLocaleString()}타)`;

    case 'blog':
      return `일 ${submission.daily_count.toLocaleString()}개 × ${submission.total_days}일 (총 ${calculateExpectedCount(submission).toLocaleString()}개)`;

    case 'receipt':
    case 'kakaomap':
      return `총 ${submission.total_count.toLocaleString()}개`;

    case 'dynamic':
      const count = calculateExpectedCount(submission);
      const categoryName = submission.product_categories?.name || '기타 상품';
      return `${categoryName} - 총 ${count.toLocaleString()}개`;

    default:
      return '-';
  }
}
