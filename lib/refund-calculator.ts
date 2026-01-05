/**
 * 환불 금액 계산 유틸리티
 * 중단 요청 시 자동으로 환불 금액을 계산
 */

import { SubmissionType } from '@/types/cancellation-request';

// 상품별 수수료율 (현재 모두 0%)
const SERVICE_FEES: Record<SubmissionType, number> = {
  blog: 0,
  cafe: 0,
  kakaomap: 0,
  receipt: 0,
  place: 0,
};

export interface RefundCalculationParams {
  totalPoints: number;
  progressRate: number;
  submissionType: SubmissionType;
}

export interface RefundCalculationResult {
  totalPoints: number;
  progressRate: number;
  completedPoints: number;
  remainingPoints: number;
  serviceFeeRate: number;
  serviceFee: number;
  calculatedRefund: number;
}

/**
 * 환불 금액 계산
 * 기본 공식: (미진행분 포인트) * (1 - 수수료율)
 */
export function calculateRefund(params: RefundCalculationParams): RefundCalculationResult {
  const { totalPoints, progressRate, submissionType } = params;

  // 진행된 비율 (0~1)
  const progressRatio = Math.min(Math.max(progressRate, 0), 100) / 100;

  // 진행된 금액
  const completedPoints = Math.floor(totalPoints * progressRatio);

  // 미진행 금액
  const remainingPoints = totalPoints - completedPoints;

  // 수수료율
  const serviceFeeRate = SERVICE_FEES[submissionType] || 0;

  // 수수료 금액
  const serviceFee = Math.floor(remainingPoints * serviceFeeRate);

  // 최종 환불 금액
  const calculatedRefund = remainingPoints - serviceFee;

  return {
    totalPoints,
    progressRate,
    completedPoints,
    remainingPoints,
    serviceFeeRate,
    serviceFee,
    calculatedRefund: Math.max(0, calculatedRefund), // 음수 방지
  };
}

/**
 * 진행률 계산 (완료 수량 / 총 수량)
 */
export function calculateProgressRate(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const rate = (completedCount / totalCount) * 100;
  return Math.min(Math.max(rate, 0), 100); // 0~100 사이로 제한
}

/**
 * 환불 금액 포맷팅
 */
export function formatRefundAmount(amount: number): string {
  return amount.toLocaleString() + 'P';
}

/**
 * 수수료율 레이블
 */
export function getServiceFeeLabel(submissionType: SubmissionType): string {
  const feeRate = SERVICE_FEES[submissionType] || 0;
  return `${Math.round(feeRate * 100)}%`;
}

/**
 * 상품 유형 레이블
 */
export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  place: '플레이스 유입',
  receipt: '네이버 영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
  cafe: '카페 마케팅',
};

export function getSubmissionTypeLabel(type: SubmissionType): string {
  return SUBMISSION_TYPE_LABELS[type] || type;
}
