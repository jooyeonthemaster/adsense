import { SubmissionStatus } from '@/types/submission';

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: '대기중',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
  as_in_progress: 'AS 진행중',
  cancellation_requested: '중단요청',
};

export const STATUS_VARIANTS: Record<
  SubmissionStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'outline',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  as_in_progress: 'default',
  cancellation_requested: 'destructive',
};

export const TYPE_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
  cafe: '카페 침투',
  experience: '체험단',
};
